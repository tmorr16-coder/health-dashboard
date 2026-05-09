import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentUserId } from "@/lib/auth";
import WithingsCard from "./_components/WithingsCard";
import OuraCard from "./_components/OuraCard";
import AppleHealthCard from "./_components/AppleHealthCard";

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

  const [
    { data: tokenRow },
    { data: lastWithingsRow },
    { data: ouraLastRow },
    { data: appleLastRow },
    { count: appleMetricsCount },
    { count: appleWorkoutsCount },
  ] = await Promise.all([
    db.from("withings_tokens").select("updated_at").eq("user_id", userId).maybeSingle() as Promise<{ data: TokenRow | null }>,
    db.from("apple_health_metrics").select("created_at").eq("user_id", userId).eq("source", "withings").order("created_at", { ascending: false }).limit(1).maybeSingle() as Promise<{ data: { created_at: string } | null }>,
    db.from("apple_health_metrics").select("created_at").eq("user_id", userId).eq("source", "oura").order("created_at", { ascending: false }).limit(1).maybeSingle() as Promise<{ data: { created_at: string } | null }>,
    db.from("apple_health_metrics").select("created_at").eq("user_id", userId).eq("source", "apple_health").order("created_at", { ascending: false }).limit(1).maybeSingle() as Promise<{ data: { created_at: string } | null }>,
    db.from("apple_health_metrics").select("id", { count: "exact", head: true }).eq("user_id", userId).eq("source", "apple_health") as Promise<{ count: number | null }>,
    db.from("apple_health_workouts").select("id", { count: "exact", head: true }).eq("user_id", userId) as Promise<{ count: number | null }>,
  ]);

  const connected           = tokenRow !== null;
  const connectedAt         = (tokenRow as TokenRow | null)?.updated_at ?? null;
  const lastSyncAt          = (lastWithingsRow as { created_at: string } | null)?.created_at ?? null;
  const ouraTokenConfigured = !!process.env.OURA_ACCESS_TOKEN;
  const ouraLastSyncAt      = (ouraLastRow as { created_at: string } | null)?.created_at ?? null;
  const appleConfigured     = !!process.env.HEALTH_AUTO_EXPORT_SECRET;
  const appleLastSyncAt     = (appleLastRow as { created_at: string } | null)?.created_at ?? null;
  const siteUrl             = process.env.NEXT_PUBLIC_SITE_URL ?? "";
  const webhookUrl          = `${siteUrl}/api/webhooks/apple-health`;

  const successMessage =
    params.connected === "1" ? "Withings connected successfully!" : null;
  const errorMessages: Record<string, string> = {
    invalid_state:  "OAuth state mismatch — please try again.",
    no_code:        "No authorization code returned by Withings.",
    token_exchange: "Withings rejected the authorization code.",
    fetch_failed:   "Network error reaching Withings servers.",
    db_error:       "Tokens received but failed to save. Check server logs.",
  };
  const errorMessage = params.error
    ? (errorMessages[params.error] ?? `Unknown error: ${params.error}`)
    : null;

  return (
    <div style={{ padding: "20px 20px 0" }}>

      {/* Back */}
      <Link
        href="/dashboard/medications"
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 4,
          fontSize: 13,
          color: "var(--color-ink-3)",
          textDecoration: "none",
          marginBottom: 20,
        }}
      >
        ← Health
      </Link>

      {/* Eyebrow */}
      <div
        style={{
          fontSize: 10,
          fontWeight: 500,
          letterSpacing: "0.14em",
          textTransform: "uppercase",
          color: "var(--color-ink-3)",
          marginBottom: 6,
        }}
      >
        Settings
      </div>

      {/* Display title */}
      <div
        style={{
          fontFamily: "var(--font-display)",
          fontSize: 36,
          fontWeight: 400,
          letterSpacing: "-0.02em",
          lineHeight: 1.1,
          color: "var(--color-ink)",
          marginBottom: 6,
        }}
      >
        Data
        <br />
        integrations.
      </div>
      <div
        style={{
          fontSize: 13,
          color: "var(--color-ink-3)",
          marginBottom: 24,
        }}
      >
        Connect devices and services to sync health data automatically.
      </div>

      {/* Error banner */}
      {errorMessage && (
        <div
          style={{
            background: "var(--color-accent-soft)",
            border: "1px solid var(--color-accent)",
            borderRadius: 10,
            padding: "12px 14px",
            fontSize: 13,
            color: "var(--color-accent)",
            marginBottom: 16,
          }}
        >
          {errorMessage}
        </div>
      )}

      {/* Cards */}
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <AppleHealthCard
          configured={appleConfigured}
          lastSyncAt={appleLastSyncAt}
          metricsCount={appleMetricsCount ?? 0}
          workoutsCount={appleWorkoutsCount ?? 0}
          webhookUrl={webhookUrl}
        />
        <WithingsCard
          connected={connected}
          connectedAt={connectedAt}
          lastSyncAt={lastSyncAt}
          successMessage={successMessage}
        />
        <OuraCard
          tokenConfigured={ouraTokenConfigured}
          lastSyncAt={ouraLastSyncAt}
        />
      </div>

    </div>
  );
}
