"use client";

import { useState } from "react";
import { ingestDocument } from "@/lib/ingest";
import { seedDocs } from "@/lib/seedDocs";

export function SeedDocLoader({ onLoaded }: { onLoaded?: () => Promise<void> | void }) {
  const [busyId, setBusyId] = useState<string | null>(null);
  const [status, setStatus] = useState<string>("");

  return (
    <section className="panel p-4">
      <h3 className="text-base font-semibold text-slate-900">Load Seed Docs</h3>
      <p className="mt-1 text-sm text-slate-700">
        Loads PDFs already placed in this workspace and indexes them locally.
      </p>
      <div className="mt-3 grid gap-2">
        {seedDocs.map((doc) => (
          <button
            key={doc.fileName}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-left text-sm font-semibold"
            disabled={busyId !== null}
            onClick={async () => {
              setBusyId(doc.fileName);
              setStatus(`Indexing ${doc.label}...`);
              try {
                const response = await fetch(doc.publicPath);
                const blob = await response.blob();
                const file = new File([blob], doc.fileName, { type: "application/pdf" });
                await ingestDocument(file, doc.sourceType);
                setStatus(`Indexed ${doc.label}`);
                await onLoaded?.();
              } catch (error) {
                setStatus(error instanceof Error ? error.message : "Failed to index seed doc.");
              } finally {
                setBusyId(null);
              }
            }}
            type="button"
          >
            {busyId === doc.fileName ? "Indexing..." : `Index ${doc.label}`}
          </button>
        ))}
      </div>
      {status ? <p className="mt-3 text-xs text-slate-700">{status}</p> : null}
    </section>
  );
}
