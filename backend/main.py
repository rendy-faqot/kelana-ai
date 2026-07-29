import logging

from botocore.exceptions import ClientError
from fastapi import Depends, FastAPI, HTTPException, Response, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from services.trips_service import (
    calculate_daily_budget,
    get_trip_category
)
from services.bedrock_service import (
    get_chat_response,
    get_ai_recommendation
)
from services.auth_service import get_current_user, login, oauth2_scheme, register
from services.kb_service import retrieve_and_generate
from models import Conversation, Message, Trip, User
from database import SessionLocal, init_db
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger(__name__)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=r"^http://(localhost|127\.0\.0\.1):\d+$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

init_db()

# a GET endpoint at the root path
@app.get("/")
def home():
    return {
        "message": "Welcome to KelanaAI API",  
    }

# health check endpoint
@app.get("/health")
def health_check():
    return {
        "status": "OK",
    }

class TripRequest(BaseModel):
    destination: str
    days: int
    budget: float
    travel_style: str


class AskRequest(BaseModel):
    question: str


class AskResponse(BaseModel):
    question: str
    answer: str
    documents: list[str]


class RegisterRequest(BaseModel):
    name: str
    email: str
    password: str


class LoginRequest(BaseModel):
    email: str
    password: str


class UserResponse(BaseModel):
    id: int
    name: str
    email: str


class ProfileResponse(BaseModel):
    id: int
    name: str
    email: str
    total_trips: int


class TokenResponse(BaseModel):
    access_token: str
    token_type: str


class MessageResponse(BaseModel):
    message: str


class CreateConversationRequest(BaseModel):
    title: str | None = None


class CreateConversationResponse(BaseModel):
    conversation_id: int


class UpdateConversationRequest(BaseModel):
    title: str


class ConversationResponse(BaseModel):
    id: int
    title: str | None
    created_at: str


class SendMessageRequest(BaseModel):
    message: str


class SendMessageResponse(BaseModel):
    response: str


class ChatMessageResponse(BaseModel):
    id: int
    role: str
    content: str
    created_at: str


@app.post("/api/v1/auth/register", status_code=status.HTTP_201_CREATED)
def register_user(request: RegisterRequest):
    try:
        user = register(
            name=request.name,
            email=request.email,
            password=request.password,
        )
        return UserResponse(
            id=user.id,
            name=user.name,
            email=user.email,
        )
    except ValueError as exc:
        raise HTTPException(
            status_code=409,
            detail=str(exc),
        ) from exc


@app.post("/api/v1/auth/login", response_model=TokenResponse)
def login_user(request: LoginRequest):
    try:
        return login(
            email=request.email,
            password=request.password,
        )
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(exc),
        ) from exc


@app.post("/api/v1/auth/logout", response_model=MessageResponse)
def logout_user(token: str = Depends(oauth2_scheme)):
    get_current_user(token)
    return {"message": "Logged out successfully"}


@app.get("/api/v1/auth/me", response_model=ProfileResponse)
def get_profile(token: str = Depends(oauth2_scheme)):
    user = get_current_user(token)
    db = SessionLocal()
    try:
        total_trips = db.query(Trip).filter(Trip.user_id == user.id).count()
        return ProfileResponse(
            id=user.id,
            name=user.name,
            email=user.email,
            total_trips=total_trips,
        )
    finally:
        db.close()


@app.post(
    "/api/v1/conversations",
    response_model=CreateConversationResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_conversation(
        request: CreateConversationRequest | None = None,
        token: str = Depends(oauth2_scheme),
    ):
    user = get_current_user(token)
    conversation = Conversation(
        user_id=user.id,
        title=request.title if request else None,
    )

    db = SessionLocal()
    try:
        db.add(conversation)
        db.commit()
        db.refresh(conversation)
        return CreateConversationResponse(conversation_id=conversation.id)
    finally:
        db.close()


@app.get("/api/v1/conversations", response_model=list[ConversationResponse])
def list_conversations(token: str = Depends(oauth2_scheme)):
    user = get_current_user(token)
    db = SessionLocal()
    try:
        conversations = (
            db.query(Conversation)
            .filter(Conversation.user_id == user.id)
            .order_by(Conversation.created_at.desc())
            .all()
        )
        return [
            ConversationResponse(
                id=conversation.id,
                title=conversation.title,
                created_at=conversation.created_at.isoformat(),
            )
            for conversation in conversations
        ]
    finally:
        db.close()


@app.patch("/api/v1/conversations/{id}", response_model=ConversationResponse)
def update_conversation(
        id: int,
        request: UpdateConversationRequest,
        token: str = Depends(oauth2_scheme),
    ):
    user = get_current_user(token)
    db = SessionLocal()

    try:
        conversation = (
            db.query(Conversation)
            .filter(
                Conversation.id == id,
                Conversation.user_id == user.id,
            )
            .first()
        )
        if conversation is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Conversation not found",
            )

        title = request.title.strip()
        if not title:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Conversation title cannot be empty",
            )

        conversation.title = title
        db.commit()
        db.refresh(conversation)

        return ConversationResponse(
            id=conversation.id,
            title=conversation.title,
            created_at=conversation.created_at.isoformat(),
        )
    finally:
        db.close()


@app.get(
    "/api/v1/conversations/{id}/messages",
    response_model=list[ChatMessageResponse],
)
def list_conversation_messages(
        id: int,
        token: str = Depends(oauth2_scheme),
    ):
    user = get_current_user(token)
    db = SessionLocal()

    try:
        conversation = (
            db.query(Conversation)
            .filter(
                Conversation.id == id,
                Conversation.user_id == user.id,
            )
            .first()
        )
        if conversation is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Conversation not found",
            )

        messages = (
            db.query(Message)
            .filter(Message.conversation_id == conversation.id)
            .order_by(Message.created_at.asc(), Message.id.asc())
            .all()
        )

        return [
            ChatMessageResponse(
                id=message.id,
                role=message.role,
                content=message.content,
                created_at=message.created_at.isoformat(),
            )
            for message in messages
        ]
    finally:
        db.close()


@app.post(
    "/api/v1/conversations/{id}/messages",
    response_model=SendMessageResponse,
)
def send_message(
        id: int,
        request: SendMessageRequest,
        token: str = Depends(oauth2_scheme),
    ):
    user = get_current_user(token)
    db = SessionLocal()

    try:
        conversation = (
            db.query(Conversation)
            .filter(
                Conversation.id == id,
                Conversation.user_id == user.id,
            )
            .first()
        )
        if conversation is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Conversation not found",
            )

        user_message = Message(
            conversation_id=conversation.id,
            role="user",
            content=request.message,
        )
        db.add(user_message)
        db.commit()

        messages = (
            db.query(Message)
            .filter(Message.conversation_id == conversation.id)
            .order_by(Message.created_at.asc(), Message.id.asc())
            .all()
        )

        ai_response = get_chat_response(messages)
        assistant_message = Message(
            conversation_id=conversation.id,
            role="assistant",
            content=ai_response,
        )
        db.add(assistant_message)
        db.commit()

        return SendMessageResponse(response=ai_response)
    except ClientError as exc:
        db.rollback()
        error = exc.response.get("Error", {})
        metadata = exc.response.get("ResponseMetadata", {})
        error_code = error.get("Code", "BedrockError")
        error_message = error.get("Message", "No error message returned")
        request_id = metadata.get("RequestId", "unknown")
        http_status = metadata.get("HTTPStatusCode", "unknown")

        logger.exception(
            "Bedrock chat request failed: code=%s message=%s request_id=%s http_status=%s",
            error_code,
            error_message,
            request_id,
            http_status,
        )

        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Bedrock request failed: {error_code} - {error_message}",
        ) from exc
    finally:
        db.close()


@app.post("/api/v1/ask", response_model=AskResponse)
def ask_knowledge_base(request: AskRequest):
    try:
        result = retrieve_and_generate(request.question)
        return AskResponse(
            question=request.question,
            answer=result["answer"],
            documents=result["documents"],
        )
    except ClientError as exc:
        error = exc.response.get("Error", {})
        metadata = exc.response.get("ResponseMetadata", {})
        error_code = error.get("Code", "KnowledgeBaseError")
        error_message = error.get("Message", "No error message returned")
        request_id = metadata.get("RequestId", "unknown")
        http_status = metadata.get("HTTPStatusCode", "unknown")

        logger.exception(
            "Knowledge Base request failed: code=%s message=%s request_id=%s http_status=%s",
            error_code,
            error_message,
            request_id,
            http_status,
        )

        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Knowledge Base request failed: {error_code} - {error_message}",
        ) from exc

# FastAPI validates the JSON body against this model
# If a field is missing or wrong type, it returns 422 automatically

# POST endpoint — receives JSON, returns JSON
@app.post("/api/v1/trips")
def create_trip(
        request: TripRequest,
        token: str = Depends(oauth2_scheme),
    ):
    user = get_current_user(token)
    daily_budget = calculate_daily_budget(
        request.budget, request.days
    )
    category = get_trip_category(
        request.budget
    )
    try:
        ai_recommendation = get_ai_recommendation(request)
    except ClientError as exc:
        error = exc.response.get("Error", {})
        metadata = exc.response.get("ResponseMetadata", {})
        error_code = error.get("Code", "BedrockError")
        error_message = error.get("Message", "No error message returned")
        request_id = metadata.get("RequestId", "unknown")
        http_status = metadata.get("HTTPStatusCode", "unknown")

        logger.exception(
            "Bedrock request failed: code=%s message=%s request_id=%s http_status=%s",
            error_code,
            error_message,
            request_id,
            http_status,
        )

        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Bedrock request failed: {error_code} - {error_message}",
        ) from exc
    # create a Trip ORM object
    trip = Trip(
        user_id      = user.id,
        destination  = request.destination,
        days         = request.days,
        budget       = request.budget,
        category     = category,
        daily_budget = daily_budget,
        ai_recommendation = ai_recommendation
    )
    # save to PostgreSQL
    db = SessionLocal()
    db.add(trip)
    db.commit()
    db.refresh(trip)   # get the auto-generated id
    db.close()

    return trip


# List of trip categories
@app.get("/api/v1/trip-categories")
def list_trip_categories():
    # This is a placeholder implementation - replace with actual category listing logic
    return [
        "Backpacker",
        "Standard",
        "Luxury"   
    ]

@app.get("/api/v1/trips")
def list_trips(token: str = Depends(oauth2_scheme)):
    user = get_current_user(token)
    db = SessionLocal()
    trips = db.query(Trip).filter(Trip.user_id == user.id).all()
    db.close()
    return trips

@app.get("/api/v1/trips/{trip_id}")
def get_trip(trip_id: int, token: str = Depends(oauth2_scheme)):
    user = get_current_user(token)
    db = SessionLocal()
    trip = db.query(Trip).filter(
        Trip.id == trip_id,
        Trip.user_id == user.id
    ).first()
    if trip is None:
        db.close()
        raise HTTPException(
            status_code=404,
            detail="Trip not found"
        )
    db.close()
    return trip

@app.delete("/api/v1/trips/{trip_id}")
def delete_trip(trip_id: int, token: str = Depends(oauth2_scheme)):
    user = get_current_user(token)
    db = SessionLocal()
    trip = db.query(Trip).filter(
        Trip.id == trip_id,
        Trip.user_id == user.id
    ).first()
    if trip:
        db.delete(trip)
        db.commit()
    db.close()
    # return {"message": "Trip deleted successfully"}
    return Response(status_code=status.HTTP_204_NO_CONTENT)

@app.put("/api/v1/trips/{trip_id}")
def update_trip(
        trip_id: int,
        request: TripRequest,
        token: str = Depends(oauth2_scheme),
    ):
    user = get_current_user(token)
    db = SessionLocal()
    trip = db.query(Trip).filter(
        Trip.id == trip_id,
        Trip.user_id == user.id
    ).first()
    if trip is None:
        db.close()
        raise HTTPException(
            status_code=404,
            detail="Trip not found"
        )
    
    trip.destination = request.destination
    trip.days = request.days
    trip.budget = request.budget

    daily_budget = calculate_daily_budget(
        request.budget, request.days
    )
    category = get_trip_category(
        request.budget
    )
    trip.daily_budget = daily_budget
    trip.category = category
    db.commit()
    db.refresh(trip)
    db.close()
    return trip
