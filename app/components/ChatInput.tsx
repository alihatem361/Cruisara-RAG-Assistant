"use client";

import { type FormEvent, type KeyboardEvent } from "react";
import { Send } from "lucide-react";
import { useAutoResizeTextarea } from "@/app/hooks/useAutoResizeTextarea";

interface ChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  disabled: boolean;
}

export function ChatInput({ value, onChange, onSubmit, disabled }: ChatInputProps) {
  const textareaRef = useAutoResizeTextarea(value);

  const canSubmit = value.trim().length > 0 && !disabled;

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (canSubmit) onSubmit();
  }

  // Enter sends, Shift+Enter inserts a newline.
  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      if (canSubmit) onSubmit();
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex items-end gap-2 rounded-2xl border border-sand-200 bg-white p-2 shadow-lg shadow-ocean-900/5 focus-within:border-gold-400"
    >
      <label htmlFor="chat-input" className="sr-only">
        Ask the Cruisara concierge
      </label>
      <textarea
        id="chat-input"
        ref={textareaRef}
        rows={1}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Ask about tours, prices, or availability…"
        className="max-h-40 flex-1 resize-none bg-transparent px-3 py-2.5 text-ocean-900 placeholder:text-ocean-400/70 focus:outline-none"
      />
      <button
        type="submit"
        disabled={!canSubmit}
        aria-label="Send message"
        className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-ocean-800 text-sand-50 transition-colors hover:bg-ocean-600 disabled:cursor-not-allowed disabled:bg-ocean-200 disabled:text-ocean-400"
      >
        <Send className="size-5" aria-hidden />
      </button>
    </form>
  );
}
