import { AppShell } from "@/components/AppShell";
import { WorkAreaBoard } from "@/components/WorkAreaBoard";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function Home() {
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
    <AppShell>
      <WorkAreaBoard initialData={{ people, areas, items }} />
    </AppShell>
  );
}
