import { NextResponse } from "next/server";
import { getClientIp, logActivity, logChangedFields } from "@/lib/activity";
import { db } from "@/lib/db";
import { workAreaSchema } from "@/lib/validations";

type Params = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: Request, { params }: Params) {
  const { id } = await params;
  const data = workAreaSchema.partial().parse(await request.json());
  const before = await db.workArea.findUnique({ where: { id } });

  if (!before) {
    return NextResponse.json({ message: "Work area not found." }, { status: 404 });
  }

  const area = await db.workArea.update({
    where: { id },
    data: {
      ...data,
      description: data.description || null,
    },
  });

  await logChangedFields({
    entityType: "work_area",
    entityId: area.id,
    entityLabel: area.name,
    ipAddress: getClientIp(request),
    fields: [
      ...(data.name !== undefined
        ? [{ fieldName: "name", oldValue: before.name, newValue: area.name }]
        : []),
      ...(data.description !== undefined
        ? [{ fieldName: "description", oldValue: before.description, newValue: area.description }]
        : []),
      ...(data.sortOrder !== undefined
        ? [{ fieldName: "sortOrder", oldValue: before.sortOrder, newValue: area.sortOrder }]
        : []),
    ],
  });

  return NextResponse.json(area);
}

export async function DELETE(request: Request, { params }: Params) {
  const { id } = await params;
  const count = await db.workItem.count({ where: { workAreaId: id } });

  if (count > 0) {
    return NextResponse.json(
      { message: "Move or delete work items before deleting this area." },
      { status: 409 },
    );
  }

  const area = await db.workArea.findUnique({ where: { id } });
  if (!area) {
    return NextResponse.json({ message: "Work area not found." }, { status: 404 });
  }

  await db.workArea.delete({ where: { id } });
  await logActivity({
    entityType: "work_area",
    entityId: area.id,
    entityLabel: area.name,
    action: "deleted",
    oldValue: area.name,
    ipAddress: getClientIp(request),
  });

  return NextResponse.json({ ok: true });
}
