import { parsePdfToPages } from "@/lib/pdf";
import { chunkText, inferSectionTitle, tokenize } from "@/lib/text";
import { getPagesByDoc, putPages, replaceDocChunks, upsertDoc } from "@/lib/db";
import type { ChunkRecord, SourceType, StoredDoc } from "@/lib/types";

function makeId(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}-${Date.now().toString(36)}`;
}

export async function ingestDocument(file: File, sourceType: SourceType, metadata?: { version?: string; date?: string }) {
  const docId = makeId("doc");
  const now = Date.now();

  const baseDoc: StoredDoc = {
    id: docId,
    sourceType,
    title: file.name,
    version: metadata?.version,
    date: metadata?.date,
    status: "uploaded",
    pageCount: 0,
    createdAt: now,
    updatedAt: now,
  };

  await upsertDoc(baseDoc);

  const pages = await parsePdfToPages(file, docId);
  await putPages(pages);

  await upsertDoc({
    ...baseDoc,
    pageCount: pages.length,
    status: "parsed",
    updatedAt: Date.now(),
  });

  const chunks = buildChunksFromPages(docId, pages);
  await replaceDocChunks(docId, chunks);

  await upsertDoc({
    ...baseDoc,
    pageCount: pages.length,
    status: "indexed",
    updatedAt: Date.now(),
  });

  return docId;
}

export async function reindexDocument(docId: string) {
  const pages = await getPagesByDoc(docId);
  const normalizedPages = pages.map((page) => ({
    docId: page.docId,
    pageNumber: page.pageNumber,
    text: page.text,
  }));
  const chunks = buildChunksFromPages(docId, normalizedPages);
  await replaceDocChunks(docId, chunks);

  return chunks.length;
}

function buildChunksFromPages(docId: string, pages: Array<{ docId: string; pageNumber: number; text: string }>): ChunkRecord[] {
  const chunks: ChunkRecord[] = [];

  for (const page of pages) {
    const pageChunks = chunkText(page.text, 760, 180);
    pageChunks.forEach((piece, index) => {
      chunks.push({
        id: `${docId}:${page.pageNumber}:${index}`,
        docId,
        pageNumber: page.pageNumber,
        sectionTitle: inferSectionTitle(piece),
        text: piece,
        tokens: tokenize(piece),
      });
    });
  }

  return chunks;
}
