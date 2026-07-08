# =========================
# KelanaAI - Part 5
# Functions
# =========================
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

def calculate_daily_budget(budget, days):
  return budget/days

def get_trip_category(budget):
  if budget < 1000:
    return "Backpacker"
  elif budget < 3000:
    return "Standard"
  else:
    return "Luxury"
  
# Call them
daily_budget = calculate_daily_budget(budget, days)
category = get_trip_category(budget)
print(f"{category} · {daily_budget} USD/day")

# ====== END Part 5 ======