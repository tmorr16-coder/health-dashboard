"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentUserId } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function logDose(data: {
  date: string;
  dose_mg: number;
  injection_site: string;
  notes: string;
}): Promise<{ error?: string }> {
  const supabase = createAdminClient();
  const userId = getCurrentUserId();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any).from("doses").insert({
    user_id: userId,
    date: data.date,
    dose_mg: data.dose_mg,
    injection_site: data.injection_site || null,
    notes: data.notes || null,
  });

  if (error) return { error: (error as { message: string }).message };

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/zepbound");

  return {};
}
