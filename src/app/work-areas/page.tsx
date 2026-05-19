import { AppShell } from "@/components/AppShell";
import { WorkAreaManager } from "@/components/WorkAreaManager";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function WorkAreasPage() {
  const user = await requireUser();
  const areas = await db.workArea.findMany({
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    include: { _count: { select: { workItems: true } } },
  });

  return (
    <AppShell user={user}>
      <WorkAreaManager initialAreas={areas} />
    </AppShell>
  );
}
