import { NextResponse } from "next/server";
import { getClientIp, logActivity } from "@/lib/activity";
import { db } from "@/lib/db";
import { parseEta, statuses, workItemSchema } from "@/lib/validations";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const assignedPersonId = searchParams.get("assignedPersonId");
  const sort = searchParams.get("sort") ?? "area";

  const items = await db.workItem.findMany({
    where: {
      ...(status && statuses.includes(status as (typeof statuses)[number])
        ? { status: status as (typeof statuses)[number] }
        : {}),
      ...(assignedPersonId ? { assignedPersonId } : {}),
    },
    include: {
      assignedPerson: true,
      workArea: true,
      comments: { orderBy: { createdAt: "desc" } },
    },
    orderBy:
      sort === "assignment"
        ? [{ assignedPerson: { name: "asc" } }, { eta: "asc" }, { updatedAt: "desc" }]
        : sort === "eta-desc"
          ? [{ eta: "desc" }, { updatedAt: "desc" }]
          : sort === "eta-asc"
            ? [{ eta: "asc" }, { updatedAt: "desc" }]
            : sort === "status"
              ? [{ status: "asc" }, { eta: "asc" }]
              : [
                  { workArea: { sortOrder: "asc" } },
                  { eta: "asc" },
                  { updatedAt: "desc" },
                ],
  });

  return NextResponse.json(items);
}

export async function POST(request: Request) {
  const data = workItemSchema.parse(await request.json());
  const item = await db.workItem.create({
    data: {
      title: data.title,
      description: data.description || null,
      status: data.status ?? "todo",
      eta: parseEta(data.eta),
      workAreaId: data.workAreaId,
      assignedPersonId: data.assignedPersonId || null,
    },
    include: { assignedPerson: true, workArea: true, comments: true },
  });

  await logActivity({
    entityType: "work_item",
    entityId: item.id,
    entityLabel: item.title,
    action: "created",
    newValue: item.title,
    ipAddress: getClientIp(request),
  });

  return NextResponse.json(item, { status: 201 });
}
