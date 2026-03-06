import { SessionLog } from "@/components/session-log";

export default function SessionPage() {
  return (
    <section>
      <h1 className="mb-3 text-xl font-bold text-slate-900">Session Log</h1>
      <SessionLog />
    </section>
  );
}
