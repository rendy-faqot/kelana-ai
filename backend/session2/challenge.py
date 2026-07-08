# =========================
# KelanaAI - Part 6
# Organizing the project
# =========================
from services.trips_service import calculate_daily_budget, get_trip_category, get_transportation_recommendation, get_travel_season

destination  = "Japan"
days         = 5
budget       = 1500
travel_style = "Family"
travel_month = "December"

# Call them
daily_budget = calculate_daily_budget(budget, days)
category = get_trip_category(budget)
transportation = get_transportation_recommendation(category)
travel_season = get_travel_season(travel_month)

print(f"{category} · {transportation} · {daily_budget} USD/day · {travel_season}")
# ====== END Part 6 ======