from services.trip_service import (
  calculate_daily_budget,
  get_recommended_places,
  get_transportation_recommendation,
  get_trip_category,
)


def print_destinations(destinations):
  print("Your Destinations")

  index = 0
  while index < len(destinations):
    print(f"{index + 1}. {destinations[index]}")
    index += 1


def print_recommended_places(destinations):
  print("Recommended Places")
  print()

  for destination in destinations:
    print(destination)

    for place in get_recommended_places(destination):
      print(f"- {place}")

    print()


def print_trip_summary(destinations, days, budget):
  daily_budget = calculate_daily_budget(budget, days)
  category = get_trip_category(budget)
  transportation = get_transportation_recommendation(category)

  print("==============================")
  print("KelanaAI")
  print("==============================")
  print()
  print_destinations(destinations)
  print()
  print(f"Days         = {days}")
  print(f"Budget       = {budget} USD")
  print(f'Category     = "{category}"')
  print(f"Daily Budget = {daily_budget:.0f} USD/Day")
  print(f"Recommended Transportation: {transportation}")
  print()
  print_recommended_places(destinations)


print_trip_summary(["Japan", "Korea"], 5, 1500)
