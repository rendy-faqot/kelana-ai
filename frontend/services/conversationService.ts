const API_URL = process.env.NEXT_PUBLIC_API_URL;

export interface Conversation {
  id: number;
  user_id: number;
  title: string | null;
  created_at: string;
}

export interface Message {
  id: number;
  conversation_id: number;
  role: "user" | "assistant";
  content: string;
  created_at: string;
}

export interface SendMessageResponse {
  conversation_id: number;
  message_id: number;
  assistant_message_id: number;
  answer: string;
}

function authHeaders(token: string): Record<string, string> {
  return { Authorization: `Bearer ${token}` };
}

async function parseError(res: Response, fallback: string): Promise<Error> {
  const body = await res.json().catch(() => ({}));
  return new Error(body.detail ?? fallback);
}

export async function getConversations(token: string): Promise<Conversation[]> {
  const res = await fetch(`${API_URL}/api/v1/conversations`, {
    headers: authHeaders(token),
  });

  if (!res.ok) {
    throw await parseError(res, `Failed to fetch conversations (${res.status})`);
  }

  return res.json();
}

export async function createConversation(token: string): Promise<number> {
  const res = await fetch(`${API_URL}/api/v1/conversations`, {
    method: "POST",
    headers: authHeaders(token),
  });

  if (!res.ok) {
    throw await parseError(res, `Failed to create conversation (${res.status})`);
  }

  const data = (await res.json()) as { conversation_id: number };
  return data.conversation_id;
}

export async function renameConversation(
  conversationId: number,
  title: string,
  token: string
): Promise<Conversation> {
  const res = await fetch(`${API_URL}/api/v1/conversations/${conversationId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(token),
    },
    body: JSON.stringify({ title }),
  });

  if (!res.ok) {
    throw await parseError(res, `Failed to rename conversation (${res.status})`);
  }

  return res.json();
}

export async function deleteConversation(
  conversationId: number,
  token: string
): Promise<void> {
  const res = await fetch(`${API_URL}/api/v1/conversations/${conversationId}`, {
    method: "DELETE",
    headers: authHeaders(token),
  });

  if (!res.ok) {
    throw await parseError(res, `Failed to delete conversation (${res.status})`);
  }
}

export async function getMessages(
  conversationId: number,
  token: string
): Promise<Message[]> {
  const res = await fetch(`${API_URL}/api/v1/conversations/${conversationId}/messages`, {
    headers: authHeaders(token),
  });

  if (!res.ok) {
    throw await parseError(res, `Failed to fetch messages (${res.status})`);
  }

  return res.json();
}

export async function sendMessage(
  conversationId: number,
  content: string,
  token: string
): Promise<SendMessageResponse> {
  const res = await fetch(`${API_URL}/api/v1/conversations/${conversationId}/messages`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(token),
    },
    body: JSON.stringify({ content }),
  });

  if (!res.ok) {
    throw await parseError(res, `Failed to send message (${res.status})`);
  }

  return res.json();
}
