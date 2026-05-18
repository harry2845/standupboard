"use client";

import { useMemo, useState, useTransition } from "react";
import type { Person, Status, WorkArea } from "@/generated/prisma/client";
import type { DashboardData, WorkItemWithRelations } from "@/lib/types";
import { FilterSortBar, SortMode } from "./FilterSortBar";
import { WorkItemRow } from "./WorkItemRow";
import { Plus, Sparkles } from "lucide-react";

export function WorkAreaBoard({ initialData }: { initialData: DashboardData }) {
  const [people, setPeople] = useState(initialData.people.filter((person) => person.active));
  const [areas] = useState<(WorkArea & { workItems?: WorkItemWithRelations[] })[]>(initialData.areas);
  const [items, setItems] = useState(initialData.items);
  const [status, setStatus] = useState<Status | "all">("all");
  const [assignedPersonId, setAssignedPersonId] = useState("");
  const [sort, setSort] = useState<SortMode>("area");
  const [newItemAreaId, setNewItemAreaId] = useState(initialData.areas[0]?.id ?? "");
  const [newTitle, setNewTitle] = useState("");
  const [newAssignee, setNewAssignee] = useState("");
  const [newEta, setNewEta] = useState("");
  const [isPending, startTransition] = useTransition();

  const filteredItems = useMemo(() => {
    const result = items.filter((item) => {
      const statusMatch = status === "all" || item.status === status;
      const personMatch = !assignedPersonId || item.assignedPersonId === assignedPersonId;
      return statusMatch && personMatch;
    });

    return [...result].sort((a, b) => {
      if (sort === "assignment") {
        return (a.assignedPerson?.name ?? "zzzz").localeCompare(b.assignedPerson?.name ?? "zzzz");
      }
      if (sort === "eta-desc") {
        return new Date(b.eta ?? 0).getTime() - new Date(a.eta ?? 0).getTime();
      }
      if (sort === "eta-asc") {
        return new Date(a.eta ?? "9999-12-31").getTime() - new Date(b.eta ?? "9999-12-31").getTime();
      }
      if (sort === "status") {
        return a.status.localeCompare(b.status);
      }
      return (a.workArea.sortOrder - b.workArea.sortOrder) || a.title.localeCompare(b.title);
    });
  }, [assignedPersonId, items, sort, status]);

  const grouped = areas.map((area) => ({
    ...area,
    workItems: filteredItems.filter((item) => item.workAreaId === area.id),
  }));

  async function refreshPeople() {
    const response = await fetch("/api/people");
    const nextPeople: Person[] = await response.json();
    setPeople(nextPeople.filter((person) => person.active));
  }

  async function refreshItems() {
    const response = await fetch("/api/work-items");
    setItems(await response.json());
  }

  async function updateItem(id: string, data: Record<string, unknown>) {
    startTransition(async () => {
      await fetch(`/api/work-items/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      await refreshItems();
    });
  }

  async function deleteItem(id: string) {
    startTransition(async () => {
      await fetch(`/api/work-items/${id}`, { method: "DELETE" });
      await refreshItems();
    });
  }

  async function addComment(id: string, data: { body: string; authorName?: string }) {
    startTransition(async () => {
      await fetch(`/api/work-items/${id}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      await refreshItems();
    });
  }

  async function addItem() {
    if (!newTitle.trim() || !newItemAreaId) return;
    startTransition(async () => {
      await fetch("/api/work-items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newTitle,
          workAreaId: newItemAreaId,
          assignedPersonId: newAssignee || null,
          eta: newEta || null,
        }),
      });
      setNewTitle("");
      setNewAssignee("");
      setNewEta("");
      await Promise.all([refreshPeople(), refreshItems()]);
    });
  }

  const flatMode = sort !== "area";
  const doneCount = items.filter((item) => item.status === "done").length;
  const blockedCount = items.filter((item) => item.status === "blocked").length;

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-[2rem] border border-white/70 bg-slate-950 p-8 text-white shadow-2xl shadow-slate-300/70">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-sm font-semibold text-blue-100 ring-1 ring-white/15">
              <Sparkles size={16} /> Daily operating view
            </div>
            <h1 className="max-w-3xl text-4xl font-black tracking-tight sm:text-5xl">
              Run standup from one focused board.
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-slate-300">
              Track ownership, ETA, status, and comments without jumping between docs.
            </p>
          </div>
          <div className="grid grid-cols-3 gap-3 text-center">
            <Metric label="Items" value={items.length} />
            <Metric label="Done" value={doneCount} />
            <Metric label="Blocked" value={blockedCount} tone="rose" />
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-white/70 bg-white/85 p-4 shadow-xl shadow-slate-200/70 backdrop-blur">
        <div className="grid gap-3 lg:grid-cols-[1fr_180px_180px_160px_auto]">
          <input
            value={newTitle}
            onChange={(event) => setNewTitle(event.target.value)}
            placeholder="Create a work item for today's standup..."
            className="h-12 rounded-2xl border border-slate-200 px-4 text-sm font-medium outline-none focus:ring-4 focus:ring-blue-100"
          />
          <select value={newItemAreaId} onChange={(event) => setNewItemAreaId(event.target.value)} className="h-12 rounded-2xl border border-slate-200 px-4 text-sm font-medium outline-none focus:ring-4 focus:ring-blue-100">
            {areas.map((area) => <option key={area.id} value={area.id}>{area.name}</option>)}
          </select>
          <select value={newAssignee} onChange={(event) => setNewAssignee(event.target.value)} className="h-12 rounded-2xl border border-slate-200 px-4 text-sm font-medium outline-none focus:ring-4 focus:ring-blue-100">
            <option value="">Unassigned</option>
            {people.map((person) => <option key={person.id} value={person.id}>{person.name}</option>)}
          </select>
          <input type="date" value={newEta} onChange={(event) => setNewEta(event.target.value)} className="h-12 rounded-2xl border border-slate-200 px-4 text-sm font-medium outline-none focus:ring-4 focus:ring-blue-100" />
          <button onClick={addItem} disabled={isPending} className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-blue-600 px-5 text-sm font-bold text-white shadow-lg shadow-blue-200 hover:bg-blue-700 disabled:opacity-60">
            <Plus size={18} /> Add
          </button>
        </div>
      </section>

      <FilterSortBar
        people={people}
        status={status}
        assignedPersonId={assignedPersonId}
        sort={sort}
        onStatusChange={setStatus}
        onAssigneeChange={setAssignedPersonId}
        onSortChange={setSort}
      />

      {flatMode ? (
        <section className="rounded-[2rem] border border-white/70 bg-white/75 p-4 shadow-xl shadow-slate-200/60 backdrop-blur">
          <ListHeader showArea />
          <div className="space-y-3">
            {filteredItems.map((item) => (
              <WorkItemRow key={item.id} item={item} people={people} areas={areas} showArea onUpdate={updateItem} onDelete={deleteItem} onComment={addComment} />
            ))}
            {filteredItems.length === 0 ? <EmptyState /> : null}
          </div>
        </section>
      ) : (
        <section className="space-y-5">
          {grouped.map((area) => (
            <div key={area.id} className="rounded-[2rem] border border-white/70 bg-white/75 p-4 shadow-xl shadow-slate-200/60 backdrop-blur">
              <div className="mb-4 flex items-start justify-between gap-4 px-1">
                <div>
                  <h2 className="text-xl font-black tracking-tight text-slate-950">{area.name}</h2>
                  {area.description ? <p className="mt-1 text-sm leading-6 text-slate-500">{area.description}</p> : null}
                </div>
                <span className="rounded-full bg-slate-950 px-3 py-1 text-xs font-bold text-white">
                  {area.workItems.length}
                </span>
              </div>
              <ListHeader />
              <div className="space-y-3">
                {area.workItems.map((item) => (
                  <WorkItemRow key={item.id} item={item} people={people} areas={areas} onUpdate={updateItem} onDelete={deleteItem} onComment={addComment} />
                ))}
                {area.workItems.length === 0 ? <EmptyState /> : null}
              </div>
            </div>
          ))}
        </section>
      )}
    </div>
  );
}

function ListHeader({ showArea }: { showArea?: boolean }) {
  return (
    <div className="mb-2 hidden grid-cols-[minmax(280px,1fr)_132px_170px_150px_150px_120px] gap-3 px-4 text-xs font-black uppercase tracking-[0.18em] text-slate-400 lg:grid">
      <span>Work item{showArea ? " / Area" : ""}</span>
      <span>Status</span>
      <span>Assignment</span>
      <span>ETA</span>
      <span>Area</span>
      <span className="text-right">Actions</span>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50/70 p-8 text-center text-sm font-medium text-slate-400">
      No matching work items.
    </div>
  );
}

function Metric({ label, value, tone = "blue" }: { label: string; value: number; tone?: "blue" | "rose" }) {
  return (
    <div className="min-w-24 rounded-3xl bg-white/10 p-4 ring-1 ring-white/15">
      <div className={`text-3xl font-black ${tone === "rose" ? "text-rose-200" : "text-blue-200"}`}>{value}</div>
      <div className="mt-1 text-xs font-bold uppercase tracking-[0.2em] text-slate-400">{label}</div>
    </div>
  );
}
