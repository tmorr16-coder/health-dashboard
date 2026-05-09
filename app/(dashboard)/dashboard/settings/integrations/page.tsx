import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentUserId } from "@/lib/auth";
import WithingsCard from "./_components/WithingsCard";

interface TokenRow {
  updated_at: string;
}

export default async function IntegrationsPage({
  searchParams,
}: {
  searchParams: Promise<{ connected?: string; error?: string }>;
}) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = createAdminClient() as any;
  const userId = getCurrentUserId();
  const params = await searchParams;

  // Fetch current Withings token row
  const { data: tokenRow } = (await db
    .from("withings_tokens")
    .select("updated_at")
    .eq("user_id", userId)
    .maybeSingle()) as { data: TokenRow | null };

  // Most recent Withings data point (to show "last sync" time)
  const { data: lastDataRow } = (await db
    .from("apple_health_metrics")
    .select("created_at")
    .eq("user_id", userId)
    .eq("source", "withings")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle()) as { data: { created_at: string } | null };

  const connected   = tokenRow !== null;
  const connectedAt = tokenRow?.updated_at ?? null;
  const lastSyncAt  = lastDataRow?.created_at ?? null;

  const successMessage =
    params.connected === "1" ? "Withings connected successfully!" : null;
  const errorMessages: Record<string, string> = {
    invalid_state: "OAuth state mismatch — please try again.",
    no_code:       "No authorization code returned by Withings.",
    token_exchange: "Withings rejected the authorization code. Check your client credentials.",
    fetch_failed:  "Network error reaching Withings servers.",
    db_error:      "Tokens received but failed to save. Check server logs.",
  };
  const errorMessage = params.error ? (errorMessages[params.error] ?? `Unknown error: ${params.error}`) : null;

  return (
    <div style={{ fontFamily: "var(--font-dm-sans)", color: "#e8ecf8" }}>

      {/* Back link */}
      <div style={{ padding: "16px 24px 0" }}>
        <Link
          href="/dashboard"
          style={{ fontSize: 12, color: "#7a8299", textDecoration: "none", letterSpacing: 0.3 }}
        >
          ← Back to Dashboard
        </Link>
      </div>

      {/* Header */}
      <div style={{ padding: "16px 24px 12px", borderBottom: "1px solid #1a2035" }}>
        <div
          style={{
            fontSize: 12,
            color: "#4a5568",
            letterSpacing: 2,
            textTransform: "uppercase",
            marginBottom: 4,
          }}
        >
          Settings
        </div>
        <div style={{ fontFamily: "var(--font-syne)", fontSize: 26, fontWeight: 800 }}>
          Integrations
        </div>
        <div style={{ fontSize: 13, color: "#7a8299", marginTop: 3 }}>
          Connect health devices and services to sync data automatically.
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: "20px 24px", maxWidth: 800 }}>
        <WithingsCard
          connected={connected}
          connectedAt={connectedAt}
          lastSyncAt={lastSyncAt}
          successMessage={successMessage}
          errorMessage={errorMessage}
        />
      </div>

    </div>
  );
}
