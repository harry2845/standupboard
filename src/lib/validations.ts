import { z } from "zod";

export const statuses = ["todo", "in_progress", "blocked", "done"] as const;

export const personSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  active: z.boolean().optional(),
});

export const workAreaSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  description: z.string().trim().optional().nullable(),
  sortOrder: z.number().int().optional(),
});

export const workItemSchema = z.object({
  title: z.string().trim().min(1, "Title is required"),
  description: z.string().trim().optional().nullable(),
  status: z.enum(statuses).optional(),
  eta: z.string().trim().optional().nullable(),
  workAreaId: z.string().min(1),
  assignedPersonId: z.string().optional().nullable(),
});

export const workItemPatchSchema = workItemSchema.partial();

export const commentSchema = z.object({
  body: z.string().trim().min(1, "Comment is required"),
  authorName: z.string().trim().optional().nullable(),
});

export const loginSchema = z.object({
  username: z.string().trim().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z.string().min(8, "New password must be at least 8 characters"),
    confirmPassword: z.string().min(8, "Confirm password must be at least 8 characters"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "New passwords do not match",
    path: ["confirmPassword"],
  });

export function parseEta(eta: string | null | undefined) {
  if (!eta) return null;
  const parsed = new Date(`${eta}T00:00:00`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}
