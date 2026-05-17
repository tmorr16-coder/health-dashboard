import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUserId } from "@/lib/auth";
import BottomNav from "./_components/BottomNav";
import PlatformMenu from "@/components/PlatformMenu";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let menuUser = null;

  // Skip approval check in local dev bypass mode
  if (process.env.NEXT_PUBLIC_AUTH_BYPASS !== "true") {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = createAdminClient() as any;
    const userId = await getCurrentUserId();
    const { data } = await db.from("profiles").select("status").eq("id", userId).maybeSingle();
    const status = (data as { status: string } | null)?.status;

    if (status === "pending") redirect("/pending-approval");
    if (status === "rejected") redirect("/?error=account_rejected");
    // No profile row yet (trigger race) — allow through; they'll be gated on next load

    // Build menuUser from auth for the PlatformMenu
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      menuUser = {
        name: user.user_metadata?.full_name ?? user.user_metadata?.name ?? null,
        email: user.email,
        avatarUrl: user.user_metadata?.avatar_url ?? user.user_metadata?.picture ?? null,
      };
    }
  }

  return (
    <div style={{ paddingBottom: 72 }}>
      <PlatformMenu currentApp="health" user={menuUser} />
      {children}
      <BottomNav />
    </div>
  );
}
