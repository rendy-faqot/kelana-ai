from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, field_validator
from typing import Optional
import os
from dotenv import load_dotenv
from services.trip_service import (
    calculate_daily_budget,
    get_trip_category,
    get_transportation_recommendation
)
from services.bedrock_service import get_ai_recommendation, get_chat_response
from services.kb_service import retrieve_and_generate
from services.auth_service import register_user, login_user, get_current_user
from models.trip import Trip
from models.user import User
from models.conversation import Conversation, Message
from database import SessionLocal, init_db

load_dotenv()


# ── Request schemas ───────────────────────────────────────────────────────────

class TripRequest(BaseModel):
    destination:  str
    days:         int
    budget:       float
    travel_style: str

class TripUpdateRequest(BaseModel):
    budget:       Optional[float] = None
    days:         Optional[int]   = None
    travel_style: Optional[str]   = None

class RegisterRequest(BaseModel):
    name:     str
    email:    str
    password: str

    @field_validator("email")
    @classmethod
    def email_must_contain_at(cls, v: str) -> str:
        if "@" not in v or "." not in v.split("@")[-1]:
            raise ValueError("Invalid email address")
        return v.lower().strip()

class LoginRequest(BaseModel):
    email:    str
    password: str

    @field_validator("email")
    @classmethod
    def email_must_contain_at(cls, v: str) -> str:
        if "@" not in v or "." not in v.split("@")[-1]:
            raise ValueError("Invalid email address")
        return v.lower().strip()

class AskRequest(BaseModel):
    question: str

class MessageRequest(BaseModel):
    content: str


# ── App setup ─────────────────────────────────────────────────────────────────

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=[os.getenv("FRONTEND_URL", "http://localhost:3000")],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

init_db()


# ── Public endpoints ──────────────────────────────────────────────────────────

@app.get("/health")
def health():
    return {"status": "OK"}

@app.get("/")
def home():
    return {"message": "Welcome to KelanaAI"}

@app.post("/api/v1/auth/register", status_code=201)
def register(request: RegisterRequest):
    db = SessionLocal()
    try:
        user = register_user(
            db       = db,
            name     = request.name,
            email    = request.email,
            password = request.password,
        )
        return {
            "id":         user.id,
            "name":       user.name,
            "email":      user.email,
            "created_at": user.created_at,
        }
    except ValueError as e:
        raise HTTPException(status_code=409, detail=str(e))
    finally:
        db.close()

@app.post("/api/v1/auth/login")
def login(request: LoginRequest):
    db = SessionLocal()
    try:
        return login_user(db=db, email=request.email, password=request.password)
    except ValueError as e:
        raise HTTPException(status_code=401, detail=str(e))
    finally:
        db.close()


@app.get("/api/v1/auth/me")
def me(current_user: User = Depends(get_current_user)):
    db = SessionLocal()
    try:
        trip_count = db.query(Trip).filter(Trip.user_id == current_user.id).count()
    finally:
        db.close()
    return {
        "id":          current_user.id,
        "name":        current_user.name,
        "email":       current_user.email,
        "created_at":  current_user.created_at,
        "total_trips": trip_count,
    }


@app.post("/api/v1/ask")
def ask(request: AskRequest):
    try:
        result = retrieve_and_generate(request.question)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    return {
        "question": request.question,
        "answer": result["answer"],
        "source": result["source"],
    }


# ── Protected conversation endpoints ─────────────────────────────────────────

@app.post("/api/v1/conversations", status_code=201)
def create_conversation(current_user: User = Depends(get_current_user)):
    conversation = Conversation(user_id=current_user.id)
    db = SessionLocal()
    try:
        db.add(conversation)
        db.commit()
        db.refresh(conversation)
        return {"conversation_id": conversation.id}
    finally:
        db.close()

@app.get("/api/v1/conversations")
def list_conversations(current_user: User = Depends(get_current_user)):
    db = SessionLocal()
    try:
        return db.query(Conversation).filter(
            Conversation.user_id == current_user.id,
        ).all()
    finally:
        db.close()

@app.post("/api/v1/conversations/{conversation_id}/messages", status_code=201)
def create_conversation_message(
    conversation_id: int,
    request: MessageRequest,
    current_user: User = Depends(get_current_user),
):
    db = SessionLocal()
    try:
        conversation = db.query(Conversation).filter(
            Conversation.id == conversation_id,
            Conversation.user_id == current_user.id,
        ).first()
        if conversation is None:
            raise HTTPException(
                status_code=404,
                detail=f"Conversation {conversation_id} not found",
            )

        user_message = Message(
            conversation_id=conversation.id,
            role="user",
            content=request.content,
        )
        db.add(user_message)
        db.flush()

        messages = db.query(Message).filter(
            Message.conversation_id == conversation.id,
        ).order_by(Message.created_at, Message.id).all()
        prompt = [
            {
                "role": message.role,
                "content": message.content,
            }
            for message in messages
        ]

        answer = get_chat_response(prompt)
        assistant_message = Message(
            conversation_id=conversation.id,
            role="assistant",
            content=answer,
        )
        db.add(assistant_message)
        db.commit()
        db.refresh(user_message)
        db.refresh(assistant_message)
        return {
            "conversation_id": conversation.id,
            "message_id": user_message.id,
            "assistant_message_id": assistant_message.id,
            "answer": answer,
        }
    except ValueError as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()

@app.get("/api/v1/conversations/{conversation_id}/messages")
def list_conversation_messages(
    conversation_id: int,
    current_user: User = Depends(get_current_user),
):
    db = SessionLocal()
    try:
        conversation = db.query(Conversation).filter(
            Conversation.id == conversation_id,
            Conversation.user_id == current_user.id,
        ).first()
        if conversation is None:
            raise HTTPException(
                status_code=404,
                detail=f"Conversation {conversation_id} not found",
            )

        return db.query(Message).filter(
            Message.conversation_id == conversation.id,
        ).order_by(Message.created_at, Message.id).all()
    finally:
        db.close()


# ── Protected trip endpoints ──────────────────────────────────────────────────

@app.post("/api/v1/trips")
def create_trip(
    request: TripRequest,
    current_user: User = Depends(get_current_user),
):
    daily_budget = calculate_daily_budget(request.budget, request.days)
    category     = get_trip_category(request.budget)
    ai_recommendation = get_ai_recommendation(
        destination  = request.destination,
        days         = request.days,
        budget       = request.budget,
        travel_style = request.travel_style,
    )
    trip = Trip(
        user_id           = current_user.id,
        destination       = request.destination,
        days              = request.days,
        budget            = request.budget,
        travel_style      = request.travel_style,
        category          = category,
        daily_budget      = daily_budget,
        ai_recommendation = ai_recommendation,
    )
    db = SessionLocal()
    try:
        db.add(trip)
        db.commit()
        db.refresh(trip)
        return trip
    finally:
        db.close()

@app.get("/api/v1/trips")
def list_trips(current_user: User = Depends(get_current_user)):
    db = SessionLocal()
    try:
        return db.query(Trip).filter(Trip.user_id == current_user.id).all()
    finally:
        db.close()

@app.get("/api/v1/trips/{trip_id}")
def get_trip(trip_id: int, current_user: User = Depends(get_current_user)):
    db = SessionLocal()
    try:
        trip = db.query(Trip).filter(
            Trip.id == trip_id,
            Trip.user_id == current_user.id,
        ).first()
    finally:
        db.close()
    if trip is None:
        raise HTTPException(status_code=404, detail=f"Trip {trip_id} not found")
    return trip

@app.put("/api/v1/trips/{trip_id}")
def update_trip(
    trip_id: int,
    request: TripUpdateRequest,
    current_user: User = Depends(get_current_user),
):
    db = SessionLocal()
    try:
        trip = db.query(Trip).filter(
            Trip.id == trip_id,
            Trip.user_id == current_user.id,
        ).first()
        if trip is None:
            raise HTTPException(status_code=404, detail=f"Trip {trip_id} not found")

        if request.budget is not None:
            trip.budget = request.budget
        if request.days is not None:
            trip.days = request.days
        if request.travel_style is not None:
            trip.travel_style = request.travel_style

        trip.daily_budget = calculate_daily_budget(trip.budget, trip.days)
        trip.category     = get_trip_category(trip.budget)

        db.commit()
        db.refresh(trip)
        return trip
    finally:
        db.close()

@app.delete("/api/v1/trips/{trip_id}")
def delete_trip(trip_id: int, current_user: User = Depends(get_current_user)):
    db = SessionLocal()
    try:
        trip = db.query(Trip).filter(
            Trip.id == trip_id,
            Trip.user_id == current_user.id,
        ).first()
        if trip is None:
            raise HTTPException(status_code=404, detail=f"Trip {trip_id} not found")
        db.delete(trip)
        db.commit()
        return {"message": f"Trip {trip_id} deleted successfully"}
    finally:
        db.close()
