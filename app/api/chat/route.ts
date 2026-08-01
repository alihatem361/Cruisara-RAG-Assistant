import { GoogleGenAI, type Content } from "@google/genai";
import type { ChatMessage, ChatRequestBody } from "@/app/lib/types";

// The Google Gen AI SDK requires the Node.js runtime (not Edge).
export const runtime = "nodejs";

const MODEL = "gemini-3.1-flash-lite";

const SYSTEM_INSTRUCTION = `You are the AI concierge for Cruisara Tours, a premium travel agency based in Hurghada, Egypt.

Answer guest questions about tours, excursions, prices, schedules, inclusions, and booking policies using ONLY the Cruisara knowledge base available through your file search tool.

Rules:
- Ground every factual claim (prices, durations, start times, inclusions, discounts, contact details) in the retrieved knowledge base. Never invent or estimate them.
- If the knowledge base does not cover something, say so plainly and point the guest to the Cruisara reservations team rather than guessing.
- Prices are in EUR unless the source says otherwise. Always keep the currency attached to the number.
- Write in warm, polished, concierge-style prose. Use short paragraphs, and use markdown bullet lists for inclusions, requirements, or multi-tour comparisons.
- Match the guest's language when they write in something other than English.`;

function isChatMessage(value: unknown): value is ChatMessage {
  if (typeof value !== "object" || value === null) return false;
  const message = value as Partial<ChatMessage>;
  return (
    typeof message.content === "string" &&
    (message.role === "user" || message.role === "assistant")
  );
}

/** Converts our client-side message shape into the Gemini `Content` format. */
function toGeminiContents(messages: ChatMessage[]): Content[] {
  return messages.map((message) => ({
    role: message.role === "assistant" ? "model" : "user",
    parts: [{ text: message.content }],
  }));
}

export async function POST(request: Request) {
  const apiKey = process.env.GEMINI_API_KEY;
  const fileStoreName = process.env.GEMINI_FILE_STORE_NAME;

  if (!apiKey || !fileStoreName) {
    return Response.json(
      { error: "Server is missing GEMINI_API_KEY or GEMINI_FILE_STORE_NAME." },
      { status: 500 },
    );
  }

  let body: ChatRequestBody;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const messages = body.messages;
  if (!Array.isArray(messages) || messages.length === 0 || !messages.every(isChatMessage)) {
    return Response.json(
      { error: "`messages` must be a non-empty array of chat messages." },
      { status: 400 },
    );
  }

  if (messages[messages.length - 1].role !== "user") {
    return Response.json(
      { error: "The last message must come from the user." },
      { status: 400 },
    );
  }

  const ai = new GoogleGenAI({ apiKey });

  let geminiStream: Awaited<ReturnType<typeof ai.models.generateContentStream>>;
  try {
    geminiStream = await ai.models.generateContentStream({
      model: MODEL,
      contents: toGeminiContents(messages),
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        // RAG: ground the model in the Cruisara knowledge base.
        tools: [{ fileSearch: { fileSearchStoreNames: [fileStoreName] } }],
      },
    });
  } catch (error) {
    console.error("[api/chat] Failed to start Gemini stream:", error);
    return Response.json(
      { error: "Failed to reach the assistant. Please try again." },
      { status: 502 },
    );
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        for await (const chunk of geminiStream) {
          if (chunk.text) controller.enqueue(encoder.encode(chunk.text));
        }
        controller.close();
      } catch (error) {
        console.error("[api/chat] Stream interrupted:", error);
        controller.error(error);
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
    },
  });
}
