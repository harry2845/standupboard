"use client";

import { ChangeEvent, useState } from "react";
import { AlertTriangle, DatabaseBackup, Download, Upload } from "lucide-react";

const CONFIRMATION = "IMPORT AND REPLACE";

type Summary = {
  people: number;
  workAreas: number;
  workItems: number;
  comments: number;
  activityLogs: number;
};

export function DatabaseTransferPanel() {
  const [payload, setPayload] = useState<unknown>(null);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [confirmation, setConfirmation] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function exportDatabase() {
    setMessage("");
    setError("");
    setLoading(true);

    const response = await fetch("/api/database/export");
    setLoading(false);

    if (!response.ok) {
      setError("Could not export database.");
      return;
    }

    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filenameFromResponse(response) ?? `standup-export-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
    setMessage("Export downloaded.");
  }

  async function previewImport(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setPayload(null);
    setSummary(null);
    setConfirmation("");
    setMessage("");
    setError("");
    setLoading(true);

    try {
      const parsed = JSON.parse(await file.text());
      const response = await fetch("/api/database/import/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed),
      });
      const body = await response.json().catch(() => null);

      if (!response.ok) {
        setError(body?.message ?? "Invalid export file.");
        return;
      }

      setPayload(parsed);
      setSummary(body.summary);
      setMessage("Import file validated. Review the summary before replacing data.");
    } catch {
      setError("Could not read this JSON file.");
    } finally {
      setLoading(false);
      event.target.value = "";
    }
  }

  async function importDatabase() {
    if (!payload || confirmation !== CONFIRMATION) return;

    setMessage("");
    setError("");
    setLoading(true);

    const response = await fetch("/api/database/import", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ payload, confirm: confirmation }),
    });
    const body = await response.json().catch(() => null);
    setLoading(false);

    if (!response.ok) {
      setError(body?.message ?? "Could not import database.");
      return;
    }

    setSummary(body.summary);
    setPayload(null);
    setConfirmation("");
    setMessage("Import complete. Refresh the board to see the imported data.");
  }

  return (
    <div className="space-y-6">
      <section className="rounded-[2rem] bg-slate-950 p-8 text-white shadow-2xl shadow-slate-300/70">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.3em] text-blue-200">Database</p>
            <h1 className="mt-3 text-4xl font-black tracking-tight">Export and import data</h1>
            <p className="mt-3 max-w-2xl text-slate-300">
              Move board data between environments. Exports include people, areas, items, comments, and activity history, but not accounts or sessions.
            </p>
          </div>
          <span className="flex h-16 w-16 items-center justify-center rounded-3xl bg-white/10 ring-1 ring-white/15">
            <DatabaseBackup size={28} />
          </span>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-[2rem] border border-white/70 bg-white/85 p-6 shadow-xl shadow-slate-200/70 backdrop-blur">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-600 text-white">
              <Download size={19} />
            </span>
            <div>
              <h2 className="text-xl font-black tracking-tight">Export</h2>
              <p className="text-sm font-medium text-slate-500">Download a JSON backup of business data.</p>
            </div>
          </div>
          <button onClick={exportDatabase} disabled={loading} className="mt-6 h-12 w-full rounded-2xl bg-blue-600 text-sm font-bold text-white shadow-lg shadow-blue-200 hover:bg-blue-700 disabled:opacity-60">
            {loading ? "Working..." : "Download export"}
          </button>
        </div>

        <div className="rounded-[2rem] border border-white/70 bg-white/85 p-6 shadow-xl shadow-slate-200/70 backdrop-blur">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-950 text-white">
              <Upload size={19} />
            </span>
            <div>
              <h2 className="text-xl font-black tracking-tight">Import</h2>
              <p className="text-sm font-medium text-slate-500">Preview a JSON file before replacing current data.</p>
            </div>
          </div>
          <label className="mt-6 flex h-12 cursor-pointer items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 text-sm font-bold text-slate-600 hover:bg-slate-100">
            Choose export JSON
            <input type="file" accept="application/json,.json" onChange={previewImport} className="hidden" />
          </label>
        </div>
      </section>

      {error ? <p className="rounded-2xl bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-600">{error}</p> : null}
      {message ? <p className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-600">{message}</p> : null}

      {summary ? (
        <section className="rounded-[2rem] border border-amber-200 bg-amber-50/90 p-6 shadow-xl shadow-amber-100/70">
          <div className="flex items-start gap-3">
            <span className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-amber-500 text-white">
              <AlertTriangle size={18} />
            </span>
            <div className="min-w-0 flex-1">
              <h2 className="text-xl font-black tracking-tight text-amber-950">Import preview</h2>
              <p className="mt-1 text-sm font-semibold text-amber-800">
                This will replace all current board data. Accounts are not changed.
              </p>
              <div className="mt-5 grid gap-3 sm:grid-cols-5">
                <Metric label="People" value={summary.people} />
                <Metric label="Areas" value={summary.workAreas} />
                <Metric label="Items" value={summary.workItems} />
                <Metric label="Comments" value={summary.comments} />
                <Metric label="Activity" value={summary.activityLogs} />
              </div>
              <div className="mt-5 grid gap-3 lg:grid-cols-[1fr_auto]">
                <input value={confirmation} onChange={(event) => setConfirmation(event.target.value)} placeholder={CONFIRMATION} className="h-12 rounded-2xl border border-amber-200 bg-white px-4 text-sm font-bold outline-none focus:ring-4 focus:ring-amber-100" />
                <button onClick={importDatabase} disabled={loading || confirmation !== CONFIRMATION || !payload} className="h-12 rounded-2xl bg-amber-600 px-6 text-sm font-black text-white shadow-lg shadow-amber-200 hover:bg-amber-700 disabled:opacity-60">
                  Replace data
                </button>
              </div>
            </div>
          </div>
        </section>
      ) : null}
    </div>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl bg-white/80 p-4 text-center ring-1 ring-amber-200">
      <div className="text-2xl font-black text-amber-950">{value}</div>
      <div className="mt-1 text-xs font-bold uppercase tracking-[0.16em] text-amber-700">{label}</div>
    </div>
  );
}

function filenameFromResponse(response: Response) {
  const disposition = response.headers.get("content-disposition");
  return disposition?.match(/filename="(.+)"/)?.[1];
}
