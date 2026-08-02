"use client";

import { useCallback, useEffect, useState } from "react";
import type { ChatMessage } from "@/app/lib/types";
import {
  clearStoredMessages,
  loadStoredMessages,
  saveStoredMessages,
} from "@/app/lib/chatStorage";

/** Shown in place of the assistant reply when the request or stream fails. */
export const CHAT_ERROR_MESSAGE =
  "I'm having trouble reaching our booking desk right now. Please try again in a moment, or contact us directly at **reservations@cruisara.com**.";

function createId() {
  return crypto.randomUUID();
}

/**
 * Owns the whole conversation: persisted history, the draft input, and the
 * streaming request to `/api/chat`.
 *
 * Client-only — the initial state reads `localStorage`, so the consuming tree
 * must be mounted with `ssr: false`.
 */
export function useChat() {
  const [messages, setMessages] = useState<ChatMessage[]>(loadStoredMessages);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [streamingId, setStreamingId] = useState<string | null>(null);

  useEffect(() => {
    saveStoredMessages(messages);
  }, [messages]);

  /** Appends a decoded stream chunk onto the in-progress assistant message. */
  const appendToMessage = useCallback((id: string, text: string) => {
    setMessages((current) =>
      current.map((message) =>
        message.id === id ? { ...message, content: message.content + text } : message,
      ),
    );
  }, []);

  const sendMessage = useCallback(
    async (text: string) => {
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
            message.id === assistantId ? { ...message, content: CHAT_ERROR_MESSAGE } : message,
          ),
        );
      } finally {
        setIsLoading(false);
        setStreamingId(null);
      }
    },
    [appendToMessage, isLoading, messages],
  );

  const clearConversation = useCallback(() => {
    setMessages([]);
    clearStoredMessages();
  }, []);

  return {
    messages,
    input,
    setInput,
    isLoading,
    /** Id of the message currently receiving tokens, or `null` between turns. */
    streamingId,
    sendMessage,
    clearConversation,
    isEmpty: messages.length === 0,
    /** Typing dots belong on screen only until the first token lands. */
    showTypingIndicator: isLoading && streamingId === null,
  };
}
