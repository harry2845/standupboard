import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireApiUser } from "@/lib/auth";

export async function GET(request: Request) {
  await requireApiUser();
  const { searchParams } = new URL(request.url);
  const entityType = searchParams.get("entityType");
  const action = searchParams.get("action");
  const limit = Math.min(Number(searchParams.get("limit") ?? 100), 250);

  const logs = await db.activityLog.findMany({
    where: {
      ...(entityType && entityType !== "all" ? { entityType } : {}),
      ...(action && action !== "all" ? { action } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: Number.isFinite(limit) ? limit : 100,
  });

  return NextResponse.json(logs);
}
