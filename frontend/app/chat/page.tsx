"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import ReactMarkdown from "react-markdown";
import {
  createConversation,
  deleteConversation,
  getConversations,
  getMessages,
  renameConversation,
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
  if (conversation.title) return conversation.title;

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
  const [editingConversationId, setEditingConversationId] = useState<number | null>(null);
  const [editingTitle, setEditingTitle] = useState("");
  const [savingTitle, setSavingTitle] = useState(false);
  const [deletingConversationId, setDeletingConversationId] = useState<number | null>(null);
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
  const activeConversation = conversations.find(
    (conversation) => conversation.id === activeConversationId
  );
  const activeConversationLabel = activeConversation
    ? getConversationLabel(activeConversation, messagesByConversation)
    : "Chat";

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
    if (editingConversationId !== null) return;
    if (conversationId === activeConversationId) return;
    setActiveConversationId(conversationId);
    setMessages(messagesByConversation[conversationId] ?? []);
  }

  function startRenaming(conversation: Conversation) {
    setEditingConversationId(conversation.id);
    setEditingTitle(getConversationLabel(conversation, messagesByConversation));
    setError(null);
  }

  function cancelRenaming() {
    setEditingConversationId(null);
    setEditingTitle("");
  }

  async function handleRenameConversation(conversationId: number) {
    if (!token || savingTitle) return;

    const title = editingTitle.trim();
    if (!title) {
      setError("Conversation title is required.");
      return;
    }

    setSavingTitle(true);
    setError(null);

    try {
      const updatedConversation = await renameConversation(
        conversationId,
        title,
        token
      );
      setConversations((prev) =>
        prev.map((conversation) =>
          conversation.id === conversationId ? updatedConversation : conversation
        )
      );
      cancelRenaming();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to rename conversation.");
    } finally {
      setSavingTitle(false);
    }
  }

  async function handleDeleteConversation(
    conversation: Conversation,
    label: string
  ) {
    if (!token || deletingConversationId !== null) return;

    const confirmed = window.confirm(`Delete "${label}" and all of its messages?`);
    if (!confirmed) return;

    setDeletingConversationId(conversation.id);
    setError(null);

    try {
      await deleteConversation(conversation.id, token);
      const nextConversations = conversations.filter(
        (item) => item.id !== conversation.id
      );
      setConversations(nextConversations);
      setMessagesByConversation((prev) => {
        const next = { ...prev };
        delete next[conversation.id];
        return next;
      });

      if (conversation.id === activeConversationId) {
        const nextActiveConversation = nextConversations[0] ?? null;
        setActiveConversationId(nextActiveConversation?.id ?? null);
        setMessages(
          nextActiveConversation
            ? messagesByConversation[nextActiveConversation.id] ?? []
            : []
        );
      }

      if (conversation.id === editingConversationId) {
        cancelRenaming();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete conversation.");
    } finally {
      setDeletingConversationId(null);
    }
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
                  const editing = conversation.id === editingConversationId;
                  const label = getConversationLabel(
                    conversation,
                    messagesByConversation
                  );

                  if (editing) {
                    return (
                      <div
                        key={conversation.id}
                        className="rounded-lg bg-white p-2 shadow-sm"
                      >
                        <label
                          htmlFor={`conversation-title-${conversation.id}`}
                          className="sr-only"
                        >
                          Conversation title
                        </label>
                        <input
                          id={`conversation-title-${conversation.id}`}
                          value={editingTitle}
                          onChange={(e) => setEditingTitle(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              void handleRenameConversation(conversation.id);
                            }
                            if (e.key === "Escape") {
                              cancelRenaming();
                            }
                          }}
                          maxLength={100}
                          autoFocus
                          className="h-9 w-full rounded-md border border-[#d7e5f1] bg-white px-2 text-sm text-[var(--foreground)] outline-none focus:border-[#2196F3]"
                        />
                        <div className="mt-2 flex justify-end gap-1">
                          <button
                            type="button"
                            onClick={cancelRenaming}
                            className="flex h-8 w-8 items-center justify-center rounded-md text-gray-500 transition-colors hover:bg-[#f0f4f8]"
                            aria-label="Cancel rename"
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              viewBox="0 0 24 24"
                              fill="currentColor"
                              className="h-4 w-4"
                              aria-hidden="true"
                            >
                              <path d="m12 10.59 5.3-5.3 1.4 1.42-5.29 5.29 5.3 5.3-1.42 1.4-5.29-5.29-5.3 5.3-1.4-1.42 5.29-5.29-5.3-5.3 1.42-1.4 5.29 5.29Z" />
                            </svg>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRenameConversation(conversation.id)}
                            disabled={savingTitle}
                            className="flex h-8 w-8 items-center justify-center rounded-md bg-[#2196F3] text-white transition-colors hover:bg-[#1976D2] disabled:cursor-not-allowed disabled:bg-gray-300"
                            aria-label="Save conversation title"
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              viewBox="0 0 24 24"
                              fill="currentColor"
                              className="h-4 w-4"
                              aria-hidden="true"
                            >
                              <path d="m9 16.17-3.59-3.58L4 14l5 5L20 8l-1.41-1.41L9 16.17Z" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div
                      key={conversation.id}
                      className={`group flex items-center gap-1 rounded-lg pr-1 transition-colors ${
                        active
                          ? "bg-white text-[#1565C0] shadow-sm"
                          : "text-gray-600 hover:bg-white/80"
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => handleSelectConversation(conversation.id)}
                        className="min-w-0 flex-1 px-3 py-2 text-left"
                      >
                        <span className="block truncate text-sm font-semibold">
                          {label}
                        </span>
                        <span className="mt-1 block text-xs text-gray-400">
                          {formatConversationDate(conversation.created_at)}
                        </span>
                      </button>
                      <button
                        type="button"
                        onClick={() => startRenaming(conversation)}
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-gray-400 opacity-100 transition-colors hover:bg-[#e3f0fd] hover:text-[#1976D2] md:opacity-0 md:group-hover:opacity-100"
                        aria-label="Rename conversation"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 24 24"
                          fill="currentColor"
                          className="h-4 w-4"
                          aria-hidden="true"
                        >
                          <path d="M4 17.46V20h2.54L17.06 9.48l-2.54-2.54L4 17.46ZM19.04 7.5a1 1 0 0 0 0-1.41l-1.13-1.13a1 1 0 0 0-1.41 0l-.9.9 2.54 2.54.9-.9Z" />
                        </svg>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteConversation(conversation, label)}
                        disabled={deletingConversationId === conversation.id}
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-gray-400 opacity-100 transition-colors hover:bg-red-50 hover:text-red-500 disabled:cursor-not-allowed disabled:text-gray-300 md:opacity-0 md:group-hover:opacity-100"
                        aria-label="Delete conversation"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 24 24"
                          fill="currentColor"
                          className="h-4 w-4"
                          aria-hidden="true"
                        >
                          <path d="M9 3h6l1 2h4v2H4V5h4l1-2Zm-3 6h12l-.8 11a2 2 0 0 1-2 2H8.8a2 2 0 0 1-2-2L6 9Zm3 2v8h2v-8H9Zm4 0v8h2v-8h-2Z" />
                        </svg>
                      </button>
                    </div>
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
                {activeConversationLabel}
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
