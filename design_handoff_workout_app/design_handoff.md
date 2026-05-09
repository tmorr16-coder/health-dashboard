# Handoff: Workout App Redesign

## Overview

This handoff bundles a high-fidelity HTML prototype of a workout app redesign, intended to be ported into the existing **`tmorr16-coder/health-dashboard`** Next.js + Supabase codebase. The prototype focuses on:

1. A **muscle-selection workout builder** — tap muscle groups on an anatomical body diagram → app builds a multi-exercise plan.
2. A polished **visual system** (cream/terracotta paper-feel palette, Instrument Serif display type, Geist sans + mono).
3. **Plan-vs-actuals tracking**, full set/rep editing, history, and progress views.

The repo already has Supabase auth, integrations (Oura / Withings / Apple Health), `WorkoutTracker.tsx`, and `PostWorkoutSummary.tsx`. **Don't rebuild those.** This handoff adds a new builder flow, a Body component, and applies a unified visual system.

## About the design files

The HTML/JSX files in this bundle are **design references** — a single-file React prototype loaded via Babel-in-browser. They are **not** production code to copy directly. Recreate them inside the existing Next.js 16 / React 19 / TypeScript / Tailwind v4 codebase using its established patterns. Lift exact hex values, type tokens, spacing, and SVG paths verbatim; rewrite component structure to match the codebase's conventions (App Router, Server Components where possible, Supabase server actions for mutations).

## Fidelity

**High-fidelity.** Final colors, typography, spacing, and interaction patterns. Recreate pixel-perfect.

---

## Stack mapping

| Prototype concept | Target in `health-dashboard` |
|---|---|
| Single-page React-via-Babel app | Next.js App Router routes under `app/(dashboard)/` |
| `localStorage` for persistence | Supabase tables + server actions |
| Mock data in `data.jsx` | Replace with Supabase queries (server components) |
| Inline JSX components | `.tsx` files under `_components/` co-located with route |
| CSS variables in `styles.css` | Tailwind v4 `@theme` block in `app/globals.css` |
| `window.claude.complete` AI suggestions | Existing AI/agent path in repo, OR drop |

---

## Screens / Views

The prototype has 5 top-level screens, navigated via a bottom tab bar (Today / Train / Progress / Profile + Auth gate).

### 1. Today (`screens-today.jsx`)
Daily dashboard. Already largely covered by `app/(dashboard)/dashboard/page.tsx` — port the visual style only.

- **Layout**: vertical scroll, single column, ~16px outer padding, 14px gap between tiles.
- **Components**:
  - **Greeting header** — Instrument Serif, 44px, `var(--ink)`, "Good morning, Terry" pattern
  - **Today's workout tile** — primary CTA, name + duration estimate + "Start" button
  - **Week strip** — 7 day pills, today is filled `var(--accent)` (#b84a2e), past days have a moss check
  - **Recent workouts list** — port `RecentWorkoutsCard.tsx` with new tile styling

### 2. Train (`screens-train.jsx`)
**This is the new flow.** Two paths:
- **"Today's plan"** — start the prescribed workout
- **"Build your own"** — opens muscle-selection builder

Layout: two large tiles stacked, each ~120px tall with serif title + meta line.

### 3. Builder (`builder.jsx`) — **NEW, the headline feature**

Three sub-states:

**State A: Muscle picker**
- Body diagram (front/back toggle) takes top half of viewport
- Selected muscles highlight in `var(--accent)` (terracotta)
- Below: 5 preset chips — Push / Pull / Legs / Upper / Core (one-tap fills selection)
- Bottom: live preview — "X muscles selected · ~Y min · Z exercises"
- Disabled "Continue" until ≥1 muscle selected

**State B: Plan review**
- List of 3–6 exercises generated from selection
- Each row: name, sets × reps, primary muscle pills
- Tap a row → expand to edit sets/reps/weight inline (bumpers + numeric input)
- "Replace" button per exercise → swap with another from library
- Bottom: "Start workout" CTA

**State C: Difficulty + start**
- Three pills: Beginner / Intermediate / Advanced (modulates reps and rest)
- Estimated duration recalculates live
- "Begin" → hands off to existing `WorkoutTracker.tsx`

The selection-to-plan algorithm lives in `builder.jsx` `buildPlan()` — port verbatim. It scores each candidate exercise by `(primary muscles in selection) + 0.5 × (secondary in selection)`, dedupes by name, then greedily covers all selected groups before topping up to 4–5 total.

### 4. Progress (`screens-progress.jsx`)
- Three-series chart: weight / body fat % / lean mass over 90 days
- Each series normalizes to its own min/max (since they live on different scales)
- Hover/drag shows exact values in summary row
- Below chart: PR list, body comp deltas
- Port: replace `BodyCompChart.tsx` chart logic with this normalization approach

### 5. Profile (`screens-today.jsx` profile section)
- Body type toggle (male / female)
- Medications list (add/remove inline; not just Zepbound)
- Connected integrations (link to existing settings page)
- SSO providers (Google / Microsoft / Apple) — visual only; Supabase auth already handles

### 6. Auth (`screens-auth.jsx`)
- SSO-first: Google, Microsoft, Apple buttons
- Email fallback below
- Free tier messaging
- **Use existing Supabase Auth UI** — apply prototype's button + tile styling only

---

## Body component (`body.jsx`) — port priority #1

Anatomical SVG with individual muscle paths. **Copy the SVG path data verbatim** into a new `app/(dashboard)/dashboard/_components/Body.tsx`.

### Props
```ts
interface BodyProps {
  primary?: MuscleGroup[];        // filled at full accent
  secondary?: MuscleGroup[];      // filled at soft accent
  view?: 'front' | 'back';        // default 'front'
  size?: number;                  // width in px, default 220
  onMuscleClick?: (g: MuscleGroup) => void;
  theme?: 'light' | 'dark';
}

type MuscleGroup =
  | 'chest' | 'back' | 'lats' | 'shoulders' | 'traps'
  | 'biceps' | 'triceps' | 'forearms'
  | 'abs' | 'obliques'
  | 'quads' | 'hamstrings' | 'glutes' | 'calves';
```

### Structure
- ViewBox `0 0 1000 2500` (aspect 0.40)
- Layers, bottom up:
  1. Outline silhouette path filled with radial gradient `bodyVignette`
  2. Top-light highlight overlay (linear gradient)
  3. Individual muscle paths (`MUSCLES_FRONT` / `MUSCLES_BACK` arrays in `body.jsx`) — fill conditionally based on primary/secondary props
  4. Outline re-stroke on top
  5. Invisible hit-zone polygons (`HIT_ZONES`) for reliable click detection — these are wider than the muscle paths so taps land easily

### Implementation notes
- The muscle paths and hit zones are tuned to the same coordinate space — don't shift them
- `theme="dark"` inverts the silhouette filter — keep the existing color logic
- The `wa-sex-changed` window event is for the prototype only; in the real app, get sex from the user's profile via Supabase

---

## Interactions & behavior

- **Tap a muscle** → toggle inclusion in selection (persist in URL state or component state, NOT localStorage — server state lives in Supabase)
- **Tap a preset** → set selection to that preset's muscle list (replaces, doesn't add)
- **View toggle** → instant flip between front and back, selection persists
- **Plan generation** → runs synchronously from `buildPlan()` whenever selection changes; show in "Continue" pre-state as live count
- **Set/rep edit in plan review** → optimistic local update; commit to Supabase only on "Start workout"
- **Hand-off to existing WorkoutTracker** → pass plan as initialExercises prop or via route state

### Animations
- Muscle highlight transition: `fill 220ms ease, fill-opacity 220ms ease, stroke 220ms ease`
- Tile fade-in on screen mount: `220ms cubic-bezier(.2,.7,.2,1)` (see `.fade-in` in styles.css)
- All button presses: `160ms cubic-bezier(.2,.7,.2,1)`

---

## State management

For the builder flow:

```ts
type BuilderState = {
  step: 'select' | 'review' | 'difficulty';
  view: 'front' | 'back';
  selected: MuscleGroup[];
  plan: PlannedExercise[];           // generated from selected
  edits: Record<string, Partial<PlannedExercise>>;  // user overrides
  difficulty: 'beginner' | 'intermediate' | 'advanced';
};
```

Store in `useState` within a client component (`'use client'`). Only persist to Supabase at "Start workout" — write a row to `workouts` and `workout_exercises`, then `redirect()` to the existing tracker route.

---

## Design tokens

Add these to `app/globals.css` inside Tailwind v4's `@theme` block. The current `globals.css` is only 961 bytes — likely default boilerplate, safe to replace.

```css
@theme {
  /* Cream paper palette */
  --color-bg: #f4f1ec;
  --color-bg-raised: #ffffff;
  --color-bg-sunk: #ece8e1;

  /* Ink hierarchy (4 stops) */
  --color-ink: #16140f;
  --color-ink-2: #3a3630;
  --color-ink-3: #6e6960;
  --color-ink-4: #9c968b;

  /* Lines */
  --color-line: #e0dbd0;
  --color-line-2: #cfc9bc;

  /* Accents */
  --color-accent: #b84a2e;        /* terracotta — sparingly */
  --color-accent-soft: #f1d9cf;
  --color-moss: #4a6a4d;          /* completed/positive */
  --color-moss-soft: #e0e8dd;
  --color-slate: #2f3a47;
  --color-slate-soft: #dde1e6;

  /* Type */
  --font-sans: 'Geist', system-ui, sans-serif;
  --font-mono: 'Geist Mono', ui-monospace, monospace;
  --font-display: 'Instrument Serif', serif;

  /* Radii */
  --radius-tile: 14px;
  --radius-pill: 999px;
  --radius-btn: 10px;
}

/* Dark mode */
[data-theme="dark"] {
  --color-bg: #14130f;
  --color-bg-raised: #1c1b16;
  --color-bg-sunk: #100f0c;
  --color-ink: #f3efe6;
  --color-ink-2: #d4cfc1;
  --color-ink-3: #8d8779;
  --color-ink-4: #5b564b;
  --color-line: #2a2823;
  --color-line-2: #3a3730;
  --color-accent-soft: #3a2118;
  --color-moss-soft: #1f2920;
  --color-slate-soft: #1d242c;
}
```

### Type scale (matches `styles.css`)

| Token | Family | Size | Weight | Letter-spacing | Use |
|---|---|---|---|---|---|
| `t-eyebrow` | Geist | 10px | 500 | 0.14em | Section label, uppercase |
| `t-title-xl` | Instrument Serif | 44px | 400 | -0.02em | Page hero |
| `t-title-lg` | Geist | 26px | 500 | -0.02em | Card title |
| `t-title` | Geist | 19px | 500 | -0.01em | Tile title |
| `t-body` | Geist | 14px | 400 | 0 | Body copy, ink-2 |
| `t-meta` | Geist | 12px | 400 | 0 | Helper text, ink-3 |
| `t-num` | Geist Mono | inherit | 500 | tabular-nums | Numbers |
| `t-display-num` | Instrument Serif | varies | 400 | -0.03em | Stat hero numbers |

### Spacing & shape
- Tile padding: 16px
- Tile border-radius: 14px
- Tile border: 1px `var(--line)`
- Sunk tile (input wells): bg `var(--bg-sunk)`, padding 14px, radius 12px
- Button radius: 10px
- Pill radius: 999px (full)
- Outer screen padding: 16px
- Inter-tile gap: 14px

### Shadows
Mostly absent. The only shadow is on segmented-control active state: `0 1px 2px rgba(0,0,0,0.04)`. The design relies on borders, not elevation.

---

## Component library map

| Prototype class | Suggested target |
|---|---|
| `.tile`, `.tile-flat`, `.tile-sunk` | `<Tile>` component, variant prop |
| `.btn`, `.btn-primary`, `.btn-ghost`, `.btn-accent`, `.btn-block` | `<Button>` with variants |
| `.pill`, `.pill-accent`, `.pill-moss`, `.pill-slate` | `<Pill>` with tone prop |
| `.seg` | `<SegmentedControl>` |
| `.chip-row` + `.chip` | `<ChipRow>` + `<Chip>` |
| `.field` (numeric) | `<NumberField>` |
| `.row` (settings rows) | `<SettingsRow>` |
| `.stat`, `.stat-num` | `<StatBlock>` |

---

## Files in this bundle

```
design_handoff_workout_app/
├── README.md                    ← this file
├── prototype/
│   ├── Workout App.html        ← root HTML, open in browser to see it run
│   ├── styles.css              ← all CSS tokens & components
│   ├── app.jsx                 ← root + tab nav
│   ├── body.jsx                ← anatomical SVG body — port priority #1
│   ├── builder.jsx             ← muscle-select → plan algorithm
│   ├── data.jsx                ← mock workout data (replace with Supabase)
│   ├── chart.jsx               ← progress chart (3-series normalization)
│   ├── screens-today.jsx       ← Today + Profile screens
│   ├── screens-train.jsx       ← Train tab + builder host
│   ├── screens-progress.jsx    ← Progress + history
│   ├── screens-auth.jsx        ← SSO + email auth (visual only)
│   ├── tweaks-panel.jsx        ← dev-only tweaks UI; ignore for prod
│   ├── image-slot.js           ← drop-target placeholder; ignore for prod
│   └── silhouettes/            ← reference body line-art PNGs (not used by current Body)
└── Body.tsx                    ← TypeScript port of body.jsx, ready to drop in
```

---

## Suggested port order

1. **Drop in `Body.tsx`** at `app/(dashboard)/dashboard/_components/Body.tsx`. Verify it renders standalone in a Storybook or scratch page.
2. **Update `app/globals.css`** with the design tokens above. Confirm Tailwind utility classes resolve (e.g. `bg-accent`, `text-ink`).
3. **Build the `/dashboard/workout/builder` route** as a client component with the three-step flow.
4. **Port `buildPlan()` from `builder.jsx`** as a pure function in `app/(dashboard)/dashboard/workout/_lib/build-plan.ts`. Merge its `LIB` constant into the existing `exercise-library.ts`.
5. **Wire builder → existing `WorkoutTracker.tsx`** via a Supabase write + redirect.
6. **Restyle existing dashboard tiles** to match the new tile/pill/button system (tokens-only change, no structural rework).
7. **Add Profile medications CRUD** (Supabase table: `medications` with `user_id`, `name`, `dose`, `schedule`, `active`).
8. **Apply auth screen styling** to existing Supabase login.

---

## Notes & caveats

- The prototype uses `localStorage` for the body-type toggle and silhouette image slots. Discard both — body type comes from the user's Supabase profile; the silhouette is now a pure SVG and needs no slots.
- The `tweaks-panel.jsx` is a developer-only UI for the prototype. Don't port.
- The prototype's "AI workout suggestions" call `window.claude.complete` — replace with your existing AI path or remove.
- Free tier: prototype shows no paywall. Decide at port time whether all features stay free or add gating.
- The Body SVG is illustrative anatomy, not medical reference. If you want clinical accuracy, swap the muscle paths for a licensed anatomy SVG library (e.g. Anatomographer, Visible Body) — the hit-zone polygon coords would need re-tuning.
