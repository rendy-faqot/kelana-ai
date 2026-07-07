# =========================
# KelanaAI - Part 7
# Functions to reuse the trip summary code
# =========================
def print_trip_summary(destination, days, budget, travel_style):
  print("========================")
  print("KelanaAI")
  print("========================")
  print(f"Destination         : {destination}")
  print(f"Days                : {days}")
  print(f"Budget              : {budget}")
  print(f"Style               : {travel_style}")

# Call it with any trip
print_trip_summary("Japan", 5, 1500, "Family")
print_trip_summary("Bali", 3, 800, "Backpacker")
# ====== END Part 7 ======