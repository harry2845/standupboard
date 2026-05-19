import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { requireApiUser } from "@/lib/auth";
import { previewDatabaseImport } from "@/lib/database-transfer";

export async function POST(request: Request) {
  await requireApiUser();

  try {
    const summary = previewDatabaseImport(await request.json());
    return NextResponse.json({ summary });
  } catch (error) {
    const message = error instanceof ZodError ? "Invalid export file." : error instanceof Error ? error.message : "Invalid export file.";
    return NextResponse.json({ message }, { status: 400 });
  }
}
