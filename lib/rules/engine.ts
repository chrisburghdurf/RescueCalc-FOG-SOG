import { getRuleById, rulesRegistry } from "@/lib/rules/registry";
import { buildInputSchema } from "@/lib/rules/schema";
import { runRuleCalculation } from "@/lib/rules/operations";
import { getRuleCitationLinks, listDocs, validateCitations } from "@/lib/db";
import { searchChunks } from "@/lib/search";
import { findPublicReferencesByTags } from "@/lib/publicRefs";
import type { Citation } from "@/lib/types";

export interface RuleExecutionResult {
  tool: string;
  recommendedSteps: string[];
  assumptions: string[];
  warnings: string[];
  computed: Record<string, number | string>;
  citations: Citation[];
  closestReferences: Citation[];
  confidence: "high" | "low";
  note?: string;
}

export function getAllRules() {
  return rulesRegistry;
}

function dedupeCitations(citations: Citation[]) {
  const seen = new Set<string>();
  const out: Citation[] = [];
  for (const citation of citations) {
    const key = `${citation.source}:${citation.chunkId}`;
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    out.push(citation);
  }
  return out;
}

export async function executeRule(ruleId: string, rawInput: Record<string, string | number>): Promise<RuleExecutionResult> {
  const rule = getRuleById(ruleId);
  if (!rule) {
    throw new Error(`Unknown rule: ${ruleId}`);
  }

  const schema = buildInputSchema(rule);
  const parsed = schema.parse(rawInput);
  const result = runRuleCalculation(rule, parsed as Record<string, string | number>);

  const docs = await listDocs();
  const docById = new Map(docs.map((doc) => [doc.id, doc]));

  const candidateCitations: Citation[] = [];
  const closestReferences: Citation[] = [];

  for (const querySpec of rule.citationQueries) {
    const hits = await searchChunks(querySpec.query, 5);

    for (const hit of hits.slice(0, 2)) {
      closestReferences.push({
        source: "document",
        docId: hit.docId,
        docTitle: hit.docTitle,
        pageNumber: hit.pageNumber,
        sectionTitle: hit.sectionTitle,
        excerpt: hit.excerpt,
        chunkId: hit.chunkId,
      });
    }

    const matchingHit =
      hits.find((hit) => {
        if (!querySpec.preferredSource) {
          return true;
        }
        const doc = docById.get(hit.docId);
        return doc?.sourceType === querySpec.preferredSource;
      }) ?? hits[0];

    if (!matchingHit) {
      continue;
    }

    candidateCitations.push({
      source: "document",
      docId: matchingHit.docId,
      docTitle: matchingHit.docTitle,
      pageNumber: matchingHit.pageNumber,
      sectionTitle: matchingHit.sectionTitle,
      excerpt: matchingHit.excerpt,
      chunkId: matchingHit.chunkId,
    });
  }

  if (rule.placeholder) {
    const link = await getRuleCitationLinks(rule.id);
    const linked = link?.chunkIds ?? [];
    if (linked.length) {
      for (const chunkId of linked) {
        candidateCitations.push({
          source: "document",
          docId: "",
          docTitle: "Linked citation",
          sectionTitle: "Linked chunk",
          excerpt: "",
          chunkId,
        });
      }
    }
  }

  const validatedDocuments = await validateCitations(candidateCitations);
  const normalizedDocs = validatedDocuments.map((citation) => ({
    ...citation,
    source: citation.source ?? "document",
    docTitle: docById.get(citation.docId)?.title ?? citation.docTitle,
  }));

  let citations = dedupeCitations(normalizedDocs);

  if (citations.length === 0 && (rule.calculator === "ropeRescueMA" || rule.calculator === "collapseWeight")) {
    const fallbackTags = rule.calculator === "ropeRescueMA" ? ["rope", "mechanical advantage"] : ["unit weight", "collapse"];
    citations = dedupeCitations(findPublicReferencesByTags(fallbackTags));
  }

  const validatedClosest = await validateCitations(closestReferences);
  const normalizedClosest = dedupeCitations(
    validatedClosest.map((citation) => ({
      ...citation,
      source: "document",
      docTitle: docById.get(citation.docId)?.title ?? citation.docTitle,
    })),
  );

  const placeholderMissingLinks = rule.placeholder && normalizedDocs.length === 0;
  const lowConfidence = citations.length === 0 || placeholderMissingLinks;

  return {
    tool: rule.toolName,
    recommendedSteps: result.recommendedSteps,
    assumptions: result.assumptions,
    warnings: result.warnings,
    computed: result.computed,
    citations,
    closestReferences: normalizedClosest,
    confidence: lowConfidence ? "low" : "high",
    note: lowConfidence
      ? "Insufficient reference support. Link citations from uploaded manuals and review closest pages."
      : undefined,
  };
}
