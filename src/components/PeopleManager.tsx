"use client";

import { useState, useTransition } from "react";
import type { Person } from "@/generated/prisma/client";
import { Plus, RotateCcw, UserRound, X } from "lucide-react";

export function PeopleManager({ initialPeople }: { initialPeople: Person[] }) {
  const [people, setPeople] = useState(initialPeople);
  const [name, setName] = useState("");
  const [isPending, startTransition] = useTransition();

  async function refresh() {
    const response = await fetch("/api/people");
    setPeople(await response.json());
  }

  async function addPerson() {
    if (!name.trim()) return;
    startTransition(async () => {
      await fetch("/api/people", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      setName("");
      await refresh();
    });
  }

  async function updatePerson(id: string, data: Partial<Person>) {
    startTransition(async () => {
      await fetch(`/api/people/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      await refresh();
    });
  }

  async function deactivate(id: string) {
    startTransition(async () => {
      await fetch(`/api/people/${id}`, { method: "DELETE" });
      await refresh();
    });
  }

  return (
    <div className="space-y-6">
      <section className="rounded-[2rem] bg-slate-950 p-8 text-white shadow-2xl shadow-slate-300/70">
        <p className="text-sm font-bold uppercase tracking-[0.3em] text-blue-200">People</p>
        <h1 className="mt-3 text-4xl font-black tracking-tight">Manage standup owners</h1>
        <p className="mt-3 max-w-2xl text-slate-300">Keep assignments clean while preserving history for old work items.</p>
      </section>

      <section className="rounded-3xl border border-white/70 bg-white/85 p-4 shadow-xl shadow-slate-200/70 backdrop-blur">
        <div className="flex gap-3">
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Add a person..."
            className="h-12 min-w-0 flex-1 rounded-2xl border border-slate-200 px-4 font-medium outline-none focus:ring-4 focus:ring-blue-100"
          />
          <button onClick={addPerson} disabled={isPending} className="inline-flex h-12 items-center gap-2 rounded-2xl bg-blue-600 px-5 text-sm font-bold text-white shadow-lg shadow-blue-200 hover:bg-blue-700">
            <Plus size={18} /> Add
          </button>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {people.map((person) => (
          <div key={person.id} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-600">
                <UserRound size={20} />
              </div>
              <input
                defaultValue={person.name}
                onBlur={(event) => {
                  if (event.target.value.trim() && event.target.value !== person.name) {
                    updatePerson(person.id, { name: event.target.value });
                  }
                }}
                className="min-w-0 flex-1 rounded-xl border border-transparent px-2 py-1 text-lg font-bold outline-none hover:border-slate-200 focus:border-slate-300"
              />
            </div>
            <div className="mt-4 flex items-center justify-between">
              <span className={`rounded-full px-3 py-1 text-xs font-bold ${person.active ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
                {person.active ? "Active" : "Inactive"}
              </span>
              {person.active ? (
                <button onClick={() => deactivate(person.id)} className="rounded-full p-2 text-rose-500 hover:bg-rose-50"><X size={16} /></button>
              ) : (
                <button onClick={() => updatePerson(person.id, { active: true })} className="rounded-full p-2 text-emerald-600 hover:bg-emerald-50"><RotateCcw size={16} /></button>
              )}
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}
