import { Bot } from "lucide-react";

export function TypingIndicator() {
  return (
    <div className="flex items-start gap-3">
      <div className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full bg-ocean-800 text-sand-100">
        <Bot className="size-4.5" aria-hidden />
      </div>
      <div className="flex items-center gap-1.5 rounded-2xl rounded-tl-sm border border-sand-200 bg-white px-4 py-3.5 shadow-sm">
        <span className="sr-only">The concierge is typing…</span>
        {[0, 150, 300].map((delay) => (
          <span
            key={delay}
            className="size-2 animate-bounce rounded-full bg-ocean-400"
            style={{ animationDelay: `${delay}ms` }}
          />
        ))}
      </div>
    </div>
  );
}
