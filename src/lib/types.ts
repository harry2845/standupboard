import type { Comment, Person, WorkArea, WorkItem } from "@/generated/prisma/client";

export type WorkItemWithRelations = WorkItem & {
  assignedPerson: Person | null;
  workArea: WorkArea;
  comments: Comment[];
};

export type DashboardData = {
  people: Person[];
  areas: (WorkArea & { workItems: WorkItemWithRelations[] })[];
  items: WorkItemWithRelations[];
};
