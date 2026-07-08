# =========================
# KelanaAI - Part 3
# Daily Budget Calculation
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
# ====== END Part 3 ======