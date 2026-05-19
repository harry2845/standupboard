import "server-only";

import { z } from "zod";
import { type AuthUser } from "@/lib/auth";
import { getClientIp } from "@/lib/activity";
import { db } from "@/lib/db";

const EXPORT_FORMAT = "standup-db-export";
const EXPORT_VERSION = 1;
export const IMPORT_CONFIRMATION = "IMPORT AND REPLACE";

const dateString = z.string().datetime();
const nullableDateString = dateString.nullable();
const statusSchema = z.enum(["todo", "in_progress", "blocked", "done"]);

const personExportSchema = z.object({
  id: z.string().min(1),
  name: z.string(),
  active: z.boolean(),
  createdAt: dateString,
  updatedAt: dateString,
});

const workAreaExportSchema = z.object({
  id: z.string().min(1),
  name: z.string(),
  description: z.string().nullable(),
  sortOrder: z.number().int(),
  createdAt: dateString,
  updatedAt: dateString,
});

const workItemExportSchema = z.object({
  id: z.string().min(1),
  title: z.string(),
  description: z.string().nullable(),
  status: statusSchema,
  eta: nullableDateString,
  createdAt: dateString,
  updatedAt: dateString,
  workAreaId: z.string().min(1),
  assignedPersonId: z.string().nullable(),
});

const commentExportSchema = z.object({
  id: z.string().min(1),
  body: z.string(),
  authorName: z.string().nullable(),
  createdAt: dateString,
  workItemId: z.string().min(1),
});

const activityLogExportSchema = z.object({
  id: z.string().min(1),
  entityType: z.string(),
  entityId: z.string(),
  entityLabel: z.string(),
  action: z.string(),
  fieldName: z.string().nullable(),
  oldValue: z.string().nullable(),
  newValue: z.string().nullable(),
  ipAddress: z.string(),
  actorUsername: z.string().nullable(),
  createdAt: dateString,
});

const databaseExportSchema = z.object({
  format: z.literal(EXPORT_FORMAT),
  version: z.literal(EXPORT_VERSION),
  exportedAt: dateString,
  data: z.object({
    people: z.array(personExportSchema),
    workAreas: z.array(workAreaExportSchema),
    workItems: z.array(workItemExportSchema),
    comments: z.array(commentExportSchema),
    activityLogs: z.array(activityLogExportSchema),
  }),
});

export type DatabaseExportPayload = z.infer<typeof databaseExportSchema>;

export type DatabaseImportSummary = {
  people: number;
  workAreas: number;
  workItems: number;
  comments: number;
  activityLogs: number;
};

function toIso<T extends { createdAt?: Date; updatedAt?: Date; eta?: Date | null }>(record: T) {
  return {
    ...record,
    ...(record.createdAt ? { createdAt: record.createdAt.toISOString() } : {}),
    ...(record.updatedAt ? { updatedAt: record.updatedAt.toISOString() } : {}),
    ...("eta" in record ? { eta: record.eta ? record.eta.toISOString() : null } : {}),
  };
}

function toDate(value: string) {
  return new Date(value);
}

function summaryFor(payload: DatabaseExportPayload): DatabaseImportSummary {
  return {
    people: payload.data.people.length,
    workAreas: payload.data.workAreas.length,
    workItems: payload.data.workItems.length,
    comments: payload.data.comments.length,
    activityLogs: payload.data.activityLogs.length,
  };
}

function assertUniqueIds(records: Array<{ id: string }>, label: string) {
  const ids = new Set<string>();
  for (const record of records) {
    if (ids.has(record.id)) throw new Error(`Duplicate ${label} id: ${record.id}`);
    ids.add(record.id);
  }
}

function validateReferences(payload: DatabaseExportPayload) {
  assertUniqueIds(payload.data.people, "person");
  assertUniqueIds(payload.data.workAreas, "work area");
  assertUniqueIds(payload.data.workItems, "work item");
  assertUniqueIds(payload.data.comments, "comment");
  assertUniqueIds(payload.data.activityLogs, "activity log");

  const personIds = new Set(payload.data.people.map((person) => person.id));
  const workAreaIds = new Set(payload.data.workAreas.map((area) => area.id));
  const workItemIds = new Set(payload.data.workItems.map((item) => item.id));

  for (const item of payload.data.workItems) {
    if (!workAreaIds.has(item.workAreaId)) {
      throw new Error(`Work item ${item.id} references missing work area ${item.workAreaId}`);
    }
    if (item.assignedPersonId && !personIds.has(item.assignedPersonId)) {
      throw new Error(`Work item ${item.id} references missing person ${item.assignedPersonId}`);
    }
  }

  for (const comment of payload.data.comments) {
    if (!workItemIds.has(comment.workItemId)) {
      throw new Error(`Comment ${comment.id} references missing work item ${comment.workItemId}`);
    }
  }
}

export async function buildDatabaseExport(): Promise<DatabaseExportPayload> {
  const [people, workAreas, workItems, comments, activityLogs] = await Promise.all([
    db.person.findMany({ orderBy: { id: "asc" } }),
    db.workArea.findMany({ orderBy: { id: "asc" } }),
    db.workItem.findMany({ orderBy: { id: "asc" } }),
    db.comment.findMany({ orderBy: { id: "asc" } }),
    db.activityLog.findMany({ orderBy: { id: "asc" } }),
  ]);

  return {
    format: EXPORT_FORMAT,
    version: EXPORT_VERSION,
    exportedAt: new Date().toISOString(),
    data: {
      people: people.map(toIso),
      workAreas: workAreas.map(toIso),
      workItems: workItems.map(toIso),
      comments: comments.map((comment) => ({ ...comment, createdAt: comment.createdAt.toISOString() })),
      activityLogs: activityLogs.map((log) => ({
        id: log.id,
        entityType: log.entityType,
        entityId: log.entityId,
        entityLabel: log.entityLabel,
        action: log.action,
        fieldName: log.fieldName,
        oldValue: log.oldValue,
        newValue: log.newValue,
        ipAddress: log.ipAddress,
        actorUsername: log.actorUsername,
        createdAt: log.createdAt.toISOString(),
      })),
    },
  };
}

export function parseDatabaseExport(payload: unknown) {
  const parsed = databaseExportSchema.parse(payload);
  validateReferences(parsed);
  return parsed;
}

export function previewDatabaseImport(payload: unknown) {
  return summaryFor(parseDatabaseExport(payload));
}

export async function replaceDatabaseFromExport(payload: unknown, user: AuthUser, request: Request) {
  const parsed = parseDatabaseExport(payload);
  const summary = summaryFor(parsed);
  const ipAddress = getClientIp(request);

  await db.$transaction(async (tx) => {
    await tx.comment.deleteMany();
    await tx.workItem.deleteMany();
    await tx.activityLog.deleteMany();
    await tx.person.deleteMany();
    await tx.workArea.deleteMany();

    await tx.person.createMany({
      data: parsed.data.people.map((person) => ({
        ...person,
        createdAt: toDate(person.createdAt),
        updatedAt: toDate(person.updatedAt),
      })),
    });

    await tx.workArea.createMany({
      data: parsed.data.workAreas.map((area) => ({
        ...area,
        createdAt: toDate(area.createdAt),
        updatedAt: toDate(area.updatedAt),
      })),
    });

    await tx.workItem.createMany({
      data: parsed.data.workItems.map((item) => ({
        ...item,
        eta: item.eta ? toDate(item.eta) : null,
        createdAt: toDate(item.createdAt),
        updatedAt: toDate(item.updatedAt),
      })),
    });

    await tx.comment.createMany({
      data: parsed.data.comments.map((comment) => ({
        ...comment,
        createdAt: toDate(comment.createdAt),
      })),
    });

    await tx.activityLog.createMany({
      data: parsed.data.activityLogs.map((log) => ({
        ...log,
        actorUserId: null,
        createdAt: toDate(log.createdAt),
      })),
    });

    await tx.activityLog.create({
      data: {
        entityType: "database",
        entityId: "database",
        entityLabel: "Database import",
        action: "updated",
        fieldName: "import",
        newValue: JSON.stringify(summary),
        ipAddress,
        actorUserId: user.id,
        actorUsername: user.username,
      },
    });
  });

  return summary;
}
