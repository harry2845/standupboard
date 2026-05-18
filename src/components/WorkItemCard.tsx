"use client";

import { useState } from "react";
import type { Person, Status, WorkArea } from "@/generated/prisma/client";
import type { WorkItemWithRelations } from "@/lib/types";
import { relativeDay, shortDate, toDateInput } from "@/lib/format";
import { statusLabels, statusStyles } from "./StatusBadge";
import { CalendarDays, MessageSquare, Pencil, Save, Trash2, UserRound, X } from "lucide-react";

export function WorkItemCard({
  item,
  people,
  areas,
  showArea,
  onUpdate,
  onDelete,
  onComment,
}: {
  item: WorkItemWithRelations;
  people: Person[];
  areas: WorkArea[];
  showArea?: boolean;
  onUpdate: (id: string, data: Record<string, unknown>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onComment: (id: string, data: { body: string; authorName?: string }) => Promise<void>;
}) {
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(item.title);
  const [description, setDescription] = useState(item.description ?? "");
  const [comment, setComment] = useState("");
  const [authorName, setAuthorName] = useState("");

  async function saveDetails() {
    await onUpdate(item.id, { title, description });
    setEditing(false);
  }

  async function addComment() {
    if (!comment.trim()) return;
    await onComment(item.id, { body: comment, authorName });
    setComment("");
  }

  return (
    <article className="group rounded-3xl border border-slate-200/80 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-xl hover:shadow-slate-200/70">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          {editing ? (
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-base font-semibold outline-none focus:ring-4 focus:ring-blue-100"
            />
          ) : (
            <h3 className="line-clamp-2 text-base font-bold tracking-tight text-slate-950">
              {item.title}
            </h3>
          )}
          {showArea ? (
            <p className="mt-1 text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
              {item.workArea.name}
            </p>
          ) : null}
        </div>
        <select
          aria-label="Update status"
          value={item.status}
          onChange={(event) => onUpdate(item.id, { status: event.target.value as Status })}
          className={`shrink-0 cursor-pointer appearance-none rounded-full px-3 py-1 text-xs font-semibold outline-none ring-1 transition hover:brightness-95 focus:ring-4 focus:ring-blue-100 ${statusStyles[item.status]}`}
        >
          {Object.entries(statusLabels).map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
      </div>

      {editing ? (
        <textarea
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          placeholder="Add details, blockers, or context..."
          className="mt-3 min-h-24 w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-4 focus:ring-blue-100"
        />
      ) : item.description ? (
        <p className="mt-3 line-clamp-3 text-sm leading-6 text-slate-600">{item.description}</p>
      ) : null}

      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        <label className="flex items-center gap-2 rounded-2xl bg-slate-50 px-3 py-2 text-sm">
          <span className="text-slate-400"><UserRound size={16} /></span>
          <select
            value={item.assignedPersonId ?? ""}
            onChange={(event) => onUpdate(item.id, { assignedPersonId: event.target.value || null })}
            className="min-w-0 flex-1 bg-transparent font-medium outline-none"
          >
            <option value="">Unassigned</option>
            {people.map((person) => (
              <option key={person.id} value={person.id}>
                {person.name}
              </option>
            ))}
          </select>
        </label>
        <label className="flex items-center gap-2 rounded-2xl bg-slate-50 px-3 py-2 text-sm">
          <span className="text-slate-400"><CalendarDays size={16} /></span>
          <input
            type="date"
            value={toDateInput(item.eta)}
            onChange={(event) => onUpdate(item.id, { eta: event.target.value || null })}
            className="min-w-0 flex-1 bg-transparent font-medium outline-none"
          />
        </label>
        <select
          value={item.workAreaId}
          onChange={(event) => onUpdate(item.id, { workAreaId: event.target.value })}
          className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold outline-none focus:ring-4 focus:ring-blue-100"
        >
          {areas.map((area) => (
            <option key={area.id} value={area.id}>{area.name}</option>
          ))}
        </select>
      </div>

      <div className="mt-4 flex items-center justify-between rounded-2xl bg-slate-950 px-3 py-2 text-xs font-semibold text-white">
        <span>{shortDate(item.eta)}</span>
        <span className={relativeDay(item.eta).includes("overdue") ? "text-rose-300" : "text-slate-300"}>
          {relativeDay(item.eta)}
        </span>
      </div>

      <div className="mt-4 space-y-2">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-slate-400">
          <MessageSquare size={14} /> Comments {item.comments.length}
        </div>
        {item.comments.slice(0, 2).map((entry) => (
          <div key={entry.id} className="rounded-2xl bg-slate-50 px-3 py-2 text-sm text-slate-700">
            <p>{entry.body}</p>
            <p className="mt-1 text-xs text-slate-400">
              {entry.authorName || "Anonymous"} · {new Date(entry.createdAt).toLocaleString()}
            </p>
          </div>
        ))}
        <div className="grid gap-2">
          <input
            value={comment}
            onChange={(event) => setComment(event.target.value)}
            placeholder="Add a quick comment..."
            className="rounded-2xl border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-4 focus:ring-blue-100"
          />
          <div className="flex gap-2">
            <input
              value={authorName}
              onChange={(event) => setAuthorName(event.target.value)}
              placeholder="Name optional"
              className="min-w-0 flex-1 rounded-2xl border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-4 focus:ring-blue-100"
            />
            <button
              onClick={addComment}
              className="rounded-2xl bg-slate-950 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
            >
              Add
            </button>
          </div>
        </div>
      </div>

      <div className="mt-4 flex justify-end gap-2 border-t border-slate-100 pt-3">
        {editing ? (
          <>
            <button onClick={() => setEditing(false)} className="rounded-full p-2 text-slate-500 hover:bg-slate-100">
              <X size={16} />
            </button>
            <button onClick={saveDetails} className="rounded-full p-2 text-emerald-600 hover:bg-emerald-50">
              <Save size={16} />
            </button>
          </>
        ) : (
          <button onClick={() => setEditing(true)} className="rounded-full p-2 text-slate-500 hover:bg-slate-100">
            <Pencil size={16} />
          </button>
        )}
        <button onClick={() => onDelete(item.id)} className="rounded-full p-2 text-rose-500 hover:bg-rose-50">
          <Trash2 size={16} />
        </button>
      </div>
    </article>
  );
}
