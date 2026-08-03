import type { ChatHistory, ChatMessage } from "./types";

export const CHAT_STORAGE_KEY = "cruisara-chat-history";
export const CHAT_HISTORY_STORAGE_KEY = "cruisara-chat-history-list";
export const CURRENT_CHAT_ID_KEY = "cruisara-current-chat-id";

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

/** The full list of saved conversations shown in the sidebar. */
export function loadChatHistory(): ChatHistory[] {
  try {
    const saved = localStorage.getItem(CHAT_HISTORY_STORAGE_KEY);
    return saved ? (JSON.parse(saved) as ChatHistory[]) : [];
  } catch {
    localStorage.removeItem(CHAT_HISTORY_STORAGE_KEY);
    return [];
  }
}

export function saveChatHistory(chatHistory: ChatHistory[]): void {
  try {
    localStorage.setItem(CHAT_HISTORY_STORAGE_KEY, JSON.stringify(chatHistory));
  } catch {
    // See saveStoredMessages — persistence must never break the conversation.
  }
}

export function clearChatHistory(): void {
  try {
    localStorage.removeItem(CHAT_HISTORY_STORAGE_KEY);
  } catch {
    // Nothing to recover from.
  }
}

/**
 * Which saved conversation the open messages belong to.
 *
 * Without this, a reload restores the messages but forgets their chat id, so the
 * next reply would file the restored conversation under a brand-new id and
 * duplicate it in the sidebar.
 */
export function loadCurrentChatId(): string | null {
  try {
    return localStorage.getItem(CURRENT_CHAT_ID_KEY);
  } catch {
    return null;
  }
}

export function saveCurrentChatId(id: string | null): void {
  try {
    if (id) localStorage.setItem(CURRENT_CHAT_ID_KEY, id);
    else localStorage.removeItem(CURRENT_CHAT_ID_KEY);
  } catch {
    // Non-fatal.
  }
}
