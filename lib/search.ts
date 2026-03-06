import { getAllChunks, listDocs } from "@/lib/db";
import { tokenize } from "@/lib/text";
import type { SearchHit } from "@/lib/types";

function tf(token: string, tokens: string[]) {
  let count = 0;
  for (const t of tokens) {
    if (t === token) {
      count += 1;
    }
  }
  return count / Math.max(tokens.length, 1);
}

export async function searchChunks(query: string, limit = 5): Promise<SearchHit[]> {
  const queryTokens = tokenize(query);
  if (!queryTokens.length) {
    return [];
  }

  const chunks = await getAllChunks();
  if (!chunks.length) {
    return [];
  }

  const docs = await listDocs();
  const docTitleById = new Map(docs.map((doc) => [doc.id, doc.title]));

  const df = new Map<string, number>();
  for (const token of queryTokens) {
    let count = 0;
    for (const chunk of chunks) {
      if (chunk.tokens.includes(token)) {
        count += 1;
      }
    }
    df.set(token, count);
  }

  const scored = chunks
    .map((chunk) => {
      let score = 0;
      for (const token of queryTokens) {
        const tokenDf = df.get(token) ?? 0;
        const idf = Math.log((chunks.length + 1) / (tokenDf + 1)) + 1;
        score += tf(token, chunk.tokens) * idf;
      }

      return {
        chunk,
        score,
      };
    })
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((item) => ({
      chunkId: item.chunk.id,
      docId: item.chunk.docId,
      pageNumber: item.chunk.pageNumber,
      sectionTitle: item.chunk.sectionTitle,
      excerpt: item.chunk.text.slice(0, 240),
      score: Number(item.score.toFixed(4)),
      docTitle: docTitleById.get(item.chunk.docId) ?? item.chunk.docId,
    }));

  return scored;
}

export function hasConfidentMatch(hits: SearchHit[]) {
  if (!hits.length) {
    return false;
  }

  return hits[0].score >= 0.08;
}
