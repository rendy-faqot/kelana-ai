export type LoginPayload = {
  email: string;
  password: string;
};

export type LoginResponse = {
  access_token: string;
  token_type: string;
};

export type Profile = {
  id: number;
  name: string;
  email: string;
  total_trips: number;
};

const API_BASE = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000").replace(
  /\/$/,
  ""
);
const API_URL = API_BASE.endsWith("/api/v1") ? API_BASE : `${API_BASE}/api/v1`;

function getAuthHeaders(): HeadersInit {
  if (typeof window === "undefined") {
    return {};
  }

  const token = localStorage.getItem("kelana_token");
  const tokenType = localStorage.getItem("kelana_token_type") || "bearer";

  return token ? { Authorization: `${tokenType} ${token}` } : {};
}

export async function login(data: LoginPayload): Promise<LoginResponse> {
  const res = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const error = await res.json().catch(() => null);
    throw new Error(error?.detail || "Unable to login");
  }

  return res.json();
}

export async function logout(): Promise<void> {
  const headers = getAuthHeaders();

  if (Object.keys(headers).length > 0) {
    await fetch(`${API_URL}/auth/logout`, {
      method: "POST",
      headers,
    }).catch(() => null);
  }

  localStorage.removeItem("kelana_token");
  localStorage.removeItem("kelana_token_type");
}

export async function getProfile(): Promise<Profile> {
  const res = await fetch(`${API_URL}/auth/me`, {
    cache: "no-store",
    headers: getAuthHeaders(),
  });

  if (!res.ok) {
    const error = await res.json().catch(() => null);
    throw new Error(error?.detail || "Unable to load profile");
  }

  return res.json();
}
