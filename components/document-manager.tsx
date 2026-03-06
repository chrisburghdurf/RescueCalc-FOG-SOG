"use client";

import { useEffect, useState } from "react";
import { deleteDoc, listDocs } from "@/lib/db";
import { ingestDocument, reindexDocument } from "@/lib/ingest";
import type { SourceType, StoredDoc } from "@/lib/types";
import { SeedDocLoader } from "@/components/seed-doc-loader";

export function DocumentManager() {
  const [docs, setDocs] = useState<StoredDoc[]>([]);
  const [sourceType, setSourceType] = useState<SourceType>("FOG");
  const [status, setStatus] = useState<string>("");
  const [busy, setBusy] = useState(false);

  const refresh = async () => {
    setDocs(await listDocs());
  };

  useEffect(() => {
    void refresh();
  }, []);

  const onUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    setBusy(true);
    setStatus(`Uploading ${file.name}...`);

    try {
      await ingestDocument(file, sourceType);
      setStatus(`Indexed ${file.name}`);
      await refresh();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Failed to upload document.");
    } finally {
      setBusy(false);
      event.target.value = "";
    }
  };

  return (
    <section className="grid gap-4">
      <SeedDocLoader onLoaded={refresh} />

      <section className="panel p-4">
        <h2 className="text-lg font-semibold text-slate-900">Upload FOG/SOG PDFs</h2>
        <p className="mt-1 text-sm text-slate-600">Only upload documents you are authorized to use.</p>

        <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_auto]">
          <select className="field-input" value={sourceType} onChange={(e) => setSourceType(e.target.value as SourceType)}>
            <option value="FOG">Paratech FOG</option>
            <option value="SOG">USACE SOG</option>
            <option value="OTHER">Other Manual/SOP</option>
          </select>

          <label className="rounded-xl bg-slate-900 px-4 py-3 text-center text-sm font-semibold text-white">
            Select PDF
            <input className="hidden" type="file" accept="application/pdf" onChange={onUpload} disabled={busy} />
          </label>
        </div>

        <p className="mt-3 text-sm text-slate-700">{status}</p>
      </section>

      <section className="panel p-4">
        <h3 className="text-base font-semibold text-slate-900">Indexed Documents</h3>

        <div className="mt-3 grid gap-3">
          {docs.length ? (
            docs.map((doc) => (
              <article key={doc.id} className="rounded-xl border border-slate-300 bg-white p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="font-semibold text-slate-900">{doc.title}</p>
                    <p className="text-xs text-slate-600">
                      {doc.sourceType} | {doc.pageCount} pages | status: {doc.status}
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <button
                      className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold"
                      onClick={async () => {
                        setBusy(true);
                        setStatus(`Re-indexing ${doc.title}...`);
                        try {
                          await reindexDocument(doc.id);
                          setStatus(`Re-indexed ${doc.title}`);
                          await refresh();
                        } catch (error) {
                          setStatus(error instanceof Error ? error.message : "Failed to re-index.");
                        } finally {
                          setBusy(false);
                        }
                      }}
                      disabled={busy}
                    >
                      Re-index
                    </button>
                    <button
                      className="rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700"
                      onClick={async () => {
                        setBusy(true);
                        setStatus(`Deleting ${doc.title}...`);
                        try {
                          await deleteDoc(doc.id);
                          setStatus(`Deleted ${doc.title}`);
                          await refresh();
                        } catch (error) {
                          setStatus(error instanceof Error ? error.message : "Failed to delete.");
                        } finally {
                          setBusy(false);
                        }
                      }}
                      disabled={busy}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </article>
            ))
          ) : (
            <p className="text-sm text-slate-700">No documents loaded yet.</p>
          )}
        </div>
      </section>
    </section>
  );
}
