import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "../src/generated/prisma/client";

const adapter = new PrismaBetterSqlite3({ url: process.env.DATABASE_URL ?? "file:./dev.db" });
const prisma = new PrismaClient({ adapter });

async function main() {
  const peopleCount = await prisma.person.count();
  if (peopleCount > 0) return;

  const [alex, sam, riley] = await Promise.all([
    prisma.person.create({ data: { name: "Alex Chen" } }),
    prisma.person.create({ data: { name: "Sam Rivera" } }),
    prisma.person.create({ data: { name: "Riley Park" } }),
  ]);

  const [platform, product, ops] = await Promise.all([
    prisma.workArea.create({
      data: { name: "Platform", description: "Infra, tooling, and shared services", sortOrder: 1 },
    }),
    prisma.workArea.create({
      data: { name: "Product", description: "User-facing product work", sortOrder: 2 },
    }),
    prisma.workArea.create({
      data: { name: "Operations", description: "Launch readiness and follow-ups", sortOrder: 3 },
    }),
  ]);

  await prisma.workItem.create({
    data: {
      title: "Finalize standup board workflow",
      description: "Confirm filters, editing flow, and ownership for daily standup.",
      status: "in_progress",
      eta: new Date(),
      workAreaId: product.id,
      assignedPersonId: alex.id,
      comments: { create: { body: "Keep the main board optimized for quick updates." } },
    },
  });

  await prisma.workItem.create({
    data: {
      title: "Open intranet access on host machine",
      status: "todo",
      eta: new Date(Date.now() + 86400000),
      workAreaId: platform.id,
      assignedPersonId: sam.id,
    },
  });

  await prisma.workItem.create({
    data: {
      title: "Collect first-week feedback",
      status: "blocked",
      eta: new Date(Date.now() + 3 * 86400000),
      workAreaId: ops.id,
      assignedPersonId: riley.id,
    },
  });
}

main()
  .then(async () => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
