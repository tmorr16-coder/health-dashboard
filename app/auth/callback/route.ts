import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      // Apply role from invitation if the user was invited
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user?.email) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const db = createAdminClient() as any;
          const { data: invite } = await db
            .from("invitations")
            .select("id, role")
            .eq("email", user.email.toLowerCase())
            .is("accepted_at", null)
            .maybeSingle();
          if (invite) {
            await db.from("profiles").update({ role: invite.role }).eq("id", user.id);
            await db.from("invitations").update({ accepted_at: new Date().toISOString() }).eq("id", invite.id);
          }
        }
      } catch { /* invitations table may not exist yet — ignore */ }

      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/?error=auth_failed`);
}
