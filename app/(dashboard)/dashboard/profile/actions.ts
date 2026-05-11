"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentUserId } from "@/lib/auth";

export async function saveProfileGoals(data: {
  targetWeightLbs: number | null;
  calorieGoal: number | null;
}): Promise<{ error?: string }> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = createAdminClient() as any;
  const userId = await getCurrentUserId();

  const meta: Record<string, unknown> = {};
  if (data.targetWeightLbs !== null) meta.target_weight_lbs = data.targetWeightLbs;
  if (data.calorieGoal !== null) meta.calorie_goal = data.calorieGoal;

  const { error } = await db.auth.admin.updateUserById(userId, { user_metadata: meta });
  if (error) return { error: error.message };
  return {};
}

export async function deleteMyAccount(): Promise<{ error?: string }> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = createAdminClient() as any;
  const userId = await getCurrentUserId();
  // Deleting from auth.users cascades to profiles and all user data tables
  const { error } = await db.auth.admin.deleteUser(userId);
  if (error) return { error: error.message };
  return {};
}
