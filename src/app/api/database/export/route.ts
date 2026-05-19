import { NextResponse } from "next/server";
import { requireApiUser } from "@/lib/auth";
import { buildDatabaseExport } from "@/lib/database-transfer";

export async function GET() {
  await requireApiUser();

  const payload = await buildDatabaseExport();
  const filename = `standup-export-${payload.exportedAt.slice(0, 10)}.json`;

  return NextResponse.json(payload, {
    headers: {
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
