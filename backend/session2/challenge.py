# =========================
# KelanaAI - Part 6
# Organizing the project
# =========================
from services.trips_service import calculate_daily_budget, get_trip_category

destinations = []

for i in range(2):
    name = input(f"Enter destination {i + 1}: ")
    destinations.append(name)

print(destinations)

destination  = "Japan"
days         = 5
budget       = 1500
travel_style = "Family"

# A list holds multiple values
recommended_places = ["Tokyo Tower", "Shibuya", "Mount Fuji", "Kyoto Temples"]
# Loop through the list
print(f"Recommended Places : {recommended_places}")
for place in recommended_places:
  print(f"- {place}")

# Call them
daily_budget = calculate_daily_budget(budget, days)
category = get_trip_category(budget)
print(f"{category} · {daily_budget} USD/day")

# ====== END Part 6 ======