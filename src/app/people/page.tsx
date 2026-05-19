import { AppShell } from "@/components/AppShell";
import { PeopleManager } from "@/components/PeopleManager";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function PeoplePage() {
  const user = await requireUser();
  const people = await db.person.findMany({
    orderBy: [{ active: "desc" }, { name: "asc" }],
  });

  return (
    <AppShell user={user}>
      <PeopleManager initialPeople={people} />
    </AppShell>
  );
}
