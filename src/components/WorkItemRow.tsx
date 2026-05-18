"use client";

import { useState } from "react";
import type { Person, Status, WorkArea } from "@/generated/prisma/client";
import type { WorkItemWithRelations } from "@/lib/types";
import { relativeDay, shortDate, toDateInput } from "@/lib/format";
import { statusLabels, statusStyles } from "./StatusBadge";
import { MessageSquare, Pencil, Save, Trash2, X } from "lucide-react";

export function WorkItemRow({
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
  const [commentOpen, setCommentOpen] = useState(false);
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
    <div className="rounded-3xl border border-slate-200/80 bg-white shadow-sm transition hover:border-slate-300 hover:shadow-lg hover:shadow-slate-200/70">
      <div className="grid gap-3 p-4 lg:grid-cols-[minmax(280px,1fr)_132px_170px_150px_150px_120px] lg:items-center">
        <div className="min-w-0">
          {editing ? (
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm font-semibold outline-none focus:ring-4 focus:ring-blue-100"
            />
          ) : (
            <h3 className="truncate text-sm font-bold tracking-tight text-slate-950">{item.title}</h3>
          )}
          {editing ? (
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Add details, blockers, or context..."
              className="mt-2 min-h-20 w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-4 focus:ring-blue-100"
            />
          ) : (
            <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500">
              {showArea ? <span className="font-semibold text-slate-400">{item.workArea.name}</span> : null}
              {item.description ? <span className="truncate">{item.description}</span> : <span className="text-slate-300">No description</span>}
            </div>
          )}
        </div>

        <select
          aria-label="Update status"
          value={item.status}
          onChange={(event) => onUpdate(item.id, { status: event.target.value as Status })}
          className={`h-10 cursor-pointer appearance-none rounded-full px-3 text-center text-xs font-bold outline-none ring-1 transition hover:brightness-95 focus:ring-4 focus:ring-blue-100 ${statusStyles[item.status]}`}
        >
          {Object.entries(statusLabels).map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>

        <select
          value={item.assignedPersonId ?? ""}
          onChange={(event) => onUpdate(item.id, { assignedPersonId: event.target.value || null })}
          className="h-10 rounded-2xl border border-slate-200 bg-slate-50 px-3 text-sm font-semibold outline-none focus:ring-4 focus:ring-blue-100"
        >
          <option value="">Unassigned</option>
          {people.map((person) => (
            <option key={person.id} value={person.id}>{person.name}</option>
          ))}
        </select>

        <div>
          <input
            type="date"
            value={toDateInput(item.eta)}
            onChange={(event) => onUpdate(item.id, { eta: event.target.value || null })}
            className="h-10 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 text-sm font-semibold outline-none focus:ring-4 focus:ring-blue-100"
          />
          <div className={`mt-1 text-xs font-semibold ${relativeDay(item.eta).includes("overdue") ? "text-rose-500" : "text-slate-400"}`}>
            {shortDate(item.eta)} · {relativeDay(item.eta)}
          </div>
        </div>

        <select
          value={item.workAreaId}
          onChange={(event) => onUpdate(item.id, { workAreaId: event.target.value })}
          className="h-10 rounded-2xl border border-slate-200 bg-slate-50 px-3 text-sm font-semibold outline-none focus:ring-4 focus:ring-blue-100"
        >
          {areas.map((area) => (
            <option key={area.id} value={area.id}>{area.name}</option>
          ))}
        </select>

        <div className="flex items-center justify-end gap-1">
          <button
            onClick={() => setCommentOpen((open) => !open)}
            className="inline-flex items-center gap-1 rounded-full px-3 py-2 text-sm font-semibold text-slate-500 hover:bg-slate-100"
          >
            <MessageSquare size={16} /> {item.comments.length}
          </button>
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
      </div>

      {commentOpen ? (
        <div className="border-t border-slate-100 bg-slate-50/70 p-4">
          <div className="grid gap-2 lg:grid-cols-[1fr_180px_auto]">
            <input
              value={comment}
              onChange={(event) => setComment(event.target.value)}
              placeholder="Add a quick comment..."
              className="h-10 rounded-2xl border border-slate-200 bg-white px-3 text-sm outline-none focus:ring-4 focus:ring-blue-100"
            />
            <input
              value={authorName}
              onChange={(event) => setAuthorName(event.target.value)}
              placeholder="Name optional"
              className="h-10 rounded-2xl border border-slate-200 bg-white px-3 text-sm outline-none focus:ring-4 focus:ring-blue-100"
            />
            <button onClick={addComment} className="h-10 rounded-2xl bg-slate-950 px-4 text-sm font-semibold text-white hover:bg-slate-800">
              Add comment
            </button>
          </div>
          {item.comments.length ? (
            <div className="mt-3 space-y-2">
              {item.comments.slice(0, 3).map((entry) => (
                <div key={entry.id} className="rounded-2xl bg-white px-3 py-2 text-sm text-slate-700 ring-1 ring-slate-100">
                  <p>{entry.body}</p>
                  <p className="mt-1 text-xs text-slate-400">
                    {entry.authorName || "Anonymous"} · {new Date(entry.createdAt).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
