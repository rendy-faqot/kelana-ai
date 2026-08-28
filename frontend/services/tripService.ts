const API_URL = process.env.NEXT_PUBLIC_API_URL;

export interface Trip {
  id: number;
  destination: string;
  days: number;
  budget: number;
  travel_style: string | null;
  category: string;
  daily_budget: number;
  ai_recommendation: string | null;
  created_at: string;
}

export interface GenerateTripData {
  destination: string;
  days: number;
  budget: number;
  travel_style: string;
}

function authHeaders(token: string): Record<string, string> {
  return { Authorization: `Bearer ${token}` };
}

export async function getTrips(token: string): Promise<Trip[]> {
  const res = await fetch(`${API_URL}/api/v1/trips`, {
    headers: authHeaders(token),
  });
  if (!res.ok) {
    throw new Error(`Failed to fetch trips: ${res.status} ${res.statusText}`);
  }
  return res.json();
}

export async function getTrip(id: number, token: string): Promise<Trip> {
  const res = await fetch(`${API_URL}/api/v1/trips/${id}`, {
    headers: authHeaders(token),
  });
  if (!res.ok) {
    throw new Error(`Failed to fetch trip ${id}: ${res.status} ${res.statusText}`);
  }
  return res.json();
}

export async function generateTrip(data: GenerateTripData, token: string): Promise<Trip> {
  const res = await fetch(`${API_URL}/api/v1/trips`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders(token) },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    throw new Error(`Failed to generate trip: ${res.status} ${res.statusText}`);
  }
  return res.json();
}
