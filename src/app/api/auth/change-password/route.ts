import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { hashSessionToken, requireApiUser, SESSION_COOKIE } from "@/lib/auth";
import { db } from "@/lib/db";
import { changePasswordSchema } from "@/lib/validations";
import { cookies } from "next/headers";

export async function POST(request: Request) {
  const user = await requireApiUser();
  const data = changePasswordSchema.parse(await request.json());
  const fullUser = await db.user.findUniqueOrThrow({ where: { id: user.id } });

  if (!(await bcrypt.compare(data.currentPassword, fullUser.passwordHash))) {
    return NextResponse.json({ message: "Current password is incorrect." }, { status: 400 });
  }

  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  const tokenHash = token ? hashSessionToken(token) : null;

  await db.$transaction([
    db.user.update({
      where: { id: user.id },
      data: { passwordHash: await bcrypt.hash(data.newPassword, 12) },
    }),
    db.session.deleteMany({
      where: {
        userId: user.id,
        ...(tokenHash ? { tokenHash: { not: tokenHash } } : {}),
      },
    }),
  ]);

  return NextResponse.json({ ok: true });
}
