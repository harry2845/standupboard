import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { createSession, normalizeUsername, setSessionCookie } from "@/lib/auth";
import { db } from "@/lib/db";
import { loginSchema } from "@/lib/validations";

export async function POST(request: Request) {
  const data = loginSchema.parse(await request.json());
  const username = normalizeUsername(data.username);
  const user = await db.user.findUnique({ where: { username } });

  if (!user || !user.active || !(await bcrypt.compare(data.password, user.passwordHash))) {
    return NextResponse.json({ message: "Invalid username or password." }, { status: 401 });
  }

  const session = await createSession(user.id);
  await setSessionCookie(session.token, session.expiresAt);

  return NextResponse.json({ ok: true });
}
