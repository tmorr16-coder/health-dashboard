export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentUserId } from "@/lib/auth";
import AdminClient, { type AdminUser, type Invitation } from "./_components/AdminClient";

export default async function AdminPage() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = createAdminClient() as any;
  const currentUserId = await getCurrentUserId();

  // Guard: only admins may access this page
  const { data: currentProfile } = await db
    .from("profiles")
    .select("role")
    .eq("id", currentUserId)
    .maybeSingle();
  if ((currentProfile as { role: string } | null)?.role !== "admin") {
    redirect("/dashboard");
  }

  // Fetch all auth users
  const { data: { users: authUsers } } = await db.auth.admin.listUsers({ perPage: 200 });

  // Fetch all profiles (for role data)
  const { data: profileRows } = await db
    .from("profiles")
    .select("id, email, full_name, role, created_at");

  type ProfileRow = { id: string; email: string | null; full_name: string | null; role: string; created_at: string };
  const profileMap = new Map<string, ProfileRow>(
    ((profileRows as ProfileRow[]) ?? []).map((p) => [p.id, p])
  );

  // Build unified user list — only include users who have signed in at least once
  type AuthUser = { id: string; email: string; created_at: string; last_sign_in_at: string | null; user_metadata: Record<string, string> };
  const users: AdminUser[] = ((authUsers as AuthUser[]) ?? [])
    .filter((u) => u.last_sign_in_at || profileMap.has(u.id))
    .map((u) => {
      const p = profileMap.get(u.id);
      return {
        id: u.id,
        email: u.email ?? p?.email ?? "",
        name: u.user_metadata?.full_name ?? u.user_metadata?.name ?? p?.full_name ?? "",
        avatarUrl: u.user_metadata?.avatar_url ?? u.user_metadata?.picture ?? null,
        role: (p?.role as "admin" | "standard") ?? "standard",
        createdAt: u.created_at,
        isCurrentUser: u.id === currentUserId,
      };
    });

  // Fetch pending invitations
  const { data: inviteRows } = await db
    .from("invitations")
    .select("id, email, role, invited_at, accepted_at")
    .is("accepted_at", null)
    .order("invited_at", { ascending: false });

  type InviteRow = { id: string; email: string; role: string; invited_at: string; accepted_at: string | null };
  const invitations: Invitation[] = ((inviteRows as InviteRow[]) ?? []).map((r) => ({
    id: r.id,
    email: r.email,
    role: r.role as "standard" | "admin",
    invitedAt: r.invited_at,
  }));

  return (
    <div style={{ padding: "20px 20px 0" }}>

      <Link
        href="/dashboard/profile"
        style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 13, color: "var(--color-ink-3)", textDecoration: "none", marginBottom: 20 }}
      >
        ← Profile
      </Link>

      <div style={{ fontSize: 10, fontWeight: 500, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--color-ink-3)", marginBottom: 6 }}>
        Settings
      </div>
      <div style={{ fontFamily: "var(--font-display)", fontSize: 36, fontWeight: 400, letterSpacing: "-0.02em", lineHeight: 1, color: "var(--color-ink)", marginBottom: 6 }}>
        Admin
        <br />
        panel.
      </div>
      <div style={{ fontSize: 13, color: "var(--color-ink-3)", marginBottom: 24 }}>
        Manage users, send invitations, and control access.
      </div>

      <AdminClient users={users} invitations={invitations} />

    </div>
  );
}
