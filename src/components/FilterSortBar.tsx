"use client";

import type { Person, Status } from "@/generated/prisma/client";
import { SlidersHorizontal } from "lucide-react";

export type SortMode = "area" | "assignment" | "eta-asc" | "eta-desc" | "status";

export function FilterSortBar({
  people,
  status,
  assignedPersonId,
  sort,
  onStatusChange,
  onAssigneeChange,
  onSortChange,
}: {
  people: Person[];
  status: Status | "all";
  assignedPersonId: string;
  sort: SortMode;
  onStatusChange: (value: Status | "all") => void;
  onAssigneeChange: (value: string) => void;
  onSortChange: (value: SortMode) => void;
}) {
  return (
    <div className="rounded-3xl border border-white/70 bg-white/85 p-4 shadow-xl shadow-slate-200/70 backdrop-blur">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-3 text-sm font-semibold text-slate-700">
          <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-950 text-white">
            <SlidersHorizontal size={18} />
          </span>
          Focus the standup by status, owner, or delivery date.
        </div>
        <div className="grid gap-3 sm:grid-cols-3 lg:min-w-[680px]">
          <select
            value={status}
            onChange={(event) => onStatusChange(event.target.value as Status | "all")}
            className="h-11 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-medium shadow-sm outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-200"
          >
            <option value="all">All statuses</option>
            <option value="todo">To do</option>
            <option value="in_progress">In progress</option>
            <option value="blocked">Blocked</option>
            <option value="done">Done</option>
          </select>
          <select
            value={assignedPersonId}
            onChange={(event) => onAssigneeChange(event.target.value)}
            className="h-11 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-medium shadow-sm outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-200"
          >
            <option value="">All people</option>
            {people.map((person) => (
              <option key={person.id} value={person.id}>
                {person.name}
              </option>
            ))}
          </select>
          <select
            value={sort}
            onChange={(event) => onSortChange(event.target.value as SortMode)}
            className="h-11 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-medium shadow-sm outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-200"
          >
            <option value="area">Group by area</option>
            <option value="assignment">Sort by assignment</option>
            <option value="eta-asc">ETA soonest first</option>
            <option value="eta-desc">ETA latest first</option>
            <option value="status">Sort by status</option>
          </select>
        </div>
      </div>
    </div>
  );
}
