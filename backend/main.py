from fastapi import FastAPI, HTTPException, Response, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from services.trips_service import (
    calculate_daily_budget,
    get_trip_category
)
from services.bedrock_service import (
    get_ai_recommendation
)
from models.trip import Trip
from database import SessionLocal, init_db
from dotenv import load_dotenv

load_dotenv()

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
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

# FastAPI validates the JSON body against this model
# If a field is missing or wrong type, it returns 422 automatically

# POST endpoint — receives JSON, returns JSON
@app.post("/api/v1/trips")
def create_trip(request: TripRequest):
    daily_budget = calculate_daily_budget(
        request.budget, request.days
    )
    category = get_trip_category(
        request.budget
    )
    ai_recommendation = get_ai_recommendation(request) 
    # create a Trip ORM object
    trip = Trip(
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
def list_trips():
    db = SessionLocal()
    trips = db.query(Trip).all()
    db.close()
    return trips

@app.get("/api/v1/trips/{trip_id}")
def get_trip(trip_id: int):
    db = SessionLocal()
    trip = db.query(Trip).filter(Trip.id == trip_id).first()
    if trip is None:
        db.close()
        raise HTTPException(
            status_code=404,
            detail="Trip not found"
        )
    db.close()
    return trip

@app.delete("/api/v1/trips/{trip_id}")
def delete_trip(trip_id: int):
    db = SessionLocal()
    trip = db.query(Trip).filter(Trip.id == trip_id).first()
    if trip:
        db.delete(trip)
        db.commit()
    db.close()
    # return {"message": "Trip deleted successfully"}
    return Response(status_code=status.HTTP_204_NO_CONTENT)

@app.put("/api/v1/trips/{trip_id}")
def update_trip(trip_id: int, request: TripRequest):
    db = SessionLocal()
    trip = db.query(Trip).filter(Trip.id == trip_id).first()
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
