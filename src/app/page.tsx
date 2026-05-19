import { AppShell } from "@/components/AppShell";
import { WorkAreaBoard } from "@/components/WorkAreaBoard";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function Home() {
  const user = await requireUser();
  const [people, areas, items] = await Promise.all([
    db.person.findMany({ orderBy: [{ active: "desc" }, { name: "asc" }] }),
    db.workArea.findMany({
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      include: {
        workItems: {
          include: {
            assignedPerson: true,
            workArea: true,
            comments: { orderBy: { createdAt: "desc" } },
          },
          orderBy: [{ eta: "asc" }, { updatedAt: "desc" }],
        },
      },
    }),
    db.workItem.findMany({
      include: {
        assignedPerson: true,
        workArea: true,
        comments: { orderBy: { createdAt: "desc" } },
      },
      orderBy: [{ updatedAt: "desc" }],
    }),
  ]);

  return (
    <AppShell user={user}>
      <WorkAreaBoard initialData={{ people, areas, items }} />
    </AppShell>
  );
}
