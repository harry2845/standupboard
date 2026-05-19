import { NextResponse } from "next/server";
import { getClientIp, logActivity } from "@/lib/activity";
import { db } from "@/lib/db";
import { requireApiUser } from "@/lib/auth";
import { workAreaSchema } from "@/lib/validations";

export async function GET() {
  await requireApiUser();
  const areas = await db.workArea.findMany({
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    include: { _count: { select: { workItems: true } } },
  });
  return NextResponse.json(areas);
}

export async function POST(request: Request) {
  const user = await requireApiUser();
  const data = workAreaSchema.parse(await request.json());
  const max = await db.workArea.aggregate({ _max: { sortOrder: true } });
  const area = await db.workArea.create({
    data: {
      ...data,
      description: data.description || null,
      sortOrder: data.sortOrder ?? (max._max.sortOrder ?? 0) + 1,
    },
  });

  await logActivity({
    entityType: "work_area",
    entityId: area.id,
    entityLabel: area.name,
    action: "created",
    newValue: area.name,
    ipAddress: getClientIp(request),
    actorUserId: user.id,
    actorUsername: user.username,
  });

  return NextResponse.json(area, { status: 201 });
}
