"use client";

import { useMemo, useState } from "react";
import type { ActivityLog } from "@/generated/prisma/client";
import { ArrowRight, Clock, Globe2, ShieldCheck, UserRound } from "lucide-react";

const entityLabels: Record<string, string> = {
  work_item: "Work item",
  person: "Person",
  work_area: "Work area",
  comment: "Comment",
};

const actionStyles: Record<string, string> = {
  created: "bg-emerald-100 text-emerald-700 ring-emerald-200",
  updated: "bg-blue-100 text-blue-700 ring-blue-200",
  deleted: "bg-rose-100 text-rose-700 ring-rose-200",
};

export function ActivityFeed({ initialLogs }: { initialLogs: ActivityLog[] }) {
  const [entityType, setEntityType] = useState("all");
  const [action, setAction] = useState("all");

  const logs = useMemo(
    () =>
      initialLogs.filter((log) => {
        const entityMatch = entityType === "all" || log.entityType === entityType;
        const actionMatch = action === "all" || log.action === action;
        return entityMatch && actionMatch;
      }),
    [action, entityType, initialLogs],
  );

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayCount = initialLogs.filter((log) => new Date(log.createdAt) >= todayStart).length;
  const ipCount = new Set(initialLogs.map((log) => log.ipAddress)).size;

  return (
    <div className="space-y-6">
      <section className="rounded-[2rem] bg-slate-950 p-8 text-white shadow-2xl shadow-slate-300/70">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.3em] text-blue-200">Activity</p>
            <h1 className="mt-3 text-4xl font-black tracking-tight">Audit the changes</h1>
            <p className="mt-3 max-w-2xl text-slate-300">
              Lightweight edit history with account, source IP, field-level changes, and before/after values.
            </p>
          </div>
          <div className="grid grid-cols-3 gap-3 text-center">
            <Metric label="Total" value={initialLogs.length} />
            <Metric label="Today" value={todayCount} />
            <Metric label="IPs" value={ipCount} tone="rose" />
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-white/70 bg-white/85 p-4 shadow-xl shadow-slate-200/70 backdrop-blur">
        <div className="grid gap-3 md:grid-cols-[1fr_220px_220px] md:items-center">
          <div className="flex items-center gap-3 text-sm font-semibold text-slate-700">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-950 text-white">
              <ShieldCheck size={18} />
            </span>
            Account is primary; IP is a secondary audit hint.
          </div>
          <select value={entityType} onChange={(event) => setEntityType(event.target.value)} className="h-11 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-medium shadow-sm outline-none focus:ring-4 focus:ring-blue-100">
            <option value="all">All entities</option>
            <option value="work_item">Work items</option>
            <option value="person">People</option>
            <option value="work_area">Work areas</option>
            <option value="comment">Comments</option>
          </select>
          <select value={action} onChange={(event) => setAction(event.target.value)} className="h-11 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-medium shadow-sm outline-none focus:ring-4 focus:ring-blue-100">
            <option value="all">All actions</option>
            <option value="created">Created</option>
            <option value="updated">Updated</option>
            <option value="deleted">Deleted</option>
          </select>
        </div>
      </section>

      <section className="rounded-[2rem] border border-white/70 bg-white/75 p-4 shadow-xl shadow-slate-200/60 backdrop-blur">
        <div className="mb-2 hidden grid-cols-[150px_110px_minmax(180px,1fr)_140px_1fr_140px_150px] gap-3 px-4 text-xs font-black uppercase tracking-[0.18em] text-slate-400 lg:grid">
          <span>Time</span>
          <span>Action</span>
          <span>Target</span>
          <span>Field</span>
          <span>Change</span>
          <span>Actor</span>
          <span>IP</span>
        </div>
        <div className="space-y-3">
          {logs.map((log) => (
            <article key={log.id} className="grid gap-3 rounded-3xl border border-slate-200/80 bg-white p-4 text-sm shadow-sm lg:grid-cols-[150px_110px_minmax(180px,1fr)_140px_1fr_140px_150px] lg:items-center">
              <div className="flex items-center gap-2 font-semibold text-slate-500">
                <Clock size={15} /> {new Date(log.createdAt).toLocaleString()}
              </div>
              <span className={`w-fit rounded-full px-3 py-1 text-xs font-bold ring-1 ${actionStyles[log.action] ?? "bg-slate-100 text-slate-600 ring-slate-200"}`}>
                {log.action}
              </span>
              <div className="min-w-0">
                <div className="truncate font-bold text-slate-950">{log.entityLabel}</div>
                <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                  {entityLabels[log.entityType] ?? log.entityType}
                </div>
              </div>
              <div className="font-semibold text-slate-600">{log.fieldName ?? "—"}</div>
              <div className="flex min-w-0 items-center gap-2 text-slate-600">
                <Value value={log.oldValue} />
                <ArrowRight className="shrink-0 text-slate-300" size={15} />
                <Value value={log.newValue} />
              </div>
              <div className="flex items-center gap-2 rounded-2xl bg-blue-50 px-3 py-2 text-xs font-bold text-blue-700">
                <UserRound size={14} /> {log.actorUsername ?? "unknown"}
              </div>
              <div className="flex items-center gap-2 rounded-2xl bg-slate-50 px-3 py-2 font-mono text-xs font-semibold text-slate-600">
                <Globe2 size={14} /> {log.ipAddress}
              </div>
            </article>
          ))}
          {logs.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50/70 p-8 text-center text-sm font-medium text-slate-400">
              No activity matches these filters.
            </div>
          ) : null}
        </div>
      </section>
    </div>
  );
}

function Value({ value }: { value: string | null }) {
  return <span className="min-w-0 truncate rounded-xl bg-slate-50 px-2 py-1 text-xs font-semibold text-slate-700">{value ?? "empty"}</span>;
}

function Metric({ label, value, tone = "blue" }: { label: string; value: number; tone?: "blue" | "rose" }) {
  return (
    <div className="min-w-24 rounded-3xl bg-white/10 p-4 ring-1 ring-white/15">
      <div className={`text-3xl font-black ${tone === "rose" ? "text-rose-200" : "text-blue-200"}`}>{value}</div>
      <div className="mt-1 text-xs font-bold uppercase tracking-[0.2em] text-slate-400">{label}</div>
    </div>
  );
}
