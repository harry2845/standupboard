import { NextResponse } from "next/server";
import { getClientIp, logActivity, logChangedFields } from "@/lib/activity";
import { db } from "@/lib/db";
import { requireApiUser } from "@/lib/auth";
import { parseEta, workItemPatchSchema } from "@/lib/validations";

type Params = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: Request, { params }: Params) {
  const user = await requireApiUser();
  const { id } = await params;
  const data = workItemPatchSchema.parse(await request.json());
  const before = await db.workItem.findUnique({
    where: { id },
    include: { assignedPerson: true, workArea: true },
  });

  if (!before) {
    return NextResponse.json({ message: "Work item not found." }, { status: 404 });
  }

  const item = await db.workItem.update({
    where: { id },
    data: {
      ...(data.title !== undefined ? { title: data.title } : {}),
      ...(data.description !== undefined
        ? { description: data.description || null }
        : {}),
      ...(data.status !== undefined ? { status: data.status } : {}),
      ...(data.eta !== undefined ? { eta: parseEta(data.eta) } : {}),
      ...(data.workAreaId !== undefined ? { workAreaId: data.workAreaId } : {}),
      ...(data.assignedPersonId !== undefined
        ? { assignedPersonId: data.assignedPersonId || null }
        : {}),
    },
    include: { assignedPerson: true, workArea: true, comments: true },
  });

  await logChangedFields({
    entityType: "work_item",
    entityId: item.id,
    entityLabel: item.title,
    ipAddress: getClientIp(request),
    actorUserId: user.id,
    actorUsername: user.username,
    fields: [
      ...(data.title !== undefined
        ? [{ fieldName: "title", oldValue: before.title, newValue: item.title }]
        : []),
      ...(data.description !== undefined
        ? [{ fieldName: "description", oldValue: before.description, newValue: item.description }]
        : []),
      ...(data.status !== undefined
        ? [{ fieldName: "status", oldValue: before.status, newValue: item.status }]
        : []),
      ...(data.eta !== undefined
        ? [{ fieldName: "eta", oldValue: before.eta, newValue: item.eta }]
        : []),
      ...(data.workAreaId !== undefined
        ? [{ fieldName: "area", oldValue: before.workArea.name, newValue: item.workArea.name }]
        : []),
      ...(data.assignedPersonId !== undefined
        ? [
            {
              fieldName: "assignment",
              oldValue: before.assignedPerson?.name ?? null,
              newValue: item.assignedPerson?.name ?? null,
            },
          ]
        : []),
    ],
  });

  return NextResponse.json(item);
}

export async function DELETE(request: Request, { params }: Params) {
  const user = await requireApiUser();
  const { id } = await params;
  const item = await db.workItem.findUnique({ where: { id } });

  if (!item) {
    return NextResponse.json({ message: "Work item not found." }, { status: 404 });
  }

  await db.workItem.delete({ where: { id } });
  await logActivity({
    entityType: "work_item",
    entityId: item.id,
    entityLabel: item.title,
    action: "deleted",
    oldValue: item.title,
    ipAddress: getClientIp(request),
    actorUserId: user.id,
    actorUsername: user.username,
  });

  return NextResponse.json({ ok: true });
}
