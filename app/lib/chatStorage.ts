import type { ChatMessage } from "./types";

export const CHAT_STORAGE_KEY = "cruisara-chat-history";

/**
 * Restores the conversation saved by a previous visit.
 * Callers must be client-side only — this touches `localStorage` directly.
 */
export function loadStoredMessages(): ChatMessage[] {
  try {
    const saved = localStorage.getItem(CHAT_STORAGE_KEY);
    return saved ? (JSON.parse(saved) as ChatMessage[]) : [];
  } catch {
    // Corrupt or unreadable history is discarded rather than crashing the chat.
    localStorage.removeItem(CHAT_STORAGE_KEY);
    return [];
  }
}

export function saveStoredMessages(messages: ChatMessage[]): void {
  try {
    localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(messages));
  } catch {
    // Storage can be full or blocked (private mode). Persistence is a nicety,
    // so a failure here must not interrupt an in-flight conversation.
  }
}

export function clearStoredMessages(): void {
  try {
    localStorage.removeItem(CHAT_STORAGE_KEY);
  } catch {
    // Nothing to recover from — the in-memory state is already cleared.
  }
}
