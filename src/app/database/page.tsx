import { AppShell } from "@/components/AppShell";
import { DatabaseTransferPanel } from "@/components/DatabaseTransferPanel";
import { requireUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function DatabasePage() {
  const user = await requireUser();

  return (
    <AppShell user={user}>
      <DatabaseTransferPanel />
    </AppShell>
  );
}
