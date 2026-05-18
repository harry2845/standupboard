import { NextResponse } from "next/server";
import { getClientIp, logActivity } from "@/lib/activity";
import { db } from "@/lib/db";
import { personSchema } from "@/lib/validations";

export async function GET() {
  const people = await db.person.findMany({
    orderBy: [{ active: "desc" }, { name: "asc" }],
  });
  return NextResponse.json(people);
}

export async function POST(request: Request) {
  const data = personSchema.parse(await request.json());
  const person = await db.person.create({ data });

  await logActivity({
    entityType: "person",
    entityId: person.id,
    entityLabel: person.name,
    action: "created",
    newValue: person.name,
    ipAddress: getClientIp(request),
  });

  return NextResponse.json(person, { status: 201 });
}
