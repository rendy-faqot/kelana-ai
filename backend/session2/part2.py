# =========================
# KelanaAI - Part 2
# Three business rules. Translate them into Python if/elif/else.
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
# ====== END Part 2 ======