import { db } from "@/lib/db";

export type ActivityAction = "created" | "updated" | "deleted";

export function getClientIp(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]?.trim() || "unknown";

  return request.headers.get("x-real-ip") ?? "unknown";
}

export function serializeValue(value: unknown) {
  if (value === null || value === undefined || value === "") return null;
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  return String(value);
}

export async function logActivity({
  entityType,
  entityId,
  entityLabel,
  action,
  fieldName,
  oldValue,
  newValue,
  ipAddress,
}: {
  entityType: string;
  entityId: string;
  entityLabel: string;
  action: ActivityAction;
  fieldName?: string;
  oldValue?: unknown;
  newValue?: unknown;
  ipAddress: string;
}) {
  await db.activityLog.create({
    data: {
      entityType,
      entityId,
      entityLabel,
      action,
      fieldName,
      oldValue: serializeValue(oldValue),
      newValue: serializeValue(newValue),
      ipAddress,
    },
  });
}

export async function logChangedFields({
  entityType,
  entityId,
  entityLabel,
  fields,
  ipAddress,
}: {
  entityType: string;
  entityId: string;
  entityLabel: string;
  fields: Array<{ fieldName: string; oldValue: unknown; newValue: unknown }>;
  ipAddress: string;
}) {
  const changed = fields.filter(
    (field) => serializeValue(field.oldValue) !== serializeValue(field.newValue),
  );

  if (changed.length === 0) return;

  await db.activityLog.createMany({
    data: changed.map((field) => ({
      entityType,
      entityId,
      entityLabel,
      action: "updated",
      fieldName: field.fieldName,
      oldValue: serializeValue(field.oldValue),
      newValue: serializeValue(field.newValue),
      ipAddress,
    })),
  });
}
