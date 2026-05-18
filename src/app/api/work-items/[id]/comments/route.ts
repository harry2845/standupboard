import { NextResponse } from "next/server";
import { getClientIp, logActivity } from "@/lib/activity";
import { db } from "@/lib/db";
import { commentSchema } from "@/lib/validations";

type Params = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, { params }: Params) {
  const { id } = await params;
  const comments = await db.comment.findMany({
    where: { workItemId: id },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(comments);
}

export async function POST(request: Request, { params }: Params) {
  const { id } = await params;
  const data = commentSchema.parse(await request.json());
  const item = await db.workItem.findUnique({ where: { id } });

  if (!item) {
    return NextResponse.json({ message: "Work item not found." }, { status: 404 });
  }

  const comment = await db.comment.create({
    data: {
      body: data.body,
      authorName: data.authorName || null,
      workItemId: id,
    },
  });

  await logActivity({
    entityType: "comment",
    entityId: comment.id,
    entityLabel: item.title,
    action: "created",
    fieldName: "comment",
    newValue: comment.body,
    ipAddress: getClientIp(request),
  });

  return NextResponse.json(comment, { status: 201 });
}
