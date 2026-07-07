# =========================
# KelanaAI - Challenges
# Ask the user for trip details
# =========================
def print_trip_summary(destination, days, budget, travel_style, hotel_cost = 0, transport_cost = 0, food_cost = 0, misc_cost = 0, country = "", currency = "", travel_month = ""):
  print("========================")
  print("KelanaAI")
  print("========================")
  print(f"Destination         : {destination}")
  print(f"Days                : {days}")
  print(f"Budget              : {budget}")
  print(f"Style               : {travel_style}")
  print(f"Country             : {country}")
  print(f"Currency            : {currency}")
  print(f"Travel Month        : {travel_month}")
  print(f"Hotel Cost          : {hotel_cost}")
  print(f"Transportation Cost : {transport_cost}")
  print(f"Food Cost           : {food_cost}")
  print(f"Misc. Cost          : {misc_cost}")
  total = hotel_cost + transport_cost + food_cost + misc_cost
  if total > budget:
    print("⚠ Budget exceeded.")
  print(f"Total Cost          : {total}")
  
destination     = input("Destination : ")
days            = int(input("Days : "))
budget          = float(input("Budget : "))
travel_style    = input("Travel Style : ")
country         = input("Country : ")
currency        = input("Currency : ")
travel_month    = input("Travel Month : ")
hotel_cost      = float(input("Hotel Cost : "))
transport_cost  = float(input("Transportation Cost : "))
food_cost       = float(input("Food Cost : "))
misc_cost       = float(input("Miscellaneous Cost : "))

# Now use them
print_trip_summary(destination, days, budget, travel_style, hotel_cost, transport_cost, food_cost, misc_cost)
# ====== END Challenges ======
