"use server";

import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentUserId } from "@/lib/auth";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function requireAdmin(): Promise<{ db: any; currentUserId: string }> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = createAdminClient() as any;
  const currentUserId = await getCurrentUserId();
  const { data } = await db.from("profiles").select("role").eq("id", currentUserId).maybeSingle();
  if ((data as { role: string } | null)?.role !== "admin") redirect("/dashboard");
  return { db, currentUserId };
}

export async function inviteUser(
  email: string,
  role: "standard" | "admin"
): Promise<{ error?: string }> {
  // requireAdmin ensures the caller is an admin — only admins may grant admin role
  const { db, currentUserId } = await requireAdmin();

  const { error: inviteError } = await db.auth.admin.inviteUserByEmail(email.toLowerCase().trim(), {
    data: { intended_role: role },
  });
  if (inviteError) return { error: inviteError.message };

  await db.from("invitations").insert({
    email: email.toLowerCase().trim(),
    role,
    invited_by: currentUserId,
  });

  return {};
}

export async function cancelInvitation(id: string): Promise<{ error?: string }> {
  const { db } = await requireAdmin();
  const { error } = await db.from("invitations").delete().eq("id", id);
  if (error) return { error: error.message };
  return {};
}

export async function updateUserRole(
  userId: string,
  role: "standard" | "admin"
): Promise<{ error?: string }> {
  // Double-lock: requireAdmin() verifies the caller is admin before any role change.
  // Setting role='admin' is therefore only possible by an existing admin.
  const { db, currentUserId } = await requireAdmin();
  if (userId === currentUserId && role !== "admin") {
    return { error: "You cannot remove your own admin role." };
  }
  const { error } = await db.from("profiles").update({ role }).eq("id", userId);
  if (error) return { error: error.message };
  return {};
}

export async function removeUser(userId: string): Promise<{ error?: string }> {
  const { db, currentUserId } = await requireAdmin();
  if (userId === currentUserId) return { error: "You cannot remove your own account here." };

  // auth.admin.deleteUser cascades through profiles → all user data
  const { error } = await db.auth.admin.deleteUser(userId);
  if (error) return { error: error.message };
  return {};
}

export async function deleteMyAccount(): Promise<{ error?: string }> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = createAdminClient() as any;
  const userId = await getCurrentUserId();
  const { error } = await db.auth.admin.deleteUser(userId);
  if (error) return { error: error.message };
  return {};
}
