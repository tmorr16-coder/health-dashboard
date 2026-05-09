"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentUserId } from "@/lib/auth";
import { revalidatePath } from "next/cache";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyClient = any;

export async function quickLogWorkout(data: {
  type: string;
  durationMin: number;
  notes: string | null;
}): Promise<{ error?: string }> {
  const db: AnyClient = createAdminClient();
  const userId = getCurrentUserId();

  const { error } = await db.from("workout_sessions").insert({
    user_id: userId,
    date: new Date().toLocaleDateString("sv"),
    type: data.type,
    duration_min: data.durationMin,
    notes: data.notes,
  });

  if (error) return { error: error.message };

  revalidatePath("/dashboard/train");
  revalidatePath("/dashboard");
  return {};
}
