import type { Status } from "@/generated/prisma/client";

const statusStyles: Record<Status, string> = {
  todo: "bg-slate-100 text-slate-700 ring-slate-200",
  in_progress: "bg-blue-100 text-blue-700 ring-blue-200",
  blocked: "bg-rose-100 text-rose-700 ring-rose-200",
  done: "bg-emerald-100 text-emerald-700 ring-emerald-200",
};

const statusLabels: Record<Status, string> = {
  todo: "To do",
  in_progress: "In progress",
  blocked: "Blocked",
  done: "Done",
};

export function StatusBadge({ status }: { status: Status }) {
  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${statusStyles[status]}`}>
      {statusLabels[status]}
    </span>
  );
}

export { statusLabels, statusStyles };
