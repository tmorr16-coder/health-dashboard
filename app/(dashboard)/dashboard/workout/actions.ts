"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentUserId } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { EXERCISE_LIBRARY } from "./exercise-library";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyClient = any;

export async function createWorkoutSession(): Promise<{
  sessionId: string;
  exerciseIds: string[];
  error?: string;
}> {
  const db: AnyClient = createAdminClient();
  const userId = getCurrentUserId();

  const { data: session, error: sessionErr } = await db
    .from("workout_sessions")
    .insert({
      user_id: userId,
      date: new Date().toLocaleDateString("sv"),
      type: "Lower Body Power",
    })
    .select("id")
    .single();

  if (sessionErr || !session) {
    return { sessionId: "", exerciseIds: [], error: sessionErr?.message ?? "Failed to create session" };
  }

  const inserts = EXERCISE_LIBRARY.map((ex, i) => ({
    session_id: session.id,
    user_id: userId,
    name: ex.name,
    order_index: i,
    muscles: ex.muscles,
  }));

  const { data: exercises, error: exErr } = await db
    .from("exercises")
    .insert(inserts)
    .select("id, name");

  if (exErr || !exercises) {
    return { sessionId: session.id, exerciseIds: [], error: exErr?.message ?? "Failed to create exercises" };
  }

  // Return IDs in the same order as EXERCISE_LIBRARY
  const exerciseIds = EXERCISE_LIBRARY.map(
    (ex) => (exercises as { id: string; name: string }[]).find((e) => e.name === ex.name)?.id ?? ""
  );

  return { sessionId: session.id, exerciseIds };
}

export async function saveSet(data: {
  exerciseId: string;
  setNumber: number;
  reps: number;
  weight: number;
  rpe: number;
}): Promise<{ error?: string }> {
  const db: AnyClient = createAdminClient();
  const userId = getCurrentUserId();

  const { error } = await db.from("sets").insert({
    exercise_id: data.exerciseId,
    user_id: userId,
    set_number: data.setNumber,
    reps_actual: data.reps,
    weight_actual: data.weight,
    rpe: data.rpe,
  });

  if (error) return { error: error.message };
  return {};
}

export async function finishSession(
  sessionId: string,
  durationMin: number
): Promise<{ error?: string }> {
  const db: AnyClient = createAdminClient();

  const { error } = await db
    .from("workout_sessions")
    .update({ duration_min: durationMin })
    .eq("id", sessionId);

  if (error) return { error: error.message };

  revalidatePath("/dashboard");
  return {};
}
