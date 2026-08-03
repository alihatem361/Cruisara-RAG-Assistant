"use client";

import { useState } from "react";
import { Compass, Menu } from "lucide-react";
import { useAutoScroll } from "@/app/hooks/useAutoScroll";
import { useChat } from "@/app/hooks/useChat";
import { ChatInput } from "./ChatInput";
import { MessageBubble } from "./MessageBubble";
import { Sidebar } from "./Sidebar";
import { TypingIndicator } from "./TypingIndicator";

const SUGGESTIONS = [
  "What day trips run from Hurghada?",
  "How much is the Cairo pyramids tour?",
  "Do you offer private yacht charters?",
  "What's included in a snorkeling trip?",
];

export function ChatInterface() {
  const {
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
    isEmpty,
    showTypingIndicator,
  } = useChat();

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const scrollRef = useAutoScroll<HTMLDivElement>([messages, isLoading]);

  return (
    <div className="flex h-dvh bg-gradient-to-b from-sand-50 to-ocean-50">
      <Sidebar
        chats={chatHistory}
        currentChatId={currentChatId}
        onNewChat={startNewChat}
        onSelectChat={loadChat}
        onDeleteChat={deleteChat}
        onClearAll={clearAllHistory}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="shrink-0 border-b border-sand-200 bg-white/80 backdrop-blur">
          <div className="mx-auto flex w-full max-w-3xl items-center gap-3 px-4 py-3.5">
            <button
              type="button"
              onClick={() => setIsSidebarOpen(true)}
              aria-label="Open conversation history"
              className="-ml-1 rounded-lg p-2 text-ocean-600 transition-colors hover:bg-sand-100 lg:hidden"
            >
              <Menu className="size-5" aria-hidden />
            </button>
            <div className="flex size-10 items-center justify-center rounded-full bg-ocean-800 text-gold-400 max-lg:hidden">
              <Compass className="size-5" aria-hidden />
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="truncate font-semibold tracking-tight text-ocean-900">
                Cruisara Tours
              </h1>
              <p className="truncate text-xs text-ocean-600">Your Red Sea travel concierge</p>
            </div>
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
                  Ask about our Red Sea excursions, desert safaris, historical day trips, and
                  private charters — I&apos;ll find the details for you.
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
              Answers are grounded in Cruisara&apos;s tour catalogue. Confirm final details at
              booking.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
