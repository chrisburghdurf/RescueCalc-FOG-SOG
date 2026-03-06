"use client";

import { useEffect, useState } from "react";
import { DocumentManager } from "@/components/document-manager";
import { getSettings, saveSettings } from "@/lib/db";
import type { UnitSystem } from "@/lib/types";

export function SettingsPanel() {
  const [unitSystem, setUnitSystem] = useState<UnitSystem>("imperial");
  const [disclaimerAcknowledged, setDisclaimerAcknowledged] = useState(false);
  const [status, setStatus] = useState("");

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      const saved = await getSettings();
      if (!saved || cancelled) {
        return;
      }
      setUnitSystem(saved.unitSystem);
      setDisclaimerAcknowledged(saved.disclaimerAcknowledged);
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section className="grid gap-4">
      <section className="panel p-4">
        <h2 className="text-lg font-semibold text-slate-900">Preferences</h2>
        <label className="mt-3 grid gap-1 text-sm">
          <span className="font-medium text-slate-700">Units</span>
          <select className="field-input" value={unitSystem} onChange={(e) => setUnitSystem(e.target.value as UnitSystem)}>
            <option value="imperial">Imperial</option>
            <option value="metric">Metric</option>
          </select>
        </label>

        <label className="mt-3 flex items-start gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            checked={disclaimerAcknowledged}
            onChange={(e) => setDisclaimerAcknowledged(e.target.checked)}
          />
          <span>I acknowledge this app is a training aid and does not replace SOPs/manufacturer instructions.</span>
        </label>

        <button
          className="mt-3 rounded-lg bg-slate-900 px-3 py-2 text-sm font-semibold text-white"
          type="button"
          onClick={async () => {
            await saveSettings({ unitSystem, disclaimerAcknowledged });
            setStatus("Settings saved.");
          }}
        >
          Save settings
        </button>

        {status ? <p className="mt-2 text-xs text-slate-700">{status}</p> : null}
      </section>

      <DocumentManager />
    </section>
  );
}
