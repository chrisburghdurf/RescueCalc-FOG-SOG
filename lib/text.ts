export function tokenize(input: string): string[] {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((token) => token.length > 1);
}

export function chunkText(text: string, chunkSize = 700, overlap = 150): string[] {
  if (!text.trim()) {
    return [];
  }

  const normalized = text.replace(/\s+/g, " ").trim();
  const chunks: string[] = [];
  let index = 0;

  while (index < normalized.length) {
    const end = Math.min(index + chunkSize, normalized.length);
    chunks.push(normalized.slice(index, end));
    if (end === normalized.length) {
      break;
    }
    index = Math.max(0, end - overlap);
  }

  return chunks;
}

export function inferSectionTitle(chunk: string): string {
  const firstSentence = chunk.split(/[.!?]/)[0]?.trim();
  if (!firstSentence) {
    return "Reference";
  }
  return firstSentence.slice(0, 72);
}
