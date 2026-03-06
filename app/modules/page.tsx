"use client";

import { useMemo, useState } from "react";
import { RuleRunner } from "@/components/rule-runner";
import { getAllRules } from "@/lib/rules/engine";

export default function ModulesPage() {
  const modules = useMemo(() => getAllRules(), []);
  const [selected, setSelected] = useState(modules[0]?.id ?? "");
  const active = modules.find((module) => module.id === selected);

  return (
    <section className="grid gap-4">
      <header className="panel p-4">
        <h1 className="text-xl font-bold text-slate-900">Modules</h1>
        <p className="mt-1 text-sm text-slate-700">Choose a module and run scenario inputs with citations.</p>
      </header>

      <section className="grid gap-4 lg:grid-cols-[320px_1fr] lg:items-start">
        <aside className="panel p-3 lg:sticky lg:top-4">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-600">Module Selector</p>
          <div className="grid gap-2">
            {modules.map((module) => (
              <button
                key={module.id}
                className={`rounded-xl border px-3 py-3 text-left ${
                  selected === module.id
                    ? "border-slate-900 bg-slate-900 text-white"
                    : "border-slate-300 bg-white text-slate-800"
                }`}
                onClick={() => setSelected(module.id)}
                type="button"
              >
                <p className="text-sm font-semibold">{module.toolName}</p>
                <p className={`mt-1 text-xs ${selected === module.id ? "text-slate-200" : "text-slate-600"}`}>
                  {module.description}
                </p>
              </button>
            ))}
          </div>
        </aside>

        <div className="grid gap-3">
          {active ? (
            <section className="panel p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">Active Module</p>
              <h2 className="mt-1 text-lg font-semibold text-slate-900">{active.toolName}</h2>
              <p className="mt-1 text-sm text-slate-700">{active.description}</p>
            </section>
          ) : null}
          {selected ? <RuleRunner key={selected} ruleId={selected} compact /> : null}
        </div>
      </section>
    </section>
  );
}
