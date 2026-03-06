import { openDB, type DBSchema, type IDBPDatabase } from "idb";
import type {
  ChunkRecord,
  Citation,
  PageText,
  RuleCitationLink,
  SessionEntry,
  StoredDoc,
  UserSettings,
} from "@/lib/types";

interface RescueDbSchema extends DBSchema {
  docs: {
    key: string;
    value: StoredDoc;
  };
  pages: {
    key: string;
    value: PageText & { id: string };
    indexes: { "by-doc": string };
  };
  chunks: {
    key: string;
    value: ChunkRecord;
    indexes: { "by-doc": string; "by-doc-page": [string, number] };
  };
  sessions: {
    key: string;
    value: SessionEntry;
    indexes: { "by-created": number };
  };
  ruleLinks: {
    key: string;
    value: RuleCitationLink;
  };
  settings: {
    key: string;
    value: UserSettings;
  };
}

const DB_NAME = "rescue-fog-sog-assistant";
const DB_VERSION = 3;

let dbPromise: Promise<IDBPDatabase<RescueDbSchema>> | null = null;

function getDb() {
  if (!dbPromise) {
    dbPromise = openDB<RescueDbSchema>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains("docs")) {
          db.createObjectStore("docs", { keyPath: "id" });
        }

        if (!db.objectStoreNames.contains("pages")) {
          const pages = db.createObjectStore("pages", { keyPath: "id" });
          pages.createIndex("by-doc", "docId");
        }

        if (!db.objectStoreNames.contains("chunks")) {
          const chunks = db.createObjectStore("chunks", { keyPath: "id" });
          chunks.createIndex("by-doc", "docId");
          chunks.createIndex("by-doc-page", ["docId", "pageNumber"]);
        }

        if (!db.objectStoreNames.contains("sessions")) {
          const sessions = db.createObjectStore("sessions", { keyPath: "id" });
          sessions.createIndex("by-created", "createdAt");
        }

        if (!db.objectStoreNames.contains("ruleLinks")) {
          db.createObjectStore("ruleLinks", { keyPath: "ruleId" });
        }

        if (!db.objectStoreNames.contains("settings")) {
          db.createObjectStore("settings", { keyPath: "id" });
        }
      },
    });
  }
  return dbPromise;
}

export async function upsertDoc(doc: StoredDoc) {
  const db = await getDb();
  await db.put("docs", doc);
}

export async function listDocs() {
  const db = await getDb();
  const docs = await db.getAll("docs");
  return docs.sort((a, b) => b.updatedAt - a.updatedAt);
}

export async function putPages(pages: PageText[]) {
  if (pages.length === 0) {
    return;
  }

  const db = await getDb();
  const tx = db.transaction("pages", "readwrite");
  for (const page of pages) {
    await tx.store.put({ ...page, id: `${page.docId}:${page.pageNumber}` });
  }
  await tx.done;
}

export async function getPagesByDoc(docId: string) {
  const db = await getDb();
  const tx = db.transaction("pages", "readonly");
  return tx.store.index("by-doc").getAll(docId);
}

export async function replaceDocChunks(docId: string, chunks: ChunkRecord[]) {
  const db = await getDb();
  const tx = db.transaction("chunks", "readwrite");
  const index = tx.store.index("by-doc");
  let cursor = await index.openCursor(docId);

  while (cursor) {
    await cursor.delete();
    cursor = await cursor.continue();
  }

  for (const chunk of chunks) {
    await tx.store.put(chunk);
  }

  await tx.done;
}

export async function getAllChunks() {
  const db = await getDb();
  return db.getAll("chunks");
}

export async function getChunkById(chunkId: string) {
  const db = await getDb();
  return db.get("chunks", chunkId);
}

export async function deleteDoc(docId: string) {
  const db = await getDb();
  const tx = db.transaction(["docs", "pages", "chunks"], "readwrite");
  await tx.objectStore("docs").delete(docId);

  const pagesIndex = tx.objectStore("pages").index("by-doc");
  let pagesCursor = await pagesIndex.openCursor(docId);
  while (pagesCursor) {
    await pagesCursor.delete();
    pagesCursor = await pagesCursor.continue();
  }

  const chunkIndex = tx.objectStore("chunks").index("by-doc");
  let chunkCursor = await chunkIndex.openCursor(docId);
  while (chunkCursor) {
    await chunkCursor.delete();
    chunkCursor = await chunkCursor.continue();
  }

  await tx.done;
}

export async function saveSession(entry: SessionEntry) {
  const db = await getDb();
  await db.put("sessions", entry);
}

export async function listSessions() {
  const db = await getDb();
  const sessions = await db.getAll("sessions");
  return sessions.sort((a, b) => b.createdAt - a.createdAt);
}

export async function clearSessions() {
  const db = await getDb();
  await db.clear("sessions");
}

export async function getRuleCitationLinks(ruleId: string) {
  const db = await getDb();
  return db.get("ruleLinks", ruleId);
}

export async function saveRuleCitationLinks(ruleId: string, chunkIds: string[]) {
  const db = await getDb();
  await db.put("ruleLinks", { ruleId, chunkIds, updatedAt: Date.now() });
}

export async function getSettings() {
  const db = await getDb();
  return db.get("settings", "settings");
}

export async function saveSettings(settings: Omit<UserSettings, "id" | "updatedAt">) {
  const db = await getDb();
  await db.put("settings", {
    id: "settings",
    ...settings,
    updatedAt: Date.now(),
  });
}

export async function validateCitations(citations: Citation[]): Promise<Citation[]> {
  const valid: Citation[] = [];

  for (const citation of citations) {
    if (citation.source === "public") {
      valid.push(citation);
      continue;
    }

    const chunk = await getChunkById(citation.chunkId);
    if (!chunk) {
      continue;
    }

    valid.push({
      ...citation,
      source: "document",
      docId: chunk.docId,
      pageNumber: chunk.pageNumber,
      sectionTitle: chunk.sectionTitle,
      excerpt: chunk.text.slice(0, 220),
      chunkId: chunk.id,
    });
  }

  return valid;
}
