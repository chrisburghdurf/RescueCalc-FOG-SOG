"use client";

import { useEffect, useMemo, useState } from "react";
import { executeRule, getAllRules, type RuleExecutionResult } from "@/lib/rules/engine";
import { getRuleCitationLinks, saveRuleCitationLinks, saveSession } from "@/lib/db";
import { searchChunks } from "@/lib/search";
import { CitationCard } from "@/components/citation-card";
import type { SearchHit } from "@/lib/types";

function makeSessionId() {
  return `run-${Math.random().toString(36).slice(2, 9)}-${Date.now().toString(36)}`;
}

function formatLabel(inputId: string) {
  return inputId.replaceAll("_", " ");
}

function isFeetField(fieldId: string, label: string) {
  return fieldId.endsWith("Ft") || /\(ft\)/i.test(label);
}

function splitFeetValue(value: string) {
  const totalFeet = Number(value);
  if (!Number.isFinite(totalFeet)) {
    return { feet: 0, inches: 0 };
  }
  const feet = Math.trunc(totalFeet);
  const inches = (totalFeet - feet) * 12;
  return { feet, inches: Number(inches.toFixed(2)) };
}

export function RuleRunner({ ruleId, compact = false }: { ruleId: string; compact?: boolean }) {
  const rule = useMemo(() => getAllRules().find((entry) => entry.id === ruleId), [ruleId]);
  const defaultValues = useMemo(() => {
    if (!rule) {
      return {};
    }
    return Object.fromEntries(
      rule.inputs.map((field) => [field.id, field.defaultValue !== undefined ? String(field.defaultValue) : ""]),
    );
  }, [rule]);

  const [values, setValues] = useState<Record<string, string>>({});
  const [feetInchInputs, setFeetInchInputs] = useState<Record<string, { feet: string; inches: string }>>({});
  const [result, setResult] = useState<RuleExecutionResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [linkQuery, setLinkQuery] = useState("");
  const [linkHits, setLinkHits] = useState<SearchHit[]>([]);
  const [linkedChunkIds, setLinkedChunkIds] = useState<string[]>([]);
  const [linkStatus, setLinkStatus] = useState("");

  useEffect(() => {
    if (!rule || !rule.placeholder) {
      return;
    }

    let cancelled = false;
    const load = async () => {
      const saved = await getRuleCitationLinks(rule.id);
      if (!cancelled) {
        setLinkedChunkIds(saved?.chunkIds ?? []);
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [rule]);

  if (!rule) {
    return <p className="text-sm text-red-700">Module not found.</p>;
  }

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    try {
      const payload = { ...defaultValues, ...values };
      const execution = await executeRule(rule.id, payload);
      setResult(execution);

      await saveSession({
        id: makeSessionId(),
        tool: execution.tool,
        inputs: payload,
        recommendedSteps: execution.recommendedSteps,
        assumptions: execution.assumptions,
        warnings: execution.warnings,
        citations: execution.citations,
        createdAt: Date.now(),
      });
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Failed to run module.");
    }
  };

  const summaryText = result
    ? [
        `Module: ${result.tool}`,
        `Recommended steps:`,
        ...result.recommendedSteps.map((step, index) => `${index + 1}. ${step}`),
        `Assumptions:`,
        ...result.assumptions.map((assumption) => `- ${assumption}`),
        `Warnings:`,
        ...result.warnings.map((warning) => `- ${warning}`),
      ].join("\n")
    : "";

  const resolvedValue = (fieldId: string) => values[fieldId] ?? defaultValues[fieldId] ?? "";
  const resolvedFeetInch = (fieldId: string) => {
    const existing = feetInchInputs[fieldId];
    if (existing) {
      return existing;
    }
    const split = splitFeetValue(String(resolvedValue(fieldId)));
    return {
      feet: String(split.feet),
      inches: String(split.inches),
    };
  };

  return (
    <section className="panel p-4">
      {!compact ? <h2 className="text-lg font-semibold text-slate-900">{rule.toolName}</h2> : null}
      {!compact ? <p className="mt-1 text-sm text-slate-600">{rule.description}</p> : null}

      {rule.placeholder ? (
        <p className="mt-2 rounded-lg bg-amber-50 p-2 text-xs font-semibold text-amber-900">
          {rule.placeholderLabel ?? "Placeholder module. Link citations from uploaded manuals before use."}
        </p>
      ) : null}

      {rule.placeholder ? (
        <section className="mt-3 grid gap-2 rounded-xl border border-amber-300 bg-amber-50/70 p-3">
          <h3 className="text-sm font-semibold text-amber-900">Link citations to this placeholder module</h3>
          <div className="flex flex-col gap-2 sm:flex-row">
            <input
              className="field-input"
              value={linkQuery}
              onChange={(e) => setLinkQuery(e.target.value)}
              placeholder="Search uploaded docs for module references"
            />
            <button
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold"
              type="button"
              disabled={!linkQuery.trim()}
              onClick={async () => {
                const hits = await searchChunks(linkQuery, 8);
                setLinkHits(hits);
              }}
            >
              Search
            </button>
            <button
              className="rounded-lg bg-slate-900 px-3 py-2 text-sm font-semibold text-white"
              type="button"
              onClick={async () => {
                await saveRuleCitationLinks(rule.id, linkedChunkIds);
                setLinkStatus(`Saved ${linkedChunkIds.length} citation link(s).`);
              }}
            >
              Save Links
            </button>
          </div>
          {linkStatus ? <p className="text-xs text-slate-700">{linkStatus}</p> : null}
          <div className="grid gap-2">
            {linkHits.map((hit) => (
              <label key={hit.chunkId} className="rounded-lg border border-slate-300 bg-white p-2 text-xs text-slate-700">
                <input
                  className="mr-2"
                  type="checkbox"
                  checked={linkedChunkIds.includes(hit.chunkId)}
                  onChange={() => {
                    setLinkedChunkIds((current) =>
                      current.includes(hit.chunkId)
                        ? current.filter((id) => id !== hit.chunkId)
                        : [...current, hit.chunkId],
                    );
                  }}
                />
                {hit.docTitle} | p.{hit.pageNumber} | {hit.sectionTitle}
              </label>
            ))}
          </div>
        </section>
      ) : null}

      <form className="mt-4 grid gap-3" onSubmit={onSubmit}>
        {rule.inputs.map((field) => (
          <label key={field.id} className="grid gap-1 text-sm">
            <span className="font-medium text-slate-700">{field.label}</span>
            {field.type === "select" ? (
              <select
                className="field-input"
                value={resolvedValue(field.id)}
                onChange={(e) => setValues((current) => ({ ...current, [field.id]: e.target.value }))}
              >
                {field.options?.map((option) => (
                  <option value={option.value} key={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            ) : (
              <>
                {isFeetField(field.id, field.label) ? (
                  <div className="grid grid-cols-2 gap-2">
                    <div className="grid gap-1 text-xs text-slate-600">
                      <span>Feet</span>
                      <input
                        className="field-input"
                        inputMode="decimal"
                        value={resolvedFeetInch(field.id).feet}
                        onChange={(e) => {
                          const pair = resolvedFeetInch(field.id);
                          const feet = Number(e.target.value || 0);
                          const inches = Number(pair.inches || 0);
                          const total = feet + inches / 12;
                          setFeetInchInputs((prev) => ({
                            ...prev,
                            [field.id]: { feet: e.target.value, inches: pair.inches },
                          }));
                          setValues((prev) => ({ ...prev, [field.id]: String(total) }));
                        }}
                        step={1}
                      />
                    </div>
                    <div className="grid gap-1 text-xs text-slate-600">
                      <span>Inches</span>
                      <input
                        className="field-input"
                        inputMode="decimal"
                        value={resolvedFeetInch(field.id).inches}
                        onChange={(e) => {
                          const pair = resolvedFeetInch(field.id);
                          const feet = Number(pair.feet || 0);
                          const inches = Number(e.target.value || 0);
                          const total = feet + inches / 12;
                          setFeetInchInputs((prev) => ({
                            ...prev,
                            [field.id]: { feet: pair.feet, inches: e.target.value },
                          }));
                          setValues((prev) => ({ ...prev, [field.id]: String(total) }));
                        }}
                        step={0.25}
                      />
                    </div>
                  </div>
                ) : (
                  <input
                    className="field-input"
                    inputMode="decimal"
                    value={resolvedValue(field.id)}
                    onChange={(e) => setValues((current) => ({ ...current, [field.id]: e.target.value }))}
                    min={field.min}
                    max={field.max}
                    step={field.step ?? 1}
                  />
                )}
              </>
            )}
          </label>
        ))}

        <button className="rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white" type="submit">
          Run Module
        </button>
      </form>

      {error ? <p className="mt-3 text-sm text-red-700">{error}</p> : null}
      {result?.note ? <p className="mt-3 rounded-lg bg-amber-50 p-3 text-sm text-amber-900">{result.note}</p> : null}

      {result ? (
        <div className="mt-4 grid gap-3">
          <section className="panel p-3">
            <h3 className="text-sm font-semibold text-slate-900">Recommended steps</h3>
            <ol className="mt-2 list-inside list-decimal space-y-1 text-sm text-slate-700">
              {result.recommendedSteps.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ol>
          </section>

          <section className="panel p-3">
            <h3 className="text-sm font-semibold text-slate-900">Assumptions</h3>
            <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-slate-700">
              {result.assumptions.map((assumption) => (
                <li key={assumption}>{assumption}</li>
              ))}
            </ul>
          </section>

          <section className="panel p-3">
            <h3 className="text-sm font-semibold text-slate-900">Warnings</h3>
            <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-slate-700">
              {result.warnings.map((warning) => (
                <li key={warning}>{warning}</li>
              ))}
            </ul>
          </section>

          <section className="panel p-3">
            <h3 className="text-sm font-semibold text-slate-900">Computed values</h3>
            <dl className="mt-2 grid grid-cols-1 gap-2 text-sm text-slate-700 sm:grid-cols-2">
              {Object.entries(result.computed).map(([key, value]) => (
                <div key={key} className="rounded-lg bg-white px-2 py-1">
                  <dt className="text-xs uppercase text-slate-500">{formatLabel(key)}</dt>
                  <dd className="font-semibold text-slate-900">{value}</dd>
                </div>
              ))}
            </dl>
          </section>

          <section className="grid gap-2">
            <h3 className="text-sm font-semibold text-slate-900">Citations</h3>
            {result.citations.length ? (
              result.citations.map((citation) => <CitationCard key={`${citation.source}:${citation.chunkId}`} citation={citation} />)
            ) : (
              <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-900">
                Insufficient reference support. Review closest references and upload additional pages.
              </p>
            )}
          </section>

          {result.closestReferences.length ? (
            <section className="grid gap-2">
              <h3 className="text-sm font-semibold text-slate-900">Closest references</h3>
              {result.closestReferences.map((citation) => (
                <CitationCard key={`closest:${citation.chunkId}`} citation={citation} />
              ))}
            </section>
          ) : null}

          <section className="flex flex-wrap gap-2">
            <button
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold"
              onClick={async () => navigator.clipboard.writeText(summaryText)}
              type="button"
            >
              Copy to Notes
            </button>
            <button
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold"
              onClick={async () => {
                if (navigator.share) {
                  await navigator.share({ title: result.tool, text: summaryText });
                  return;
                }
                await navigator.clipboard.writeText(summaryText);
              }}
              type="button"
            >
              Share summary
            </button>
          </section>
        </div>
      ) : null}
    </section>
  );
}
