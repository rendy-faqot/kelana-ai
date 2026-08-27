const API_URL = process.env.NEXT_PUBLIC_API_URL;

export interface AuthTokenResponse {
  access_token: string;
  token_type: string;
}

export interface RegisterResponse {
  id: number;
  name: string;
  email: string;
  created_at: string;
}

export async function login(
  email: string,
  password: string
): Promise<AuthTokenResponse> {
  const res = await fetch(`${API_URL}/api/v1/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.detail ?? `Login failed (${res.status})`);
  }

  return res.json();
}

export async function register(
  name: string,
  email: string,
  password: string
): Promise<RegisterResponse> {
  const res = await fetch(`${API_URL}/api/v1/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, email, password }),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.detail ?? `Registration failed (${res.status})`);
  }

  return res.json();
}
