"use client";

import { useState, useTransition } from "react";
import type { WorkArea } from "@/generated/prisma/client";
import { Layers3, Plus, Trash2 } from "lucide-react";

type AreaWithCount = WorkArea & { _count: { workItems: number } };

export function WorkAreaManager({ initialAreas }: { initialAreas: AreaWithCount[] }) {
  const [areas, setAreas] = useState(initialAreas);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isPending, startTransition] = useTransition();

  async function refresh() {
    const response = await fetch("/api/work-areas");
    setAreas(await response.json());
  }

  async function addArea() {
    if (!name.trim()) return;
    startTransition(async () => {
      await fetch("/api/work-areas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, description }),
      });
      setName("");
      setDescription("");
      await refresh();
    });
  }

  async function updateArea(id: string, data: Partial<WorkArea>) {
    startTransition(async () => {
      await fetch(`/api/work-areas/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      await refresh();
    });
  }

  async function deleteArea(id: string) {
    startTransition(async () => {
      await fetch(`/api/work-areas/${id}`, { method: "DELETE" });
      await refresh();
    });
  }

  return (
    <div className="space-y-6">
      <section className="rounded-[2rem] bg-slate-950 p-8 text-white shadow-2xl shadow-slate-300/70">
        <p className="text-sm font-bold uppercase tracking-[0.3em] text-blue-200">Work areas</p>
        <h1 className="mt-3 text-4xl font-black tracking-tight">Shape the board around real workstreams</h1>
        <p className="mt-3 max-w-2xl text-slate-300">Areas define the default grouped standup view.</p>
      </section>

      <section className="rounded-3xl border border-white/70 bg-white/85 p-4 shadow-xl shadow-slate-200/70 backdrop-blur">
        <div className="grid gap-3 lg:grid-cols-[1fr_2fr_auto]">
          <input value={name} onChange={(event) => setName(event.target.value)} placeholder="Area name..." className="h-12 rounded-2xl border border-slate-200 px-4 font-medium outline-none focus:ring-4 focus:ring-blue-100" />
          <input value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Short description..." className="h-12 rounded-2xl border border-slate-200 px-4 font-medium outline-none focus:ring-4 focus:ring-blue-100" />
          <button onClick={addArea} disabled={isPending} className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-blue-600 px-5 text-sm font-bold text-white shadow-lg shadow-blue-200 hover:bg-blue-700">
            <Plus size={18} /> Add area
          </button>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {areas.map((area) => (
          <div key={area.id} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                <Layers3 size={20} />
              </div>
              <div className="min-w-0 flex-1">
                <input defaultValue={area.name} onBlur={(event) => event.target.value.trim() && updateArea(area.id, { name: event.target.value })} className="w-full rounded-xl border border-transparent px-2 py-1 text-lg font-bold outline-none hover:border-slate-200 focus:border-slate-300" />
              </div>
            </div>
            <textarea defaultValue={area.description ?? ""} onBlur={(event) => updateArea(area.id, { description: event.target.value })} placeholder="Description" className="min-h-20 w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-4 focus:ring-blue-100" />
            <div className="mt-4 flex items-center justify-between">
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
                {area._count.workItems} items
              </span>
              <button disabled={area._count.workItems > 0} onClick={() => deleteArea(area.id)} className="rounded-full p-2 text-rose-500 hover:bg-rose-50 disabled:cursor-not-allowed disabled:text-slate-300">
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}
