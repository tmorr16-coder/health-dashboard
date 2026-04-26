export default function LandingPage() {
  return (
    <main
      className="min-h-screen flex flex-col items-center justify-center px-6 py-20"
      style={{
        background:
          "radial-gradient(ellipse at 20% 0%, rgba(78,205,196,0.08) 0%, transparent 50%), radial-gradient(ellipse at 80% 0%, rgba(162,155,254,0.08) 0%, transparent 50%), #0d1117",
      }}
    >
      {/* Label */}
      <p
        className="text-xs font-semibold tracking-widest uppercase mb-3"
        style={{ color: "#4a5568" }}
      >
        Personal Health Command Center
      </p>

      {/* Heading */}
      <h1
        className="text-5xl md:text-6xl font-extrabold tracking-tight text-center mb-4"
        style={{
          fontFamily: "var(--font-syne)",
          background: "linear-gradient(135deg, #4ecdc4 0%, #a29bfe 100%)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
        }}
      >
        Health Dashboard
      </h1>

      {/* Subtitle */}
      <p
        className="text-base text-center max-w-md mb-10"
        style={{ color: "#9aa5c4" }}
      >
        Workouts, Zepbound tracking, sleep, and AI insights — all in one place.
      </p>

      {/* CTA */}
      <a
        href="/dashboard"
        className="px-8 py-3 rounded-xl font-bold text-sm tracking-wide"
        style={{
          fontFamily: "var(--font-syne)",
          background: "linear-gradient(135deg, #4ecdc4 0%, #a29bfe 100%)",
          color: "#0d1117",
          boxShadow: "0 4px 20px rgba(78,205,196,0.3)",
        }}
      >
        Open Dashboard
      </a>

      {/* Feature pills */}
      <div className="flex flex-wrap gap-2 justify-center mt-12 max-w-lg">
        {[
          "Workout Tracker",
          "Zepbound Doses",
          "Sleep & HRV",
          "Body Composition",
          "AI Insights",
          "Sauna Sessions",
        ].map((label) => (
          <span
            key={label}
            className="px-3 py-1 rounded-full text-xs font-semibold"
            style={{
              background: "rgba(78,205,196,0.1)",
              border: "1px solid rgba(78,205,196,0.3)",
              color: "#4ecdc4",
            }}
          >
            {label}
          </span>
        ))}
      </div>
    </main>
  );
}
