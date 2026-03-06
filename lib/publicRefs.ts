import publicRefs from "@/data/public_references.json";
import type { Citation } from "@/lib/types";

interface PublicRefRow {
  id: string;
  title: string;
  excerpt: string;
  url: string;
  tags: string[];
}

const DATA = publicRefs as PublicRefRow[];

export function findPublicReferenceById(id: string) {
  return DATA.find((row) => row.id === id);
}

export function findPublicReferencesByTags(tags: string[]): Citation[] {
  const needle = new Set(tags.map((tag) => tag.toLowerCase()));
  return DATA.filter((row) => row.tags.some((tag) => needle.has(tag.toLowerCase()))).map((row) => ({
    source: "public",
    docId: "public-dataset",
    docTitle: `Public Reference: ${row.title}`,
    sectionTitle: row.title,
    excerpt: row.excerpt,
    chunkId: row.id,
    url: row.url,
  }));
}
