from fastapi import FastAPI
from pydantic import BaseModel
from services.trips_service import (
    calculate_daily_budget,
    get_trip_category,
    get_transportation_recommendation,
)


app = FastAPI()

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
    transportation = get_transportation_recommendation(request.travel_style)
    return {
        "destination": request.destination,
        "budget": request.budget,
        "daily_budget": daily_budget,
        "category": category,
        "transportation": transportation
    }

# List of trip categories
@app.get("/api/v1/trip-categories")
def list_trip_categories():
    # This is a placeholder implementation - replace with actual category listing logic
    return [
        "Backpacker",
        "Standard",
        "Luxury"   
    ]