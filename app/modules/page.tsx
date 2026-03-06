"use client";

import { useMemo, useState } from "react";
import { RuleRunner } from "@/components/rule-runner";
import { getAllRules } from "@/lib/rules/engine";

export default function ModulesPage() {
  const modules = useMemo(() => getAllRules(), []);
  const [selected, setSelected] = useState(modules[0]?.id ?? "");

  return (
    <section className="grid gap-4">
      <header className="panel p-4">
        <h1 className="text-xl font-bold text-slate-900">Modules</h1>
        <p className="mt-1 text-sm text-slate-700">Choose a module and run scenario inputs with citations.</p>
      </header>

      <section className="grid gap-3 sm:grid-cols-2">
        {modules.map((module) => (
          <button
            key={module.id}
            className={`panel p-4 text-left ${selected === module.id ? "ring-2 ring-slate-800" : ""}`}
            onClick={() => setSelected(module.id)}
            type="button"
          >
            <h2 className="text-base font-semibold text-slate-900">{module.toolName}</h2>
            <p className="mt-1 text-sm text-slate-700">{module.description}</p>
          </button>
        ))}
      </section>

      {selected ? <RuleRunner key={selected} ruleId={selected} /> : null}
    </section>
  );
}
