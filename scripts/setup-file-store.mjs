/**
 * One-time setup: creates a Gemini File Search Store and indexes a knowledge
 * base file into it.
 *
 * Defaults to the bundled sample data so the repo runs end to end out of the
 * box. Point KNOWLEDGE_BASE_FILE at a private file to index real data instead:
 *
 *   node --env-file=.env.local scripts/setup-file-store.mjs
 *   KNOWLEDGE_BASE_FILE=../private/real-data.txt npm run setup:store
 *
 * Prints the resulting store name for you to paste into .env.local.
 */

import { GoogleGenAI } from "@google/genai";
import { access, stat } from "node:fs/promises";
import { basename, resolve } from "node:path";

const DEFAULT_DATA_FILE = "knowledge-base/sample-knowledge-base.txt";

const DATA_FILE = resolve(
  process.cwd(),
  process.env.KNOWLEDGE_BASE_FILE || DEFAULT_DATA_FILE,
);
const STORE_DISPLAY_NAME = process.env.FILE_STORE_DISPLAY_NAME || "Travel Assistant Knowledge Base";

const POLL_INTERVAL_MS = 2_000;
const POLL_TIMEOUT_MS = 5 * 60_000;

const sleep = (ms) => new Promise((done) => setTimeout(done, ms));

/**
 * Indexing is a long-running operation. Poll until the server reports it done
 * rather than sleeping a fixed amount — a fixed wait either wastes time or,
 * on a larger file, returns before the document is queryable.
 */
async function waitForOperation(ai, operation, label) {
  const startedAt = Date.now();

  while (!operation.done) {
    if (Date.now() - startedAt > POLL_TIMEOUT_MS) {
      throw new Error(`${label} did not finish within ${POLL_TIMEOUT_MS / 1000}s.`);
    }
    process.stdout.write(".");
    await sleep(POLL_INTERVAL_MS);
    operation = await ai.operations.get({ operation });
  }

  process.stdout.write("\n");

  if (operation.error) {
    throw new Error(`${label} failed: ${JSON.stringify(operation.error)}`);
  }
  return operation;
}

async function main() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error(
      "GEMINI_API_KEY is not set. Add it to .env.local and run with --env-file=.env.local",
    );
  }

  // ---- Step 1: verify the knowledge base file -----------------------------
  console.log("Step 1/4 — Checking for the knowledge base file...");
  await access(DATA_FILE).catch(() => {
    throw new Error(`Could not find ${DATA_FILE}. Run this from the project root.`);
  });
  const { size } = await stat(DATA_FILE);
  console.log(`  Found ${basename(DATA_FILE)} (${(size / 1024).toFixed(1)} KB)`);
  if (!process.env.KNOWLEDGE_BASE_FILE) {
    console.log("  Using the bundled sample data. Set KNOWLEDGE_BASE_FILE to index your own.");
  }
  console.log();

  const ai = new GoogleGenAI({ apiKey });

  // ---- Step 2: create the store -------------------------------------------
  console.log("Step 2/4 — Creating the File Search Store...");
  const store = await ai.fileSearchStores.create({
    config: { displayName: STORE_DISPLAY_NAME },
  });
  console.log(`  Created "${STORE_DISPLAY_NAME}"`);
  console.log(`  Resource name: ${store.name}\n`);

  // ---- Step 3: upload and index -------------------------------------------
  // uploadToFileSearchStore uploads the file AND imports it into the store in
  // one call, so there is no separate "link the file" step to perform.
  console.log("Step 3/4 — Uploading and indexing the knowledge base...");
  console.log("  (chunking and embedding can take a minute)");

  let operation;
  try {
    operation = await ai.fileSearchStores.uploadToFileSearchStore({
      file: DATA_FILE,
      fileSearchStoreName: store.name,
      config: {
        displayName: basename(DATA_FILE),
        mimeType: "text/plain",
      },
    });
    operation = await waitForOperation(ai, operation, "Indexing");
  } catch (error) {
    // Don't leave an empty orphan store behind on a failed import.
    console.error("\n  Indexing failed — cleaning up the empty store...");
    await ai.fileSearchStores
      .delete({ name: store.name, config: { force: true } })
      .catch(() => console.error(`  Could not delete ${store.name}; remove it manually.`));
    throw error;
  }

  // Print only the trailing document ID. The full resource path is
  // `<store name>/documents/<id>`, which is easy to mistake for the store name
  // that belongs in GEMINI_FILE_STORE_NAME.
  const documentId = operation.response?.documentName?.split("/documents/").pop();
  console.log(`  Indexed document ID: ${documentId ?? "(unavailable)"}\n`);

  // ---- Step 4: confirm the store is populated ------------------------------
  console.log("Step 4/4 — Verifying the store...");
  const verified = await ai.fileSearchStores.get({ name: store.name });
  console.log(`  Active documents:  ${verified.activeDocumentsCount ?? 0}`);
  console.log(`  Pending documents: ${verified.pendingDocumentsCount ?? 0}`);
  console.log(`  Failed documents:  ${verified.failedDocumentsCount ?? 0}\n`);

  console.log("Setup complete. Copy the line below into your .env.local");
  console.log("(copy it exactly — it must not include a /documents/ suffix):\n");
  console.log(`GEMINI_FILE_STORE_NAME=${store.name}`);
}

main().catch((error) => {
  console.error(`\nSetup failed: ${error.message}`);
  process.exitCode = 1;
});
