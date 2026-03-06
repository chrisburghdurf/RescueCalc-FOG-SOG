"use client";

import { useState } from "react";
import { CitationCard } from "@/components/citation-card";
import { hasConfidentMatch, searchChunks } from "@/lib/search";
import type { Citation } from "@/lib/types";

function buildDraftAnswer(question: string, citations: Citation[]) {
  if (!citations.length) {
    return "Not enough info. Upload and index relevant FOG/SOG sections, then try again.";
  }

  return `Closest references for: \"${question}\". Use citations below to verify procedures before action.`;
}

export function QuickSearch() {
  const [query, setQuery] = useState("");
  const [answer, setAnswer] = useState("");
  const [recommendedSteps, setRecommendedSteps] = useState<string[]>([]);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [citations, setCitations] = useState<Citation[]>([]);
  const [loading, setLoading] = useState(false);

  const onSearch = async () => {
    setLoading(true);

    try {
      const hits = await searchChunks(query, 6);
      const citationRows: Citation[] = hits.map((hit) => ({
        source: "document",
        docId: hit.docId,
        docTitle: hit.docTitle,
        pageNumber: hit.pageNumber,
        sectionTitle: hit.sectionTitle,
        excerpt: hit.excerpt,
        chunkId: hit.chunkId,
      }));

      setCitations(citationRows);
      setWarnings([
        "Treat this as a training/reference aid, not standalone command direction.",
        "Confirm current hazard conditions and manufacturer limits before acting.",
      ]);

      if (!hasConfidentMatch(hits)) {
        setAnswer("Not enough info. Here are the closest references available.");
        setRecommendedSteps([
          "Upload additional FOG/SOG pages tied to this scenario.",
          "Re-run the query with more specific terms (shore type, angle, load, or lift setup).",
        ]);
      } else {
        setAnswer(buildDraftAnswer(query, citationRows));
        setRecommendedSteps(
          citationRows.slice(0, 3).map((citation) => `Review ${citation.docTitle} page ${citation.pageNumber}: ${citation.sectionTitle}`),
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const summaryText = [
    `Question: ${query}`,
    `Result: ${answer}`,
    "Recommended steps:",
    ...recommendedSteps.map((step, index) => `${index + 1}. ${step}`),
    "Warnings:",
    ...warnings.map((warning) => `- ${warning}`),
    "Citations:",
    ...(citations.length
      ? citations.map((citation) => `- ${citation.docTitle} p.${citation.pageNumber} ${citation.sectionTitle}`)
      : ["- No citation found"]),
  ].join("\n");

  return (
    <section className="grid gap-4">
      <section className="panel p-4">
        <h2 className="text-lg font-semibold text-slate-900">Quick Search</h2>
        <p className="mt-1 text-sm text-slate-600">Ask a field question and review top-matching citations.</p>

        <div className="mt-3 flex flex-col gap-2 sm:flex-row">
          <input
            className="field-input"
            placeholder="Example: Recommended cribbing capture interval during a bag lift"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <button
            className="rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white"
            onClick={onSearch}
            disabled={loading || !query.trim()}
          >
            {loading ? "Searching..." : "Search"}
          </button>
        </div>
      </section>

      <section className="panel p-4">
        <h3 className="text-base font-semibold text-slate-900">Result</h3>
        <p className="mt-2 text-sm text-slate-700">{answer || "Run a search to view recommendations and citations."}</p>
      </section>

      <section className="panel p-4">
        <h3 className="text-sm font-semibold text-slate-900">Recommended steps</h3>
        <ol className="mt-2 list-inside list-decimal space-y-1 text-sm text-slate-700">
          {recommendedSteps.length ? recommendedSteps.map((step) => <li key={step}>{step}</li>) : <li>No steps yet.</li>}
        </ol>
      </section>

      <section className="panel p-4">
        <h3 className="text-sm font-semibold text-slate-900">Warnings / limits</h3>
        <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-slate-700">
          {warnings.length ? warnings.map((warning) => <li key={warning}>{warning}</li>) : <li>No warnings yet.</li>}
        </ul>
      </section>

      <section className="grid gap-2">
        <h3 className="text-sm font-semibold text-slate-900">Citations</h3>
        {citations.length ? (
          citations.map((citation) => <CitationCard key={citation.chunkId} citation={citation} />)
        ) : (
          <p className="text-sm text-slate-600">No citations yet.</p>
        )}
      </section>

      <section className="flex flex-wrap gap-2">
        <button
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold"
          onClick={async () => {
            await navigator.clipboard.writeText(summaryText);
          }}
        >
          Copy to Notes
        </button>
        <button
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold"
          onClick={async () => {
            if (navigator.share) {
              await navigator.share({ title: "Quick Search Summary", text: summaryText });
              return;
            }
            await navigator.clipboard.writeText(summaryText);
          }}
        >
          Share summary
        </button>
      </section>
    </section>
  );
}
