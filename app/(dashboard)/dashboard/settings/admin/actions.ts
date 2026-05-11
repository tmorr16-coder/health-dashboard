"use server";

import { redirect } from "next/navigation";
import { Resend } from "resend";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentUserId } from "@/lib/auth";

async function sendUserEmail(to: string, subject: string, html: string) {
  if (!process.env.RESEND_API_KEY || !to) return;
  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    const from = process.env.RESEND_FROM_EMAIL ?? "noreply@resend.dev";
    await resend.emails.send({ from, to, subject, html });
  } catch { /* non-fatal */ }
}

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

export async function updateIntegrationRequestStatus(
  id: string,
  status: "reviewed" | "planned" | "declined"
): Promise<{ error?: string }> {
  const { db } = await requireAdmin();
  const { error } = await db
    .from("integration_requests")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) return { error: error.message };
  return {};
}

export async function approveUser(userId: string): Promise<{ error?: string }> {
  const { db } = await requireAdmin();
  const { error } = await db.from("profiles").update({ status: "approved" }).eq("id", userId);
  if (error) return { error: error.message };

  // Email the user to let them know they've been approved
  const { data: authUser } = await db.auth.admin.getUserById(userId);
  const userEmail = authUser?.user?.email;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "";
  await sendUserEmail(
    userEmail ?? "",
    "Your account has been approved",
    `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; color: #1a1a1a;">
        <h2 style="margin: 0 0 10px; font-size: 20px;">You're approved!</h2>
        <p style="margin: 0 0 20px; color: #666; font-size: 14px; line-height: 1.6;">
          Your health dashboard account has been approved. You can now sign in and access all your data.
        </p>
        ${siteUrl ? `<a href="${siteUrl}" style="display: inline-block; padding: 10px 18px; background: #1a1a1a; color: #fff; text-decoration: none; border-radius: 8px; font-size: 13px; font-weight: 600;">Go to dashboard →</a>` : ""}
      </div>
    `
  );
  return {};
}

export async function rejectUser(userId: string): Promise<{ error?: string }> {
  const { db } = await requireAdmin();

  // Email the user before deleting their account
  const { data: authUser } = await db.auth.admin.getUserById(userId);
  const userEmail = authUser?.user?.email;
  await sendUserEmail(
    userEmail ?? "",
    "Health Dashboard — access request",
    `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; color: #1a1a1a;">
        <h2 style="margin: 0 0 10px; font-size: 20px;">Access not approved</h2>
        <p style="margin: 0 0 16px; color: #666; font-size: 14px; line-height: 1.6;">
          Your request to access the health dashboard was not approved at this time.
          If you think this is a mistake, please reach out directly.
        </p>
      </div>
    `
  );

  // Delete account entirely so they don't remain in a rejected limbo
  const { error } = await db.auth.admin.deleteUser(userId);
  if (error) return { error: error.message };
  return {};
}

export async function updateTicketStatus(
  id: string,
  status: "in_progress" | "resolved" | "closed"
): Promise<{ error?: string }> {
  const { db } = await requireAdmin();
  const { error } = await db
    .from("support_tickets")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) return { error: error.message };
  return {};
}

export async function submitSupportTicket(data: {
  type: string;
  subject: string;
  description: string;
}): Promise<{ error?: string }> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = createAdminClient() as any;
  const userId = await getCurrentUserId();

  const { data: authUser } = await db.auth.admin.getUserById(userId);
  const userEmail = authUser?.user?.email ?? "";
  const userName = authUser?.user?.user_metadata?.full_name ?? authUser?.user?.user_metadata?.name ?? userEmail;

  const { error: dbError } = await db.from("support_tickets").insert({
    user_id: userId,
    user_email: userEmail,
    user_name: userName,
    type: data.type,
    subject: data.subject.trim(),
    description: data.description.trim(),
  });
  if (dbError) return { error: dbError.message };

  // Email all admins
  if (process.env.RESEND_API_KEY) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: adminProfiles } = await (db as any).from("profiles").select("email").eq("role", "admin");
      type Row = { email: string | null };
      const adminEmails: string[] = ((adminProfiles as Row[]) ?? []).map((r) => r.email).filter((e): e is string => !!e);
      if (adminEmails.length) {
        const resend = new Resend(process.env.RESEND_API_KEY);
        const from = process.env.RESEND_FROM_EMAIL ?? "noreply@resend.dev";
        const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "";
        const typeLabel: Record<string, string> = { bug: "Bug report", feature: "Feature request", question: "Question", other: "Other" };
        await resend.emails.send({
          from,
          to: adminEmails,
          subject: `Support ticket: ${data.subject}`,
          html: `
            <div style="font-family: sans-serif; max-width: 520px; margin: 0 auto; color: #1a1a1a;">
              <h2 style="margin: 0 0 6px; font-size: 20px;">New support ticket</h2>
              <p style="margin: 0 0 20px; color: #666; font-size: 14px;">${userName} &lt;${userEmail}&gt; submitted a ${typeLabel[data.type] ?? data.type.toLowerCase()}.</p>
              <table style="width: 100%; border-collapse: collapse; font-size: 14px; margin-bottom: 20px;">
                <tr><td style="padding: 10px 14px; background: #f5f5f3; border-radius: 6px 6px 0 0; font-weight: 600; width: 100px;">Subject</td><td style="padding: 10px 14px; background: #f5f5f3; border-radius: 6px 6px 0 0;">${data.subject}</td></tr>
                <tr><td style="padding: 10px 14px; background: #fafaf8; font-weight: 600;">Type</td><td style="padding: 10px 14px; background: #fafaf8;">${typeLabel[data.type] ?? data.type}</td></tr>
                <tr><td style="padding: 10px 14px; background: #f5f5f3; font-weight: 600; border-radius: 0 0 6px 6px; vertical-align: top;">Details</td><td style="padding: 10px 14px; background: #f5f5f3; border-radius: 0 0 6px 6px; white-space: pre-wrap;">${data.description}</td></tr>
              </table>
              ${siteUrl ? `<a href="${siteUrl}/dashboard/settings/admin" style="display: inline-block; padding: 10px 18px; background: #1a1a1a; color: #fff; text-decoration: none; border-radius: 8px; font-size: 13px; font-weight: 600;">View in admin panel →</a>` : ""}
            </div>
          `,
        });
      }
    } catch { /* non-fatal */ }
  }

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
