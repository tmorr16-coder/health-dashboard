import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentUserId } from "@/lib/auth";
import BottomNav from "./_components/BottomNav";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
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
  }

  return (
    <div style={{ paddingBottom: 72 }}>
      {children}
      <BottomNav />
    </div>
  );
}
