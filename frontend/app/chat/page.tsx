"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import ReactMarkdown from "react-markdown";
import {
  createConversation,
  getConversations,
  getMessages,
  sendMessage,
  type Conversation,
  type Message,
} from "@/services/conversationService";

type DraftMessage = Message | {
  id: number;
  conversation_id: number;
  role: "user" | "assistant";
  content: string;
  created_at: string;
  pending?: boolean;
};

function formatConversationDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function getConversationLabel(
  conversation: Conversation,
  messagesByConversation: Record<number, Message[]>
) {
  const firstUserMessage = messagesByConversation[conversation.id]?.find(
    (message) => message.role === "user"
  );

  if (!firstUserMessage) return `Conversation ${conversation.id}`;

  return firstUserMessage.content.length > 36
    ? `${firstUserMessage.content.slice(0, 36)}...`
    : firstUserMessage.content;
}

export default function ChatPage() {
  const router = useRouter();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [token, setToken] = useState<string | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<number | null>(null);
  const [messages, setMessages] = useState<DraftMessage[]>([]);
  const [messagesByConversation, setMessagesByConversation] = useState<
    Record<number, Message[]>
  >({});
  const [draft, setDraft] = useState("");
  const [loadingConversations, setLoadingConversations] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const syncToken = window.setTimeout(() => {
      const savedToken = localStorage.getItem("access_token");
      if (!savedToken) {
        router.replace("/login");
        return;
      }

      setToken(savedToken);
    }, 0);

    return () => window.clearTimeout(syncToken);
  }, [router]);

  useEffect(() => {
    if (!token) return;

    getConversations(token)
      .then((data) => {
        setConversations(data);
        if (data.length > 0) {
          setActiveConversationId(data[0].id);
        }
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load conversations."))
      .finally(() => setLoadingConversations(false));
  }, [router, token]);

  useEffect(() => {
    if (!token || activeConversationId === null) return;

    let ignore = false;
    const authToken = token;
    const selectedConversationId = activeConversationId;

    async function loadMessages() {
      setLoadingMessages(true);
      setError(null);

      try {
        const data = await getMessages(selectedConversationId, authToken);
        if (ignore) return;
        setMessages(data);
        setMessagesByConversation((prev) => ({
          ...prev,
          [selectedConversationId]: data,
        }));
      } catch (err) {
        if (!ignore) {
          setError(err instanceof Error ? err.message : "Failed to load messages.");
        }
      } finally {
        if (!ignore) {
          setLoadingMessages(false);
        }
      }
    }

    void loadMessages();

    return () => {
      ignore = true;
    };
  }, [activeConversationId, token]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loadingMessages, sending]);

  const canSend = useMemo(() => draft.trim().length > 0 && !sending, [
    draft,
    sending,
  ]);

  async function refreshConversations(authToken: string, selectedId: number) {
    const data = await getConversations(authToken);
    setConversations(data);
    setActiveConversationId(selectedId);
  }

  async function handleNewConversation() {
    if (!token) return;

    setError(null);
    try {
      const conversationId = await createConversation(token);
      await refreshConversations(token, conversationId);
      setMessages([]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create conversation.");
    }
  }

  async function handleSelectConversation(conversationId: number) {
    if (conversationId === activeConversationId) return;
    setActiveConversationId(conversationId);
    setMessages(messagesByConversation[conversationId] ?? []);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!token || !canSend) return;

    const content = draft.trim();
    setDraft("");
    setError(null);
    setSending(true);

    let conversationId = activeConversationId;

    try {
      if (conversationId === null) {
        conversationId = await createConversation(token);
        await refreshConversations(token, conversationId);
      }

      const optimisticMessage: DraftMessage = {
        id: Date.now() * -1,
        conversation_id: conversationId,
        role: "user",
        content,
        created_at: new Date().toISOString(),
        pending: true,
      };
      setMessages((prev) => [...prev, optimisticMessage]);

      const response = await sendMessage(conversationId, content, token);
      const latestMessages = await getMessages(response.conversation_id, token);
      setMessages(latestMessages);
      setMessagesByConversation((prev) => ({
        ...prev,
        [response.conversation_id]: latestMessages,
      }));
      await refreshConversations(token, response.conversation_id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send message.");
      setDraft(content);
    } finally {
      setSending(false);
    }
  }

  return (
    <main className="flex-1 bg-[#f7fafc] px-3 py-4">
      <div className="mx-auto flex h-[calc(100vh-8rem)] min-h-[620px] max-w-6xl overflow-hidden rounded-lg border border-[#d7e5f1] bg-white shadow-sm">
        <aside className="hidden w-72 shrink-0 border-r border-[#d7e5f1] bg-[#f0f4f8] md:flex md:flex-col">
          <div className="border-b border-[#d7e5f1] p-3">
            <button
              type="button"
              onClick={handleNewConversation}
              className="flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-[#2196F3] px-3 text-sm font-semibold text-white transition-colors hover:bg-[#1976D2] disabled:cursor-not-allowed disabled:bg-gray-300"
              disabled={!token}
            >
              <span aria-hidden="true" className="text-lg leading-none">+</span>
              New Chat
            </button>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto p-2">
            {loadingConversations ? (
              <div className="flex h-24 items-center justify-center">
                <div className="h-6 w-6 animate-spin rounded-full border-4 border-[#d7e5f1] border-t-[#2196F3]" />
              </div>
            ) : conversations.length === 0 ? (
              <p className="px-3 py-4 text-sm text-gray-500">No conversations yet</p>
            ) : (
              <div className="flex flex-col gap-1">
                {conversations.map((conversation) => {
                  const active = conversation.id === activeConversationId;
                  return (
                    <button
                      key={conversation.id}
                      type="button"
                      onClick={() => handleSelectConversation(conversation.id)}
                      className={`rounded-lg px-3 py-2 text-left transition-colors ${
                        active
                          ? "bg-white text-[#1565C0] shadow-sm"
                          : "text-gray-600 hover:bg-white/80"
                      }`}
                    >
                      <span className="block truncate text-sm font-semibold">
                        {getConversationLabel(conversation, messagesByConversation)}
                      </span>
                      <span className="mt-1 block text-xs text-gray-400">
                        {formatConversationDate(conversation.created_at)}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </aside>

        <section className="flex min-w-0 flex-1 flex-col">
          <div className="flex min-h-14 items-center justify-between border-b border-[#d7e5f1] px-4">
            <div className="min-w-0">
              <h1 className="truncate text-base font-bold text-[var(--foreground)]">
                {activeConversationId
                  ? `Conversation ${activeConversationId}`
                  : "Chat"}
              </h1>
              <p className="text-xs text-gray-400">KelanaAI Travel Assistant</p>
            </div>
            <button
              type="button"
              onClick={handleNewConversation}
              className="h-9 rounded-lg border border-[#d7e5f1] px-3 text-sm font-semibold text-[#1976D2] transition-colors hover:bg-[#e3f0fd] md:hidden"
              disabled={!token}
            >
              New
            </button>
          </div>

          {error && (
            <div className="border-b border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
              {error}
            </div>
          )}

          <div className="min-h-0 flex-1 overflow-y-auto bg-white px-4 py-5">
            {loadingMessages ? (
              <div className="flex h-full items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#d7e5f1] border-t-[#2196F3]" />
              </div>
            ) : messages.length === 0 ? (
              <div className="flex h-full items-center justify-center text-center">
                <div className="max-w-sm">
                  <h2 className="text-xl font-bold text-[var(--foreground)]">
                    Where should we go next?
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-gray-500">
                    Ask about routes, itineraries, budgets, or what to do on a specific day.
                  </p>
                </div>
              </div>
            ) : (
              <div className="mx-auto flex max-w-3xl flex-col gap-3">
                {messages.map((message) => {
                  const isUser = message.role === "user";
                  return (
                    <div
                      key={message.id}
                      className={`flex ${isUser ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[78%] rounded-2xl px-4 py-3 text-sm leading-6 shadow-sm ${
                          isUser
                            ? "rounded-br-md bg-[#0878c9] text-white"
                            : "rounded-bl-md border border-[#d7e5f1] bg-[#f8fbfd] text-[#172033]"
                        } ${"pending" in message && message.pending ? "opacity-70" : ""}`}
                      >
                        {isUser ? (
                          <p className="whitespace-pre-wrap">{message.content}</p>
                        ) : (
                          <div className="prose prose-sm max-w-none text-inherit prose-p:my-0 prose-ul:my-2 prose-ol:my-2 prose-li:my-1">
                            <ReactMarkdown>{message.content}</ReactMarkdown>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
                {sending && (
                  <div className="flex justify-start">
                    <div className="rounded-2xl rounded-bl-md border border-[#d7e5f1] bg-[#f8fbfd] px-4 py-3 text-sm text-gray-500 shadow-sm">
                      Thinking...
                    </div>
                  </div>
                )}
                <div ref={scrollRef} />
              </div>
            )}
          </div>

          <form
            onSubmit={handleSubmit}
            className="border-t border-[#d7e5f1] bg-white p-3"
          >
            <div className="mx-auto flex max-w-3xl items-end gap-2 rounded-2xl border border-[#d7e5f1] bg-[#f0f4f8] p-2 shadow-sm">
              <label htmlFor="chat-message" className="sr-only">
                Message
              </label>
              <textarea
                id="chat-message"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    e.currentTarget.form?.requestSubmit();
                  }
                }}
                rows={1}
                placeholder="Type a message..."
                className="max-h-32 min-h-10 flex-1 resize-none bg-transparent px-3 py-2 text-sm text-[var(--foreground)] outline-none placeholder:text-gray-500"
              />
              <button
                type="submit"
                disabled={!canSend}
                aria-label="Send message"
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#0878c9] text-white transition-colors hover:bg-[#0669b1] disabled:cursor-not-allowed disabled:bg-gray-300"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="h-5 w-5"
                  aria-hidden="true"
                >
                  <path d="M3.48 20.52 22 12 3.48 3.48 3 10.1l10 1.9-10 1.9.48 6.62Z" />
                </svg>
              </button>
            </div>
          </form>
        </section>
      </div>
    </main>
  );
}
