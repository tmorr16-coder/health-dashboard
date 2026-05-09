-- ============================================================
-- Add distance_miles and effort to workout_sessions
-- ============================================================

alter table public.workout_sessions
  add column if not exists distance_miles decimal(6,2),
  add column if not exists effort text
    check (effort in ('easy', 'moderate', 'hard', 'allout'));

-- ============================================================
-- Meals table for nutrition tracking
-- ============================================================

create table if not exists public.meals (
  id           uuid        primary key default gen_random_uuid(),
  user_id      uuid        not null references public.profiles(id) on delete cascade,
  date         date        not null,
  meal_type    text        not null check (meal_type in ('breakfast', 'lunch', 'dinner', 'snack')),
  name         text        not null,
  calories_est integer,
  notes        text,
  is_favorite  boolean     not null default false,
  created_at   timestamptz not null default now()
);

create index if not exists meals_user_date on public.meals(user_id, date desc);

-- RLS
alter table public.meals enable row level security;

create policy "meals: own rows only"
  on public.meals for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());
