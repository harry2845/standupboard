import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { requireApiUser } from "@/lib/auth";
import { IMPORT_CONFIRMATION, replaceDatabaseFromExport } from "@/lib/database-transfer";

export async function POST(request: Request) {
  const user = await requireApiUser();
  const body = await request.json();

  if (body?.confirm !== IMPORT_CONFIRMATION) {
    return NextResponse.json({ message: `Type ${IMPORT_CONFIRMATION} to confirm import.` }, { status: 400 });
  }

  try {
    const summary = await replaceDatabaseFromExport(body?.payload, user, request);
    return NextResponse.json({ summary });
  } catch (error) {
    const message = error instanceof ZodError ? "Invalid export file." : error instanceof Error ? error.message : "Could not import database.";
    return NextResponse.json({ message }, { status: 400 });
  }
}
