export type SourceType = "FOG" | "SOG" | "OTHER";

export type DocStatus = "uploaded" | "parsed" | "indexed" | "error";

export interface StoredDoc {
  id: string;
  sourceType: SourceType;
  title: string;
  version?: string;
  date?: string;
  status: DocStatus;
  pageCount: number;
  createdAt: number;
  updatedAt: number;
}

export interface PageText {
  docId: string;
  pageNumber: number;
  text: string;
}

export interface ChunkRecord {
  id: string;
  docId: string;
  pageNumber: number;
  sectionTitle: string;
  text: string;
  tokens: string[];
}

export interface SearchHit {
  chunkId: string;
  docId: string;
  docTitle: string;
  pageNumber: number;
  sectionTitle: string;
  excerpt: string;
  score: number;
}

export type CitationSource = "document" | "public";

export interface Citation {
  source: CitationSource;
  docId: string;
  docTitle: string;
  pageNumber?: number;
  sectionTitle: string;
  excerpt: string;
  chunkId: string;
  url?: string;
}

export interface SessionEntry {
  id: string;
  tool: string;
  inputs: Record<string, number | string | boolean>;
  recommendedSteps: string[];
  assumptions: string[];
  warnings: string[];
  citations: Citation[];
  createdAt: number;
}

export interface RuleCitationLink {
  ruleId: string;
  chunkIds: string[];
  updatedAt: number;
}

export type UnitSystem = "imperial" | "metric";

export interface UserSettings {
  id: "settings";
  unitSystem: UnitSystem;
  disclaimerAcknowledged: boolean;
  updatedAt: number;
}
