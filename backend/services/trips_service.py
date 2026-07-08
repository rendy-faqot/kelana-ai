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
  
def get_transportation_recommendation(category):
  if category == "Backpacker":
    return "Bus"
  elif category == "Standard":
    return "Train"
  elif category == "Luxury":
    return "Flight"
  else:
    return "Public Transport"

def get_travel_season(month):
  if month == "December":
    return "Peak Season"
  elif month == "June":
    return "Holiday Season"
  else:
    return "Regular Season"