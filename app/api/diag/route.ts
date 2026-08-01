import { GoogleGenAI } from "@google/genai";
import { createHash } from "node:crypto";

// TEMPORARY DIAGNOSTIC ENDPOINT — delete this file once the 403 is resolved.
// It never returns the API key itself, only a non-reversible fingerprint so the
// deployed value can be compared against the local one.

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function fingerprint(value: string) {
  return createHash("sha256").update(value).digest("hex").slice(0, 12);
}

export async function GET() {
  const rawKey = process.env.GEMINI_API_KEY;
  const rawStore = process.env.GEMINI_FILE_STORE_NAME;

  const key = (rawKey ?? "").trim();
  const store = (rawStore ?? "").trim();

  const report: Record<string, unknown> = {
    key: {
      present: rawKey !== undefined,
      rawLength: rawKey?.length ?? 0,
      trimmedLength: key.length,
      hadSurroundingWhitespace: (rawKey ?? "") !== key,
      hasQuotes: /^["']|["']$/.test(rawKey ?? ""),
      prefix: key.slice(0, 6),
      fingerprint: key ? fingerprint(key) : null,
    },
    store: {
      present: rawStore !== undefined,
      rawLength: rawStore?.length ?? 0,
      value: store,
      hadSurroundingWhitespace: (rawStore ?? "") !== store,
    },
    vercel: {
      env: process.env.VERCEL_ENV ?? null,
      region: process.env.VERCEL_REGION ?? null,
      deploymentId: process.env.VERCEL_DEPLOYMENT_ID ?? null,
    },
  };

  if (!key || !store) {
    report.result = "MISSING_ENV";
    return Response.json(report, { status: 200 });
  }

  const ai = new GoogleGenAI({ apiKey: key });

  // Test 1: can this key see the store at all?
  try {
    const got = await ai.fileSearchStores.get({ name: store });
    report.storeGet = { ok: true, name: got.name, activeDocuments: got.activeDocumentsCount };
  } catch (error) {
    report.storeGet = { ok: false, error: (error as Error).message?.slice(0, 400) };
  }

  // Test 2: is the key valid at all, independent of File Search?
  try {
    await ai.models.generateContent({
      model: "gemini-3.1-flash-lite",
      contents: [{ role: "user", parts: [{ text: "ping" }] }],
    });
    report.plainGenerate = { ok: true };
  } catch (error) {
    report.plainGenerate = { ok: false, error: (error as Error).message?.slice(0, 400) };
  }

  return Response.json(report, { status: 200 });
}
