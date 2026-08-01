"use client";

import dynamic from "next/dynamic";

// The chat reads its history from localStorage on first render, so it renders
// client-side only — that keeps the restored conversation free of hydration mismatches.
const ChatInterface = dynamic(
  () => import("./ChatInterface").then((mod) => mod.ChatInterface),
  {
    ssr: false,
    loading: () => <div className="h-dvh bg-gradient-to-b from-sand-50 to-ocean-50" />,
  },
);

export function ChatShell() {
  return <ChatInterface />;
}
