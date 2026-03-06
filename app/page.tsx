import Link from "next/link";
import { getAllRules } from "@/lib/rules/engine";

export default function HomePage() {
  const modules = getAllRules();

  return (
    <section className="grid gap-4">
      <header className="panel p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">RescueCalc FOG/SOG</p>
        <h1 className="mt-1 text-2xl font-bold text-slate-900">Mobile-first rescue reference + field math workspace</h1>
        <p className="mt-2 text-sm text-slate-700">
          Upload authorized manuals, run deterministic modules, and preserve citation-linked session outputs.
        </p>
      </header>

      <section className="grid gap-3 sm:grid-cols-3">
        <Link className="panel p-4" href="/search">
          <h2 className="text-base font-semibold text-slate-900">Quick Search</h2>
          <p className="mt-1 text-sm text-slate-700">Ask a question and inspect top chunks by page citation.</p>
        </Link>
        <Link className="panel p-4" href="/modules">
          <h2 className="text-base font-semibold text-slate-900">Start a Module</h2>
          <p className="mt-1 text-sm text-slate-700">Run one of {modules.length} modules with assumptions and warnings.</p>
        </Link>
        <Link className="panel p-4" href="/session">
          <h2 className="text-base font-semibold text-slate-900">Open Saved Session</h2>
          <p className="mt-1 text-sm text-slate-700">Review and export previous runs for handoff.</p>
        </Link>
      </section>
    </section>
  );
}
