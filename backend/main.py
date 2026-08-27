from fastapi import FastAPI, HTTPException
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
from services.bedrock_service import get_ai_recommendation
from services.auth_service import register_user
from models.trip import Trip
from database import SessionLocal, init_db

load_dotenv()

class TripRequest(BaseModel):
	destination: 	str
	days: 		    int
	budget:		    float
	travel_style:	str

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

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=[os.getenv("FRONTEND_URL", "http://localhost:3000")],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

init_db()

# a GET endpoint for health
@app.get("/health")
def health():
  return {
    "status" : "OK"
  }

# a GET endpoint at the root path
@app.get("/")
def home():
  return {
    "message" : "Welcome to KelanaAI"
  }

# POST endpoint — register a new user
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

# POST endpoint — receives JSON, returns JSON
@app.post("/api/v1/trips")
def create_trip(request: TripRequest):
    daily_budget = calculate_daily_budget(
        request.budget, request.days
    )
    category = get_trip_category(
        request.budget
    )
    ai_recommendation = get_ai_recommendation(
        destination=request.destination,
        days=request.days,
        budget=request.budget,
        travel_style=request.travel_style,
    )
    # create a Trip ORM object
    trip = Trip(
        destination       = request.destination,
        days              = request.days,
        budget            = request.budget,
        travel_style      = request.travel_style,
        category          = category,
        daily_budget      = daily_budget,
        ai_recommendation = ai_recommendation,
    )

    #save to PostgreSQL
    db = SessionLocal()
    db.add(trip)
    db.commit()
    db.refresh(trip)   # get the auto-generated id
    db.close()
    return trip

@app.get("/api/v1/trips")
def list_trips():
    db = SessionLocal()
    trips = db.query(Trip).all()
    db.close()
    return trips

@app.get("/api/v1/trips/{trip_id}")
def get_trip(trip_id: int):
    db = SessionLocal()
    trip = db.query(Trip).filter(Trip.id == trip_id).first()
    db.close()
    if trip is None:
        raise HTTPException(status_code=404, detail=f"Trip with id {trip_id} not found")
    return trip

# PUT endpoint — update budget/days/travel_style, recalculate derived fields
@app.put("/api/v1/trips/{trip_id}")
def update_trip(trip_id: int, request: TripUpdateRequest):
    db = SessionLocal()
    trip = db.query(Trip).filter(Trip.id == trip_id).first()
    if trip is None:
        db.close()
        raise HTTPException(status_code=404, detail=f"Trip with id {trip_id} not found")

    if request.budget is not None:
        trip.budget = request.budget
    if request.days is not None:
        trip.days = request.days
    if request.travel_style is not None:
        trip.travel_style = request.travel_style

    # recalculate derived fields
    trip.daily_budget = calculate_daily_budget(trip.budget, trip.days)
    trip.category     = get_trip_category(trip.budget)

    db.commit()
    db.refresh(trip)
    db.close()
    return trip

# DELETE endpoint — remove a trip by id
@app.delete("/api/v1/trips/{trip_id}")
def delete_trip(trip_id: int):
    db = SessionLocal()
    trip = db.query(Trip).filter(Trip.id == trip_id).first()
    if trip is None:
        db.close()
        raise HTTPException(status_code=404, detail=f"Trip with id {trip_id} not found")

    db.delete(trip)
    db.commit()
    db.close()
    return {"message": f"Trip with id {trip_id} deleted successfully"}
