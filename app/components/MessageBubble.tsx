import { Bot, User } from "lucide-react";
import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import type { ChatMessage } from "@/app/lib/types";

/** Theme-matched overrides so AI markdown reads like concierge copy, not raw HTML. */
const markdownComponents: Components = {
  p: ({ children }) => <p className="mb-3 last:mb-0 leading-relaxed">{children}</p>,
  ul: ({ children }) => (
    <ul className="mb-3 list-disc space-y-1 pl-5 last:mb-0 marker:text-gold-500">{children}</ul>
  ),
  ol: ({ children }) => (
    <ol className="mb-3 list-decimal space-y-1 pl-5 last:mb-0 marker:text-gold-500">{children}</ol>
  ),
  li: ({ children }) => <li className="leading-relaxed">{children}</li>,
  strong: ({ children }) => <strong className="font-semibold text-ocean-900">{children}</strong>,
  a: ({ children, href }) => (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="font-medium text-ocean-600 underline decoration-gold-400 underline-offset-2 hover:text-ocean-800"
    >
      {children}
    </a>
  ),
  h1: ({ children }) => <h3 className="mb-2 text-base font-semibold text-ocean-900">{children}</h3>,
  h2: ({ children }) => <h3 className="mb-2 text-base font-semibold text-ocean-900">{children}</h3>,
  h3: ({ children }) => <h4 className="mb-2 font-semibold text-ocean-900">{children}</h4>,
  code: ({ children }) => (
    <code className="rounded bg-sand-100 px-1.5 py-0.5 font-mono text-[0.85em] text-ocean-800">
      {children}
    </code>
  ),
  blockquote: ({ children }) => (
    <blockquote className="my-3 border-l-2 border-gold-400 pl-3 text-ocean-800 italic">
      {children}
    </blockquote>
  ),
  table: ({ children }) => (
    <div className="my-3 overflow-x-auto">
      <table className="w-full border-collapse text-left text-sm">{children}</table>
    </div>
  ),
  th: ({ children }) => (
    <th className="border-b border-sand-200 px-2 py-1.5 font-semibold text-ocean-900">
      {children}
    </th>
  ),
  td: ({ children }) => <td className="border-b border-sand-100 px-2 py-1.5">{children}</td>,
};

interface MessageBubbleProps {
  message: ChatMessage;
  /** Renders the blinking caret while this message is still being streamed. */
  isStreaming?: boolean;
}

export function MessageBubble({ message, isStreaming = false }: MessageBubbleProps) {
  if (message.role === "user") {
    return (
      <div className="flex items-start justify-end gap-3">
        <div className="max-w-[85%] rounded-2xl rounded-tr-sm bg-ocean-800 px-4 py-3 text-sand-50 shadow-sm sm:max-w-[75%]">
          <p className="leading-relaxed whitespace-pre-wrap">{message.content}</p>
        </div>
        <div className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full border border-sand-200 bg-white text-ocean-600">
          <User className="size-4.5" aria-hidden />
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-start gap-3">
      <div className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full bg-ocean-800 text-sand-100">
        <Bot className="size-4.5" aria-hidden />
      </div>
      <div className="max-w-[85%] rounded-2xl rounded-tl-sm border border-sand-200 border-l-2 border-l-gold-400 bg-white px-4 py-3 text-ocean-900 shadow-sm sm:max-w-[75%]">
        <div className={isStreaming ? "streaming-caret" : undefined}>
          <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
            {message.content}
          </ReactMarkdown>
        </div>
      </div>
    </div>
  );
}
