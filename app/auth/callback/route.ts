import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { Resend } from "resend";
import { logEvent } from "@/lib/usage";

async function getAdminEmails(db: ReturnType<typeof createAdminClient>): Promise<string[]> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data } = await (db as any).from("profiles").select("email").eq("role", "admin");
    type Row = { email: string | null };
    return ((data as Row[]) ?? []).map((r) => r.email).filter((e): e is string => !!e);
  } catch { return []; }
}

async function sendEmail(subject: string, html: string) {
  if (!process.env.RESEND_API_KEY) return;
  try {
    const db = createAdminClient();
    const adminEmails = await getAdminEmails(db);
    if (!adminEmails.length) return;
    const resend = new Resend(process.env.RESEND_API_KEY);
    const from = process.env.RESEND_FROM_EMAIL ?? "noreply@resend.dev";
    await resend.emails.send({ from, to: adminEmails, subject, html });
  } catch { /* non-fatal */ }
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const db = createAdminClient() as any;
        const { data: { user } } = await supabase.auth.getUser();

        if (user?.email) {
          const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? origin;

          // Check if user was invited — if so, apply role and auto-approve
          const { data: invite } = await db
            .from("invitations")
            .select("id, role")
            .eq("email", user.email.toLowerCase())
            .is("accepted_at", null)
            .maybeSingle();

          if (invite) {
            // Invited users: apply role + auto-approve (admin already vouched for them)
            await db.from("profiles").update({ role: invite.role, status: "approved" }).eq("id", user.id);
            await db.from("invitations").update({ accepted_at: new Date().toISOString() }).eq("id", invite.id);
          } else {
            // New organic sign-up — check if this is their first sign-in
            const { data: profile } = await db.from("profiles").select("status").eq("id", user.id).maybeSingle();
            const isNewUser = !profile || profile.status === "pending";

            if (isNewUser) {
              const userName = user.user_metadata?.full_name ?? user.user_metadata?.name ?? user.email;
              logEvent({ eventType: "signup", userId: user.id, metadata: { email: user.email } });
              await sendEmail(
                `New user awaiting approval: ${userName}`,
                `
                  <div style="font-family: sans-serif; max-width: 520px; margin: 0 auto; color: #1a1a1a;">
                    <h2 style="margin: 0 0 6px; font-size: 20px;">New sign-up awaiting approval</h2>
                    <p style="margin: 0 0 20px; color: #666; font-size: 14px;">A new user has signed in and is waiting for your approval before they can access the dashboard.</p>
                    <table style="width: 100%; border-collapse: collapse; font-size: 14px; margin-bottom: 20px;">
                      <tr>
                        <td style="padding: 10px 14px; background: #f5f5f3; border-radius: 6px 6px 0 0; font-weight: 600; width: 100px;">Name</td>
                        <td style="padding: 10px 14px; background: #f5f5f3; border-radius: 6px 6px 0 0;">${userName}</td>
                      </tr>
                      <tr>
                        <td style="padding: 10px 14px; background: #fafaf8; font-weight: 600; border-radius: 0 0 6px 6px;">Email</td>
                        <td style="padding: 10px 14px; background: #fafaf8; border-radius: 0 0 6px 6px;">${user.email}</td>
                      </tr>
                    </table>
                    <a href="${siteUrl}/dashboard/settings/admin" style="display: inline-block; padding: 10px 18px; background: #1a1a1a; color: #fff; text-decoration: none; border-radius: 8px; font-size: 13px; font-weight: 600;">Review in admin panel →</a>
                  </div>
                `
              );
            }
          }
        }
      } catch { /* non-fatal */ }

      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/?error=auth_failed`);
}
