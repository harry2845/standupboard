import { NextResponse } from "next/server";
import { getClientIp, logActivity, logChangedFields } from "@/lib/activity";
import { db } from "@/lib/db";
import { personSchema } from "@/lib/validations";

type Params = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: Request, { params }: Params) {
  const { id } = await params;
  const data = personSchema.partial().parse(await request.json());
  const before = await db.person.findUnique({ where: { id } });

  if (!before) {
    return NextResponse.json({ message: "Person not found." }, { status: 404 });
  }

  const person = await db.person.update({
    where: { id },
    data,
  });

  await logChangedFields({
    entityType: "person",
    entityId: person.id,
    entityLabel: person.name,
    ipAddress: getClientIp(request),
    fields: [
      ...(data.name !== undefined
        ? [{ fieldName: "name", oldValue: before.name, newValue: person.name }]
        : []),
      ...(data.active !== undefined
        ? [{ fieldName: "active", oldValue: before.active, newValue: person.active }]
        : []),
    ],
  });

  return NextResponse.json(person);
}

export async function DELETE(request: Request, { params }: Params) {
  const { id } = await params;
  const before = await db.person.findUnique({ where: { id } });

  if (!before) {
    return NextResponse.json({ message: "Person not found." }, { status: 404 });
  }

  const person = await db.person.update({
    where: { id },
    data: { active: false },
  });

  await logActivity({
    entityType: "person",
    entityId: person.id,
    entityLabel: person.name,
    action: "updated",
    fieldName: "active",
    oldValue: before.active,
    newValue: person.active,
    ipAddress: getClientIp(request),
  });

  return NextResponse.json(person);
}
