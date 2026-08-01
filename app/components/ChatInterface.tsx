"use client";

import { useEffect, useRef, useState } from "react";
import { Compass, RotateCcw } from "lucide-react";
import type { ChatMessage } from "@/app/lib/types";
import { ChatInput } from "./ChatInput";
import { MessageBubble } from "./MessageBubble";
import { TypingIndicator } from "./TypingIndicator";

const STORAGE_KEY = "cruisara-chat-history";

const SUGGESTIONS = [
  "What day trips run from Hurghada?",
  "How much is the Cairo pyramids tour?",
  "Do you offer private yacht charters?",
  "What's included in a snorkeling trip?",
];

function createId() {
  return crypto.randomUUID();
}

/** Restores the conversation saved by a previous visit. Client-only. */
function loadHistory(): ChatMessage[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? (JSON.parse(saved) as ChatMessage[]) : [];
  } catch {
    localStorage.removeItem(STORAGE_KEY);
    return [];
  }
}

export function ChatInterface() {
  const [messages, setMessages] = useState<ChatMessage[]>(loadHistory);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [streamingId, setStreamingId] = useState<string | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
  }, [messages]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, isLoading]);

  function appendToMessage(id: string, text: string) {
    setMessages((current) =>
      current.map((message) =>
        message.id === id ? { ...message, content: message.content + text } : message,
      ),
    );
  }

  async function sendMessage(text: string) {
    const trimmed = text.trim();
    if (!trimmed || isLoading) return;

    const userMessage: ChatMessage = { id: createId(), role: "user", content: trimmed };
    const history = [...messages, userMessage];
    const assistantId = createId();

    setMessages([...history, { id: assistantId, role: "assistant", content: "" }]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: history }),
      });

      if (!response.ok || !response.body) {
        throw new Error(`Request failed with status ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      setStreamingId(assistantId);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        appendToMessage(assistantId, decoder.decode(value, { stream: true }));
      }
    } catch (error) {
      console.error("Chat request failed:", error);
      setMessages((current) =>
        current.map((message) =>
          message.id === assistantId
            ? {
                ...message,
                content:
                  "I'm having trouble reaching our booking desk right now. Please try again in a moment, or contact us directly at **reservations@cruisara.com**.",
              }
            : message,
        ),
      );
    } finally {
      setIsLoading(false);
      setStreamingId(null);
    }
  }

  function clearConversation() {
    setMessages([]);
    localStorage.removeItem(STORAGE_KEY);
  }

  const isEmpty = messages.length === 0;
  // Typing dots show only until the first token lands.
  const showTypingIndicator = isLoading && streamingId === null;

  return (
    <div className="flex h-dvh flex-col bg-gradient-to-b from-sand-50 to-ocean-50">
      <header className="shrink-0 border-b border-sand-200 bg-white/80 backdrop-blur">
        <div className="mx-auto flex w-full max-w-3xl items-center gap-3 px-4 py-3.5">
          <div className="flex size-10 items-center justify-center rounded-full bg-ocean-800 text-gold-400">
            <Compass className="size-5" aria-hidden />
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="truncate font-semibold tracking-tight text-ocean-900">
              Cruisara Tours
            </h1>
            <p className="truncate text-xs text-ocean-600">Your Red Sea travel concierge</p>
          </div>
          {!isEmpty && (
            <button
              type="button"
              onClick={clearConversation}
              className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-ocean-600 transition-colors hover:bg-sand-100"
            >
              <RotateCcw className="size-3.5" aria-hidden />
              New chat
            </button>
          )}
        </div>
      </header>

      <div ref={scrollRef} className="flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-3xl space-y-5 px-4 py-6">
          {isEmpty ? (
            <div className="pt-8 text-center sm:pt-16">
              <h2 className="text-2xl font-semibold tracking-tight text-ocean-900 sm:text-3xl">
                Where would you like to sail?
              </h2>
              <p className="mx-auto mt-3 max-w-md text-ocean-600">
                Ask about our Red Sea excursions, desert safaris, historical day trips, and private
                charters — I&apos;ll find the details for you.
              </p>
              <div className="mx-auto mt-8 grid max-w-xl gap-2.5 sm:grid-cols-2">
                {SUGGESTIONS.map((suggestion) => (
                  <button
                    key={suggestion}
                    type="button"
                    onClick={() => sendMessage(suggestion)}
                    className="rounded-xl border border-sand-200 bg-white/70 px-4 py-3 text-left text-sm text-ocean-800 shadow-sm transition-colors hover:border-gold-400 hover:bg-white"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((message) => (
              <MessageBubble
                key={message.id}
                message={message}
                isStreaming={message.id === streamingId}
              />
            ))
          )}

          {showTypingIndicator && <TypingIndicator />}
        </div>
      </div>

      <div className="shrink-0 border-t border-sand-200 bg-white/80 pb-[env(safe-area-inset-bottom)] backdrop-blur">
        <div className="mx-auto w-full max-w-3xl px-4 py-3">
          <ChatInput
            value={input}
            onChange={setInput}
            onSubmit={() => sendMessage(input)}
            disabled={isLoading}
          />
          <p className="mt-2 text-center text-[11px] text-ocean-600/70">
            Answers are grounded in Cruisara&apos;s tour catalogue. Confirm final details at booking.
          </p>
        </div>
      </div>
    </div>
  );
}
