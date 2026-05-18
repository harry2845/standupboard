import { AppShell } from "@/components/AppShell";
import { PeopleManager } from "@/components/PeopleManager";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function PeoplePage() {
  const people = await db.person.findMany({
    orderBy: [{ active: "desc" }, { name: "asc" }],
  });

  return (
    <AppShell>
      <PeopleManager initialPeople={people} />
    </AppShell>
  );
}
