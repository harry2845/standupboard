import { redirect } from "next/navigation";
import { clearCurrentSession } from "@/lib/auth";

export async function POST() {
  await clearCurrentSession();
  redirect("/login");
}
