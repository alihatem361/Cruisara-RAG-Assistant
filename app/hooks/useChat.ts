"use client";

import { useCallback, useEffect, useState } from "react";
import type { ChatHistory, ChatMessage } from "@/app/lib/types";
import {
  clearChatHistory,
  clearStoredMessages,
  loadChatHistory,
  loadCurrentChatId,
  loadStoredMessages,
  saveChatHistory,
  saveCurrentChatId,
  saveStoredMessages,
} from "@/app/lib/chatStorage";

/**
 * Fallback contact shown on failure. Kept in an env var so the real client
 * address lives in `.env.local` rather than in a public repository.
 */
const SUPPORT_EMAIL = process.env.NEXT_PUBLIC_SUPPORT_EMAIL || "demo@example.com";

/** Shown in place of the assistant reply when the request or stream fails. */
export const CHAT_ERROR_MESSAGE =
  `I'm having trouble reaching our booking desk right now. Please try again in a moment, or contact us directly at **${SUPPORT_EMAIL}**.`;

const TITLE_MAX_LENGTH = 30;

function createId() {
  return crypto.randomUUID();
}

/**
 * Names a conversation after its first user message.
 */
function deriveTitle(messages: ChatMessage[]): string {
  const firstUserMessage = messages
    .find((message) => message.role === "user")
    ?.content.trim();
  if (!firstUserMessage) return "New Chat";

  return firstUserMessage.length > TITLE_MAX_LENGTH
    ? `${firstUserMessage.slice(0, TITLE_MAX_LENGTH).trimEnd()}…`
    : firstUserMessage;
}

/**
 * Owns the whole conversation: the saved chat list, the open conversation, the
 */
export function useChat() {
  const [messages, setMessages] = useState<ChatMessage[]>(loadStoredMessages);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [streamingId, setStreamingId] = useState<string | null>(null);

  const [chatHistory, setChatHistory] =
    useState<ChatHistory[]>(loadChatHistory);
  const [currentChatId, setCurrentChatId] = useState<string | null>(
    loadCurrentChatId,
  );

  useEffect(() => {
    saveStoredMessages(messages);
  }, [messages]);

  useEffect(() => {
    saveChatHistory(chatHistory);
  }, [chatHistory]);

  useEffect(() => {
    saveCurrentChatId(currentChatId);
  }, [currentChatId]);

  const appendToMessage = useCallback((id: string, text: string) => {
    setMessages((current) =>
      current.map((message) =>
        message.id === id
          ? { ...message, content: message.content + text }
          : message,
      ),
    );
  }, []);

  const commitToHistory = useCallback(
    (chatId: string, finalMessages: ChatMessage[]) => {
      setChatHistory((prevHistory) => {
        const exists = prevHistory.some((chat) => chat.id === chatId);

        if (!exists) {
          return [
            {
              id: chatId,
              title: deriveTitle(finalMessages),
              messages: finalMessages,
            },
            ...prevHistory,
          ];
        }
        // Title is set once, from the opening question, and kept thereafter.
        return prevHistory.map((chat) =>
          chat.id === chatId ? { ...chat, messages: finalMessages } : chat,
        );
      });
    },
    [],
  );

  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || isLoading) return;

      // First message of a fresh conversation mints its sidebar id. Held in a
      const chatId = currentChatId ?? createId();
      if (!currentChatId) setCurrentChatId(chatId);

      const userMessage: ChatMessage = {
        id: createId(),
        role: "user",
        content: trimmed,
      };
      const history = [...messages, userMessage];
      const assistantId = createId();

      setMessages([
        ...history,
        { id: assistantId, role: "assistant", content: "" },
      ]);
      setInput("");
      setIsLoading(true);

      let assistantText = "";

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
          const chunk = decoder.decode(value, { stream: true });
          assistantText += chunk;
          appendToMessage(assistantId, chunk);
        }
      } catch (error) {
        console.error("Chat request failed:", error);
        assistantText = CHAT_ERROR_MESSAGE;
        setMessages((current) =>
          current.map((message) =>
            message.id === assistantId
              ? { ...message, content: CHAT_ERROR_MESSAGE }
              : message,
          ),
        );
      } finally {
        commitToHistory(chatId, [
          ...history,
          { id: assistantId, role: "assistant", content: assistantText },
        ]);
        setIsLoading(false);
        setStreamingId(null);
      }
    },
    [appendToMessage, commitToHistory, isLoading, messages, currentChatId],
  );

  /** Clears the view. The id is minted on first send so empty chats never list. */
  const startNewChat = useCallback(() => {
    setMessages([]);
    setCurrentChatId(null);
    clearStoredMessages();
  }, []);

  const loadChat = useCallback(
    (id: string) => {
      const chatToLoad = chatHistory.find((chat) => chat.id === id);
      if (chatToLoad) {
        setMessages(chatToLoad.messages);
        setCurrentChatId(id);
      }
    },
    [chatHistory],
  );

  const deleteChat = useCallback(
    (id: string) => {
      setChatHistory((prevHistory) =>
        prevHistory.filter((chat) => chat.id !== id),
      );
      if (currentChatId === id) {
        setMessages([]);
        setCurrentChatId(null);
      }
    },
    [currentChatId],
  );

  const clearAllHistory = useCallback(() => {
    setChatHistory([]);
    setMessages([]);
    setCurrentChatId(null);
    clearChatHistory();
    clearStoredMessages();
  }, []);

  return {
    messages,
    input,
    setInput,
    isLoading,
    streamingId,
    sendMessage,

    chatHistory,
    currentChatId,
    startNewChat,
    loadChat,
    deleteChat,
    clearAllHistory,

    isEmpty: messages.length === 0,
    showTypingIndicator: isLoading && streamingId === null,
  };
}
