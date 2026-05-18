import { AppShell } from "@/components/AppShell";
import { WorkAreaManager } from "@/components/WorkAreaManager";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function WorkAreasPage() {
  const areas = await db.workArea.findMany({
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    include: { _count: { select: { workItems: true } } },
  });

  return (
    <AppShell>
      <WorkAreaManager initialAreas={areas} />
    </AppShell>
  );
}
