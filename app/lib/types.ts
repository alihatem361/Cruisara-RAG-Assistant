export type ChatRole = "user" | "assistant";

export interface ChatMessage {
  id: string;
  role: ChatRole;
  content: string;
}

/** One saved conversation as listed in the sidebar. */
export interface ChatHistory {
  id: string;
  title: string;
  messages: ChatMessage[];
}

export interface ChatRequestBody {
  messages: ChatMessage[];
}
