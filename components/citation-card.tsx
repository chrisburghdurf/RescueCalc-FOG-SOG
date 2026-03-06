import type { Citation } from "@/lib/types";

export function CitationCard({ citation }: { citation: Citation }) {
  return (
    <details className="panel p-3">
      <summary className="cursor-pointer list-none text-sm font-semibold text-slate-800">
        {citation.source === "document"
          ? `${citation.docTitle} | Page ${citation.pageNumber ?? "?"} | ${citation.sectionTitle}`
          : `${citation.docTitle} | Public dataset`}
      </summary>
      <p className="mt-2 text-sm text-slate-700">{citation.excerpt}</p>
      <p className="mt-2 text-xs text-slate-500">Ref: {citation.chunkId}</p>
      {citation.url ? (
        <a className="mt-2 inline-block text-xs font-semibold text-blue-700 underline" href={citation.url} target="_blank" rel="noreferrer">
          Source link
        </a>
      ) : null}
    </details>
  );
}
