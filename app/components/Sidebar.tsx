"use client";

import { Compass, MessageSquare, Plus, Trash2, X } from "lucide-react";
import type { ChatHistory } from "@/app/lib/types";

interface SidebarProps {
  chats: ChatHistory[];
  currentChatId: string | null;
  onNewChat: () => void;
  onSelectChat: (id: string) => void;
  onDeleteChat: (id: string) => void;
  onClearAll: () => void;
  /** Mobile drawer state — ignored on `lg` and up, where the rail is static. */
  isOpen: boolean;
  onClose: () => void;
}

export function Sidebar({
  chats,
  currentChatId,
  onNewChat,
  onSelectChat,
  onDeleteChat,
  onClearAll,
  isOpen,
  onClose,
}: SidebarProps) {
  function handleSelect(id: string) {
    onSelectChat(id);
    onClose();
  }

  function handleNewChat() {
    onNewChat();
    onClose();
  }

  return (
    <>
      {/* Scrim sits below the drawer but above the chat, mobile only. */}
      {isOpen && (
        <div
          className="fixed inset-0 z-30 bg-ocean-900/40 backdrop-blur-sm lg:hidden"
          onClick={onClose}
          aria-hidden
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-72 flex-col bg-ocean-900 text-sand-100 transition-transform duration-300 ease-out lg:static lg:z-auto lg:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        aria-label="Conversation history"
      >
        <div className="flex items-center gap-2.5 border-b border-white/10 px-4 py-3.5">
          <div className="flex size-9 items-center justify-center rounded-full bg-white/10 text-gold-400">
            <Compass className="size-4.5" aria-hidden />
          </div>
          <span className="flex-1 font-semibold tracking-tight">Cruisara</span>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close menu"
            className="rounded-lg p-1.5 text-sand-100/70 transition-colors hover:bg-white/10 hover:text-sand-50 lg:hidden"
          >
            <X className="size-4.5" aria-hidden />
          </button>
        </div>

        <div className="px-3 py-3">
          <button
            type="button"
            onClick={handleNewChat}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-gold-400/40 bg-gold-400/10 px-3 py-2.5 text-sm font-medium text-gold-400 transition-colors hover:border-gold-400 hover:bg-gold-400/20"
          >
            <Plus className="size-4" aria-hidden />
            New chat
          </button>
        </div>

        <nav className="min-h-0 flex-1 overflow-y-auto px-3 pb-3">
          {chats.length === 0 ? (
            <p className="px-2 py-6 text-center text-xs leading-relaxed text-sand-100/50">
              Your past conversations will appear here.
            </p>
          ) : (
            <ul className="space-y-1">
              {chats.map((chat) => {
                const isActive = chat.id === currentChatId;
                return (
                  <li key={chat.id}>
                    <div
                      className={`group flex items-center gap-2 rounded-lg pr-1 transition-colors ${
                        isActive
                          ? "bg-white/15 text-sand-50"
                          : "text-sand-100/80 hover:bg-white/8 hover:text-sand-50"
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => handleSelect(chat.id)}
                        aria-current={isActive ? "page" : undefined}
                        className="flex min-w-0 flex-1 items-center gap-2.5 px-2.5 py-2.5 text-left text-sm"
                      >
                        <MessageSquare
                          className={`size-4 shrink-0 ${isActive ? "text-gold-400" : "text-sand-100/40"}`}
                          aria-hidden
                        />
                        <span className="truncate">{chat.title}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => onDeleteChat(chat.id)}
                        aria-label={`Delete conversation: ${chat.title}`}
                        className="rounded-md p-1.5 text-sand-100/40 opacity-0 transition-colors group-hover:opacity-100 focus-visible:opacity-100 hover:bg-white/10 hover:text-red-300"
                      >
                        <Trash2 className="size-3.5" aria-hidden />
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </nav>

        {chats.length > 0 && (
          <div className="border-t border-white/10 p-3">
            <button
              type="button"
              onClick={onClearAll}
              className="flex w-full items-center justify-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-sand-100/60 transition-colors hover:bg-white/10 hover:text-red-300"
            >
              <Trash2 className="size-3.5" aria-hidden />
              Clear all history
            </button>
          </div>
        )}
      </aside>
    </>
  );
}
