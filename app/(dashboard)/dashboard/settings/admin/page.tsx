export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentUserId } from "@/lib/auth";
import AdminClient, { type AdminUser, type Invitation, type IntegrationRequest, type PendingUser, type SupportTicket } from "./_components/AdminClient";

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

  // Fetch pending users awaiting approval
  type PendingRow = { id: string; email: string | null; full_name: string | null; created_at: string };
  let pendingUsers: PendingUser[] = [];
  try {
    const { data: pendingRows } = await db
      .from("profiles")
      .select("id, email, full_name, created_at")
      .eq("status", "pending")
      .order("created_at", { ascending: true });

    // Enrich with auth metadata (avatar, full name from Google)
    const authUserMap = new Map<string, AuthUser>(((authUsers as AuthUser[]) ?? []).map((u) => [u.id, u]));
    pendingUsers = ((pendingRows as PendingRow[]) ?? []).map((p) => {
      const au = authUserMap.get(p.id);
      return {
        id: p.id,
        email: au?.email ?? p.email ?? "",
        name: au?.user_metadata?.full_name ?? au?.user_metadata?.name ?? p.full_name ?? "",
        avatarUrl: au?.user_metadata?.avatar_url ?? au?.user_metadata?.picture ?? null,
        createdAt: p.created_at,
      };
    });
  } catch { /* status column may not exist yet */ }

  // Fetch open support tickets
  type TicketRow = { id: string; user_name: string | null; user_email: string | null; type: string; subject: string; description: string; status: string; created_at: string };
  let supportTickets: SupportTicket[] = [];
  try {
    const { data: ticketRows } = await db
      .from("support_tickets")
      .select("id, user_name, user_email, type, subject, description, status, created_at")
      .in("status", ["open", "in_progress"])
      .order("created_at", { ascending: false });
    supportTickets = ((ticketRows as TicketRow[]) ?? []).map((t) => ({
      id: t.id,
      userName: t.user_name ?? "",
      userEmail: t.user_email ?? "",
      type: t.type as SupportTicket["type"],
      subject: t.subject,
      description: t.description,
      status: t.status as SupportTicket["status"],
      createdAt: t.created_at,
    }));
  } catch { /* table may not exist yet */ }

  // Fetch integration requests (pending + planned, newest first)
  type ReqRow = { id: string; user_name: string | null; user_email: string | null; integration: string; description: string | null; status: string; created_at: string };
  let integrationRequests: IntegrationRequest[] = [];
  try {
    const { data: reqRows } = await db
      .from("integration_requests")
      .select("id, user_name, user_email, integration, description, status, created_at")
      .in("status", ["pending", "planned"])
      .order("created_at", { ascending: false });
    integrationRequests = ((reqRows as ReqRow[]) ?? []).map((r) => ({
      id: r.id,
      userName: r.user_name ?? "",
      userEmail: r.user_email ?? "",
      integration: r.integration,
      description: r.description ?? "",
      status: r.status as IntegrationRequest["status"],
      createdAt: r.created_at,
    }));
  } catch { /* table may not exist yet */ }

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

      <AdminClient
        users={users}
        invitations={invitations}
        integrationRequests={integrationRequests}
        pendingUsers={pendingUsers}
        supportTickets={supportTickets}
      />

    </div>
  );
}
