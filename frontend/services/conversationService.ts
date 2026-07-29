export type Conversation = {
  id: number;
  title?: string | null;
  created_at?: string;
};

export type CreateConversationResponse = {
  conversation_id: number;
};

export type SendMessageResponse = {
  response: string;
};

export type ConversationMessage = {
  id: number;
  role: "user" | "assistant";
  content: string;
  created_at?: string;
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

async function readError(res: Response, fallback: string) {
  const error = await res.json().catch(() => null);
  return error?.detail || fallback;
}

export async function getConversations(): Promise<Conversation[]> {
  const res = await fetch(`${API_URL}/conversations`, {
    cache: "no-store",
    headers: getAuthHeaders(),
  });

  if (!res.ok) {
    throw new Error(await readError(res, "Unable to load conversations"));
  }

  return res.json();
}

export async function createConversation(
  title?: string
): Promise<CreateConversationResponse> {
  const res = await fetch(`${API_URL}/conversations`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
    },
    body: JSON.stringify({ title }),
  });

  if (!res.ok) {
    throw new Error(await readError(res, "Unable to start conversation"));
  }

  return res.json();
}

export async function getConversationMessages(
  conversationId: number
): Promise<ConversationMessage[]> {
  const res = await fetch(`${API_URL}/conversations/${conversationId}/messages`, {
    cache: "no-store",
    headers: getAuthHeaders(),
  });

  if (!res.ok) {
    throw new Error(await readError(res, "Unable to load messages"));
  }

  return res.json();
}

export async function renameConversation(
  conversationId: number,
  title: string
): Promise<Conversation> {
  const res = await fetch(`${API_URL}/conversations/${conversationId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
    },
    body: JSON.stringify({ title }),
  });

  if (!res.ok) {
    throw new Error(await readError(res, "Unable to rename conversation"));
  }

  return res.json();
}

export async function sendConversationMessage(
  conversationId: number,
  message: string
): Promise<SendMessageResponse> {
  const res = await fetch(`${API_URL}/conversations/${conversationId}/messages`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
    },
    body: JSON.stringify({ message }),
  });

  if (!res.ok) {
    throw new Error(await readError(res, "Unable to send message"));
  }

  return res.json();
}
