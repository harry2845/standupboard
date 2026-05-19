import { NextResponse } from "next/server";
import { getClientIp, logActivity } from "@/lib/activity";
import { db } from "@/lib/db";
import { requireApiUser } from "@/lib/auth";
import { personSchema } from "@/lib/validations";

export async function GET() {
  await requireApiUser();
  const people = await db.person.findMany({
    orderBy: [{ active: "desc" }, { name: "asc" }],
  });
  return NextResponse.json(people);
}

export async function POST(request: Request) {
  const user = await requireApiUser();
  const data = personSchema.parse(await request.json());
  const person = await db.person.create({ data });

  await logActivity({
    entityType: "person",
    entityId: person.id,
    entityLabel: person.name,
    action: "created",
    newValue: person.name,
    ipAddress: getClientIp(request),
    actorUserId: user.id,
    actorUsername: user.username,
  });

  return NextResponse.json(person, { status: 201 });
}
