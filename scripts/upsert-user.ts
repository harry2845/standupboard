import bcrypt from "bcryptjs";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "../src/generated/prisma/client";

function valueFor(flag: string) {
  const index = process.argv.indexOf(flag);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

function normalizeUsername(username: string) {
  return username.trim().toLowerCase();
}

async function main() {
  const username = valueFor("--username") ?? process.env.STANDUP_USER_USERNAME;
  const password = valueFor("--password") ?? process.env.STANDUP_USER_PASSWORD;
  const displayName = valueFor("--display-name") ?? process.env.STANDUP_USER_DISPLAY_NAME ?? username;

  if (!username || !password) {
    throw new Error("Usage: npm run user:upsert -- --username alice --password 'new-password' --display-name 'Alice'");
  }

  const adapter = new PrismaBetterSqlite3({ url: process.env.DATABASE_URL ?? "file:./dev.db" });
  const prisma = new PrismaClient({ adapter });

  try {
    const user = await prisma.user.upsert({
      where: { username: normalizeUsername(username) },
      update: {
        displayName,
        passwordHash: await bcrypt.hash(password, 12),
        active: true,
      },
      create: {
        username: normalizeUsername(username),
        displayName,
        passwordHash: await bcrypt.hash(password, 12),
      },
    });

    console.log(`Upserted user: ${user.username}`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
