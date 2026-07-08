# =========================
# KelanaAI - Part 4
# Destination Recommendations
# =========================
destination  = "Japan"
days         = 5
budget       = 1500
travel_style = "Family"

if budget < 1000:
  category = "Backpacker"
elif budget < 3000:
  category = "Standard"
else:
  category = "Luxury"

print(f"Category : {category}")

# Arithmetic operators: +  -  *  /  //
daily_budget = budget/days
print(f"Daily Budget : {daily_budget} USD/day")

# A list holds multiple values
recommended_places = ["Tokyo Tower", "Shibuya", "Mount Fuji", "Kyoto Temples"]
# Loop through the list
print(f"Recommended Places : {recommended_places}")
for place in recommended_places:
  print(f"- {place}")
# ====== END Part 4 ======