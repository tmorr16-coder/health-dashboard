-- ============================================================
-- Health Dashboard — Full Schema
-- Paste this entire file into: Supabase Dashboard → SQL Editor → New query → Run
-- ============================================================


-- ============================================================
-- 1. PROFILES
-- Supabase manages the actual login in a hidden "auth.users" table.
-- We create our own "profiles" table in the public schema that mirrors it.
-- A trigger (section 6) auto-creates a profile the first time you sign in.
-- ============================================================

create table if not exists public.profiles (
  id           uuid        primary key references auth.users(id) on delete cascade,
  email        text,
  full_name    text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

comment on table public.profiles is 'One row per authenticated user.';


-- ============================================================
-- 2. DOSES  (Zepbound tracking)
-- One row per weekly injection.
-- ============================================================

create table if not exists public.doses (
  id              uuid        primary key default gen_random_uuid(),
  user_id         uuid        not null references public.profiles(id) on delete cascade,
  date            date        not null,
  dose_mg         numeric(5,2) not null,
  injection_site  text,                    -- e.g. "Left abdomen", "Right thigh"
  notes           text,
  created_at      timestamptz not null default now()
);

create index if not exists doses_user_date on public.doses(user_id, date desc);

comment on table public.doses is 'Weekly Zepbound injection log.';


-- ============================================================
-- 3. WORKOUT SESSIONS
-- One row per gym visit / run / bike ride / sauna session.
-- ============================================================

create table if not exists public.workout_sessions (
  id           uuid        primary key default gen_random_uuid(),
  user_id      uuid        not null references public.profiles(id) on delete cascade,
  date         date        not null,
  type         text        not null,   -- 'resistance' | 'running' | 'biking' | 'sauna' | 'other'
  duration_min integer,
  notes        text,
  created_at   timestamptz not null default now()
);

create index if not exists sessions_user_date on public.workout_sessions(user_id, date desc);

comment on table public.workout_sessions is 'One row per workout or activity.';


-- ============================================================
-- 4. EXERCISES
-- Each exercise belongs to a session.
-- order_index lets you record the order exercises were done.
-- user_id is duplicated here so RLS can be a simple equality check.
-- ============================================================

create table if not exists public.exercises (
  id           uuid        primary key default gen_random_uuid(),
  session_id   uuid        not null references public.workout_sessions(id) on delete cascade,
  user_id      uuid        not null references public.profiles(id) on delete cascade,
  name         text        not null,      -- e.g. "Back Squat"
  order_index  integer     not null default 0,
  muscles      text[],                    -- e.g. ARRAY['Quads','Glutes']
  created_at   timestamptz not null default now()
);

create index if not exists exercises_session on public.exercises(session_id);

comment on table public.exercises is 'Exercises within a workout session.';


-- ============================================================
-- 5. SETS
-- Individual sets within an exercise (reps, weight, RPE).
-- user_id duplicated for fast RLS checks.
-- ============================================================

create table if not exists public.sets (
  id             uuid         primary key default gen_random_uuid(),
  exercise_id    uuid         not null references public.exercises(id) on delete cascade,
  user_id        uuid         not null references public.profiles(id) on delete cascade,
  set_number     integer      not null,
  reps_actual    integer,
  weight_actual  numeric(7,2),            -- in lbs
  rpe            numeric(3,1),            -- 1–10 scale (allows 7.5, 8.5, etc.)
  notes          text,
  created_at     timestamptz  not null default now()
);

create index if not exists sets_exercise on public.sets(exercise_id);

comment on table public.sets is 'Individual sets: reps, weight, effort (RPE).';


-- ============================================================
-- 6. APPLE HEALTH METRICS  (time-series, generic)
-- Designed to receive Health Auto Export webhook payloads.
-- One row per data point: heart rate sample, weight reading, HRV, steps, etc.
-- metric_name uses snake_case: 'heart_rate', 'hrv', 'weight', 'steps', 'spo2', etc.
-- ============================================================

create table if not exists public.apple_health_metrics (
  id           uuid         primary key default gen_random_uuid(),
  user_id      uuid         not null references public.profiles(id) on delete cascade,
  timestamp    timestamptz  not null,
  metric_name  text         not null,
  value        numeric      not null,
  unit         text         not null,     -- 'bpm', 'ms', 'lbs', '%', 'count', 'kcal'
  source       text         not null default 'unknown',   -- 'apple_watch', 'iphone', 'withings', 'oura'
  created_at   timestamptz  not null default now()
);

-- Composite index for the most common query: "give me all HRV readings for the last 30 days"
create index if not exists ahm_user_metric_time
  on public.apple_health_metrics(user_id, metric_name, timestamp desc);

-- Prevent duplicate webhook replays
create unique index if not exists ahm_dedup
  on public.apple_health_metrics(user_id, timestamp, metric_name, source);

comment on table public.apple_health_metrics is
  'Generic time-series for Health Auto Export — HRV, steps, weight, heart rate, etc.';


-- ============================================================
-- 7. APPLE HEALTH WORKOUTS  (from Health Auto Export)
-- Distinct from manual workout_sessions — these come automatically from Apple Health.
-- raw_data stores the full webhook payload for anything we haven't explicitly modelled.
-- ============================================================

create table if not exists public.apple_health_workouts (
  id            uuid         primary key default gen_random_uuid(),
  user_id       uuid         not null references public.profiles(id) on delete cascade,
  timestamp     timestamptz  not null,
  workout_type  text         not null,    -- e.g. 'Running', 'Cycling', 'FunctionalStrengthTraining'
  duration_sec  numeric,                  -- seconds (precise; convert to minutes in the app)
  distance_m    numeric,                  -- meters (convert to miles/km in the app)
  calories      numeric,
  source        text,
  raw_data      jsonb,                    -- full payload, future-proof
  created_at    timestamptz  not null default now()
);

create index if not exists ahw_user_time on public.apple_health_workouts(user_id, timestamp desc);

comment on table public.apple_health_workouts is
  'Workouts synced automatically from Apple Health via Health Auto Export.';


-- ============================================================
-- 8. TRIGGER — auto-create profile on first sign-in
-- When Supabase creates a row in auth.users, this immediately
-- creates the matching row in public.profiles.
-- ============================================================

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();


-- ============================================================
-- 9. ROW LEVEL SECURITY (RLS)
-- This is the lock on the database. Even if someone discovers your
-- Supabase URL and anon key, they can only ever read/write their own rows.
-- ============================================================

-- Enable RLS on every table
alter table public.profiles             enable row level security;
alter table public.doses                enable row level security;
alter table public.workout_sessions     enable row level security;
alter table public.exercises            enable row level security;
alter table public.sets                 enable row level security;
alter table public.apple_health_metrics enable row level security;
alter table public.apple_health_workouts enable row level security;


-- profiles: you can only see and edit your own profile
create policy "profiles: own row only"
  on public.profiles for all
  using  (auth.uid() = id)
  with check (auth.uid() = id);

-- doses: only your own rows
create policy "doses: own rows only"
  on public.doses for all
  using  (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- workout_sessions: only your own rows
create policy "workout_sessions: own rows only"
  on public.workout_sessions for all
  using  (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- exercises: only your own rows
create policy "exercises: own rows only"
  on public.exercises for all
  using  (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- sets: only your own rows
create policy "sets: own rows only"
  on public.sets for all
  using  (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- apple_health_metrics: only your own rows
create policy "apple_health_metrics: own rows only"
  on public.apple_health_metrics for all
  using  (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- apple_health_workouts: only your own rows
create policy "apple_health_workouts: own rows only"
  on public.apple_health_workouts for all
  using  (auth.uid() = user_id)
  with check (auth.uid() = user_id);


-- ============================================================
-- Done. You should see 7 new tables in the Table Editor.
-- ============================================================
