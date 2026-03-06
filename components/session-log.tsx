"use client";

import { useEffect, useState, startTransition } from "react";
import { jsPDF } from "jspdf";
import { clearSessions, listSessions } from "@/lib/db";
import type { SessionEntry } from "@/lib/types";

export function SessionLog() {
  const [sessions, setSessions] = useState<SessionEntry[]>([]);

  const refresh = async () => {
    const next = await listSessions();
    startTransition(() => {
      setSessions(next);
    });
  };

  useEffect(() => {
    void refresh();
  }, []);

  const exportJson = () => {
    const payload = JSON.stringify(sessions, null, 2);
    const blob = new Blob([payload], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `rescue-session-${Date.now()}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const exportPdf = () => {
    const pdf = new jsPDF();
    let y = 10;

    pdf.setFontSize(12);
    pdf.text("Rescue FOG/SOG Assistant - Session Log", 10, y);
    y += 8;

    sessions.forEach((entry, index) => {
      const block = [
        `${index + 1}. ${entry.tool} | ${new Date(entry.createdAt).toLocaleString()}`,
        `Inputs: ${JSON.stringify(entry.inputs)}`,
        `Steps: ${entry.recommendedSteps.join(" | ")}`,
        `Assumptions: ${(entry.assumptions ?? []).join(" | ")}`,
        `Warnings: ${entry.warnings.join(" | ")}`,
        `Citations: ${entry.citations.map((c) => `${c.docTitle} p.${c.pageNumber}`).join(", ") || "none"}`,
      ];

      for (const line of block) {
        const wrapped = pdf.splitTextToSize(line, 185);
        for (const chunk of wrapped) {
          if (y > 280) {
            pdf.addPage();
            y = 10;
          }
          pdf.text(chunk, 10, y);
          y += 6;
        }
      }

      y += 3;
    });

    pdf.save(`rescue-session-${Date.now()}.pdf`);
  };

  return (
    <section className="grid gap-4">
      <section className="panel p-4">
        <h2 className="text-lg font-semibold text-slate-900">Session Log</h2>
        <p className="mt-1 text-sm text-slate-600">Each calculator or guided run is saved locally for handoff notes.</p>

        <div className="mt-3 flex flex-wrap gap-2">
          <button className="rounded-lg bg-slate-900 px-3 py-2 text-sm font-semibold text-white" onClick={exportJson}>
            Export JSON
          </button>
          <button className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold" onClick={exportPdf}>
            Export PDF
          </button>
          <button
            className="rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700"
            onClick={async () => {
              await clearSessions();
              await refresh();
            }}
          >
            Clear log
          </button>
        </div>
      </section>

      <section className="grid gap-3">
        {sessions.length ? (
          sessions.map((entry) => (
            <article key={entry.id} className="panel p-3">
              <p className="text-sm font-semibold text-slate-900">{entry.tool}</p>
              <p className="text-xs text-slate-600">{new Date(entry.createdAt).toLocaleString()}</p>
              <details className="mt-2">
                <summary className="cursor-pointer text-sm font-medium text-slate-700">Show details</summary>
                <pre className="mt-2 overflow-auto rounded-lg bg-slate-100 p-2 text-xs">
                  {JSON.stringify(entry, null, 2)}
                </pre>
              </details>
            </article>
          ))
        ) : (
          <p className="text-sm text-slate-700">No saved sessions yet.</p>
        )}
      </section>
    </section>
  );
}
