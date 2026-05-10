import { createAdminClient } from "@/lib/supabase/admin";

function toDateStr(d: Date) { return d.toLocaleDateString("sv"); }

export default async function CommunityFeed() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = createAdminClient() as any;

  const today = toDateStr(new Date());
  const weekAgo = toDateStr(new Date(Date.now() - 7 * 86_400_000));
  const monthAgo = toDateStr(new Date(Date.now() - 30 * 86_400_000));

  const [
    { count: workoutsToday },
    { count: workoutsWeek },
    { count: mealsToday },
    { count: activeUsersWeek },
    { data: topTypes },
  ] = await Promise.all([
    db.from("workout_sessions").select("id", { count: "exact", head: true }).eq("date", today),
    db.from("workout_sessions").select("id", { count: "exact", head: true }).gte("date", weekAgo),
    db.from("meals").select("id", { count: "exact", head: true }).eq("date", today),
    db.from("workout_sessions").select("user_id", { count: "exact", head: true }).gte("date", weekAgo),
    db.from("workout_sessions").select("type").gte("date", monthAgo).limit(200),
  ]);

  // Most popular workout type this month
  const typeCounts: Record<string, number> = {};
  for (const row of (topTypes ?? [])) {
    const t = row.type as string;
    typeCounts[t] = (typeCounts[t] ?? 0) + 1;
  }
  const topType = Object.entries(typeCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;

  const items: { icon: string; text: string; sub?: string }[] = [];

  if ((workoutsToday ?? 0) > 0) {
    items.push({ icon: "🏋️", text: `${workoutsToday} workout${workoutsToday === 1 ? "" : "s"} logged today`, sub: "Keep the momentum going" });
  }
  if ((workoutsWeek ?? 0) > 0) {
    items.push({ icon: "📅", text: `${workoutsWeek} sessions this week`, sub: `Across ${activeUsersWeek ?? 0} active member${activeUsersWeek === 1 ? "" : "s"}` });
  }
  if ((mealsToday ?? 0) > 0) {
    items.push({ icon: "🥗", text: `${mealsToday} meal${mealsToday === 1 ? "" : "s"} tracked today`, sub: "Nutrition on point" });
  }
  if (topType) {
    items.push({ icon: "🔥", text: `Most popular this month: ${topType}`, sub: `${typeCounts[topType]} sessions logged` });
  }
  if (items.length === 0) {
    items.push({ icon: "👋", text: "Be the first to log activity today!", sub: "Your progress shows up here" });
  }

  return (
    <div
      style={{
        background: "var(--color-bg-raised)",
        border: "1px solid var(--color-line)",
        borderRadius: 14,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          padding: "14px 16px 10px",
          borderBottom: "1px solid var(--color-line)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div style={{ fontSize: 10, fontWeight: 500, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--color-ink-3)" }}>
          Community
        </div>
        <div style={{ fontSize: 10, color: "var(--color-ink-4)" }}>
          {activeUsersWeek ?? 0} active this week
        </div>
      </div>
      <div style={{ display: "flex", flexDirection: "column" }}>
        {items.map((item, i) => (
          <div
            key={i}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: "11px 16px",
              borderBottom: i < items.length - 1 ? "1px solid var(--color-line)" : undefined,
            }}
          >
            <div
              style={{
                width: 34,
                height: 34,
                borderRadius: 9,
                background: "var(--color-bg-sunk)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 16,
                flexShrink: 0,
              }}
            >
              {item.icon}
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 500, color: "var(--color-ink)" }}>{item.text}</div>
              {item.sub && <div style={{ fontSize: 11, color: "var(--color-ink-4)", marginTop: 1 }}>{item.sub}</div>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
