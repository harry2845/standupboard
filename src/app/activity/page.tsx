import { ActivityFeed } from "@/components/ActivityFeed";
import { AppShell } from "@/components/AppShell";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function ActivityPage() {
  const logs = await db.activityLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  return (
    <AppShell>
      <ActivityFeed initialLogs={logs} />
    </AppShell>
  );
}
