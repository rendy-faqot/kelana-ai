"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import {
  createConversation,
  getConversationMessages,
  getConversations,
  renameConversation,
  sendConversationMessage,
  type Conversation,
  type ConversationMessage,
} from "@/services/conversationService";

type ChatRole = "user" | "assistant";
type ChatMessage = {
  id: string;
  role: ChatRole;
  content: string;
};
type Status = "idle" | "loading" | "loadingMessages" | "sending" | "error";

const starterPrompts = [
  "Plan a 5-day family trip to Japan.",
  "What should we do on Day 2?",
  "Make it cheaper but still comfortable.",
];

function makeLocalId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function conversationTitle(conversation: Conversation) {
  return conversation.title?.trim() || `Conversation #${conversation.id}`;
}

function toChatMessage(message: ConversationMessage): ChatMessage {
  return {
    id: String(message.id),
    role: message.role,
    content: message.content,
  };
}

export default function ChatPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [conversationId, setConversationId] = useState<number | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [status, setStatus] = useState<Status>("loading");
  const [error, setError] = useState("");
  const [editingConversationId, setEditingConversationId] = useState<number | null>(
    null
  );
  const [editingTitle, setEditingTitle] = useState("");
  const scrollRef = useRef<HTMLDivElement | null>(null);

  const isSending = status === "sending";
  const isLoadingMessages = status === "loadingMessages";
  const activeConversation = useMemo(
    () => conversations.find((conversation) => conversation.id === conversationId),
    [conversationId, conversations]
  );

  useEffect(() => {
    async function loadConversations() {
      try {
        const data = await getConversations();
        setConversations(data);
        setConversationId(data[0]?.id ?? null);
        setStatus(data[0] ? "loadingMessages" : "idle");
      } catch (loadError) {
        setStatus("error");
        setError(
          loadError instanceof Error
            ? loadError.message
            : "Unable to load conversations."
        );
      }
    }

    loadConversations();
  }, []);

  useEffect(() => {
    if (!conversationId) {
      return;
    }

    let isActive = true;
    const selectedConversationId = conversationId;

    async function loadMessages() {
      setStatus("loadingMessages");
      setError("");

      try {
        const data = await getConversationMessages(selectedConversationId);

        if (isActive) {
          setMessages(data.map(toChatMessage));
          setStatus("idle");
        }
      } catch (loadError) {
        if (isActive) {
          setStatus("error");
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Unable to load messages."
          );
        }
      }
    }

    loadMessages();

    return () => {
      isActive = false;
    };
  }, [conversationId]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, status]);

  const startConversation = async (
    firstMessage?: string,
    resetMessages = true,
    activateConversation = true
  ) => {
    const title = firstMessage?.trim().slice(0, 80) || "New conversation";
    const data = await createConversation(title);
    const conversation = {
      id: data.conversation_id,
      title,
      created_at: new Date().toISOString(),
    };

    setConversations((current) => [conversation, ...current]);
    if (activateConversation) {
      setConversationId(data.conversation_id);
    }
    if (resetMessages) {
      setMessages([]);
    }
    return data.conversation_id;
  };

  const sendMessage = async (message: string) => {
    const trimmedMessage = message.trim();

    if (!trimmedMessage || isSending) {
      return;
    }

    setInput("");
    setError("");
    setStatus("sending");

    const userMessage: ChatMessage = {
      id: makeLocalId(),
      role: "user",
      content: trimmedMessage,
    };
    setMessages((current) => [...current, userMessage]);

    try {
      const targetConversationId =
        conversationId ?? (await startConversation(trimmedMessage, false, false));
      const data = await sendConversationMessage(targetConversationId, trimmedMessage);

      setMessages((current) => [
        ...current,
        {
          id: makeLocalId(),
          role: "assistant",
          content: data.response,
        },
      ]);
      if (!conversationId) {
        setConversationId(targetConversationId);
      }
      setStatus("idle");
    } catch (sendError) {
      setStatus("error");
      setError(
        sendError instanceof Error ? sendError.message : "Unable to send message."
      );
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    await sendMessage(input);
  };

  const handleNewConversation = async () => {
    setStatus("loading");
    setError("");
    setEditingConversationId(null);

    try {
      await startConversation();
      setStatus("idle");
    } catch (newError) {
      setStatus("error");
      setError(
        newError instanceof Error ? newError.message : "Unable to start conversation."
      );
    }
  };

  const beginRename = (conversation: Conversation) => {
    setEditingConversationId(conversation.id);
    setEditingTitle(conversationTitle(conversation));
    setError("");
  };

  const cancelRename = () => {
    setEditingConversationId(null);
    setEditingTitle("");
  };

  const saveRename = async (conversation: Conversation) => {
    const title = editingTitle.trim();

    if (!title) {
      setError("Conversation title cannot be empty.");
      return;
    }

    try {
      const updatedConversation = await renameConversation(conversation.id, title);
      setConversations((current) =>
        current.map((item) =>
          item.id === conversation.id ? updatedConversation : item
        )
      );
      cancelRename();
    } catch (renameError) {
      setError(
        renameError instanceof Error
          ? renameError.message
          : "Unable to rename conversation."
      );
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-6 text-slate-900">
      <div className="mx-auto flex min-h-[calc(100vh-3rem)] max-w-6xl flex-col gap-5">
        <header className="flex flex-col gap-4 border-b border-sky-100 bg-slate-50 pb-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-sky-600">
              KelanaAI
            </p>
            <h1 className="mt-2 text-3xl font-semibold text-slate-950">
              Travel Chat
            </h1>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/trips"
              className="inline-flex items-center justify-center rounded-full border border-sky-100 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-sky-200 hover:bg-sky-50"
            >
              Trip History
            </Link>
            <button
              type="button"
              onClick={handleNewConversation}
              disabled={status === "loading" || isLoadingMessages || isSending}
              className="inline-flex items-center justify-center rounded-full bg-sky-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              New Chat
            </button>
          </div>
        </header>

        <section className="grid flex-1 gap-5 lg:grid-cols-[280px_minmax(0,1fr)]">
          <aside className="min-h-0 rounded-2xl border border-sky-100 bg-white p-4 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-900">Conversations</h2>
              <span className="rounded-full bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-700">
                {conversations.length}
              </span>
            </div>

            <div className="space-y-2">
              {conversations.length === 0 ? (
                <div className="rounded-xl border border-dashed border-sky-200 bg-sky-50 px-4 py-5 text-sm text-slate-600">
                  Start a chat to create your first conversation.
                </div>
              ) : (
                conversations.map((conversation) => {
                  const isActive = conversation.id === conversationId;
                  const isEditing = conversation.id === editingConversationId;

                  return (
                    <div
                      key={conversation.id}
                      className={`rounded-xl p-2 transition ${
                        isActive
                          ? "bg-sky-600 text-white"
                          : "bg-slate-50 text-slate-700 hover:bg-sky-50"
                      }`}
                    >
                      {isEditing ? (
                        <form
                          onSubmit={(event) => {
                            event.preventDefault();
                            saveRename(conversation);
                          }}
                          className="space-y-2"
                        >
                          <input
                            value={editingTitle}
                            onChange={(event) => setEditingTitle(event.target.value)}
                            onKeyDown={(event) => {
                              if (event.key === "Escape") {
                                cancelRename();
                              }
                            }}
                            autoFocus
                            className="w-full rounded-lg border border-sky-200 bg-white px-3 py-2 text-sm font-medium text-slate-900 outline-none focus:border-sky-500"
                          />
                          <div className="flex gap-2">
                            <button
                              type="submit"
                              className="flex-1 rounded-lg bg-sky-700 px-3 py-2 text-xs font-semibold text-white transition hover:bg-sky-800"
                            >
                              Save
                            </button>
                            <button
                              type="button"
                              onClick={cancelRename}
                              className="flex-1 rounded-lg bg-white px-3 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-100"
                            >
                              Cancel
                            </button>
                          </div>
                        </form>
                      ) : (
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setConversationId(conversation.id);
                              setEditingConversationId(null);
                              setError("");
                            }}
                            className={`min-w-0 flex-1 rounded-lg px-2 py-2 text-left text-sm transition ${
                              isActive
                                ? "font-semibold text-white"
                                : "text-slate-700 hover:text-sky-800"
                            }`}
                          >
                            <span className="block truncate">
                              {conversationTitle(conversation)}
                            </span>
                          </button>
                          <button
                            type="button"
                            onClick={() => beginRename(conversation)}
                            className={`shrink-0 rounded-lg px-2 py-2 text-xs font-semibold transition ${
                              isActive
                                ? "bg-white/15 text-white hover:bg-white/25"
                                : "bg-white text-sky-700 hover:bg-sky-100"
                            }`}
                          >
                            Rename
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </aside>

          <section className="flex min-h-[640px] flex-col overflow-hidden rounded-2xl border border-sky-100 bg-white shadow-sm">
            <div className="border-b border-sky-100 px-5 py-4">
              <h2 className="truncate text-base font-semibold text-slate-900">
                {activeConversation
                  ? conversationTitle(activeConversation)
                  : "New conversation"}
              </h2>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-5 sm:px-6">
              {isLoadingMessages ? (
                <div className="flex h-full items-center justify-center text-sm font-medium text-slate-500">
                  Loading previous messages...
                </div>
              ) : messages.length === 0 ? (
                <div className="mx-auto flex h-full max-w-2xl flex-col items-center justify-center text-center">
                  <h3 className="text-2xl font-semibold text-slate-950">
                    Ask about your next trip
                  </h3>
                  <p className="mt-3 text-sm leading-6 text-slate-600">
                    Messages appear here while the backend stores the conversation,
                    retrieves history, and calls Bedrock.
                  </p>
                  <div className="mt-6 grid w-full gap-3">
                    {starterPrompts.map((prompt) => (
                      <button
                        key={prompt}
                        type="button"
                        onClick={() => sendMessage(prompt)}
                        disabled={isSending}
                        className="rounded-xl border border-sky-100 bg-sky-50 px-4 py-3 text-left text-sm font-medium text-slate-700 transition hover:border-sky-200 hover:bg-white disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {prompt}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="space-y-5">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${
                        message.role === "user" ? "justify-end" : "justify-start"
                      }`}
                    >
                      <div
                        className={`max-w-[82%] rounded-2xl px-4 py-3 text-sm leading-6 shadow-sm sm:max-w-[72%] ${
                          message.role === "user"
                            ? "rounded-br-md bg-sky-600 text-white"
                            : "rounded-bl-md border border-sky-100 bg-slate-50 text-slate-800"
                        }`}
                      >
                        {message.role === "assistant" ? (
                          <ReactMarkdown
                            remarkPlugins={[remarkGfm]}
                            components={{
                              p: ({ children }) => (
                                <p className="mb-3 last:mb-0">{children}</p>
                              ),
                              ul: ({ children }) => (
                                <ul className="mb-3 list-disc pl-5 last:mb-0">
                                  {children}
                                </ul>
                              ),
                              ol: ({ children }) => (
                                <ol className="mb-3 list-decimal pl-5 last:mb-0">
                                  {children}
                                </ol>
                              ),
                            }}
                          >
                            {message.content}
                          </ReactMarkdown>
                        ) : (
                          message.content
                        )}
                      </div>
                    </div>
                  ))}
                  {isSending ? (
                    <div className="flex justify-start">
                      <div className="rounded-2xl rounded-bl-md border border-sky-100 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-500 shadow-sm">
                        Thinking...
                      </div>
                    </div>
                  ) : null}
                  <div ref={scrollRef} />
                </div>
              )}
            </div>

            {error ? (
              <div className="border-t border-rose-100 bg-rose-50 px-5 py-3 text-sm text-rose-700">
                {error}
              </div>
            ) : null}

            <form
              onSubmit={handleSubmit}
              className="border-t border-sky-100 bg-white p-4"
            >
              <div className="flex gap-3">
                <textarea
                  value={input}
                  onChange={(event) => setInput(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" && !event.shiftKey) {
                      event.preventDefault();
                      handleSubmit(event);
                    }
                  }}
                  rows={1}
                  placeholder="Type a travel question..."
                  className="max-h-32 min-h-12 flex-1 resize-none rounded-2xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm leading-6 outline-none transition placeholder:text-slate-400 focus:border-sky-500 focus:bg-white"
                />
                <button
                  type="submit"
                  disabled={isSending || !input.trim()}
                  className="h-12 shrink-0 rounded-2xl bg-sky-600 px-5 text-sm font-semibold text-white transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Send
                </button>
              </div>
            </form>
          </section>
        </section>
      </div>
    </main>
  );
}
