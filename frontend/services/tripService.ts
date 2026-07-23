export type Trip = {
  id: number;
  destination?: string;
  category?: string;
  days?: number;
  budget?: number;
  daily_budget?: number;
  travel_style?: string;
  ai_recommendation?: string | null;
  created_at?: string;
};

export type GenerateTripPayload = {
  destination: string;
  days: number;
  budget: number;
  travel_style: string;
};

// All trip-related API calls live here
const API_BASE = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000").replace(
  /\/$/,
  ""
)
const API_URL = API_BASE.endsWith("/api/v1") ? API_BASE : `${API_BASE}/api/v1`

export async function getTrips(): Promise<Trip[]> {
  const res = await fetch(`${API_URL}/trips`, { cache: "no-store" })
  if (!res.ok) {
    return []
  }
  return res.json()
}

export async function getTrip(id: number): Promise<Trip | null> {
  const res = await fetch(`${API_URL}/trips/${id}`, { cache: "no-store" })
  if (!res.ok) {
    return null
  }
  return res.json()
}

export async function generateTrip(data: GenerateTripPayload): Promise<Trip> {
  const res = await fetch(`${API_URL}/trips`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  })
  if (!res.ok) {
    throw new Error("Unable to generate trip")
  }
  return res.json()
}
