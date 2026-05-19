-- Scheduled workouts — planned sessions that appear on the train page
-- and can trigger reminders via hub.reminders.

create table if not exists public.scheduled_workouts (
  id             uuid         primary key default gen_random_uuid(),
  user_id        uuid         not null references public.profiles(id) on delete cascade,
  label          text         not null,
  scheduled_date date         not null,
  scheduled_time time         not null default '08:00',
  plan_encoded   text,          -- JSON-encoded exercise plan
  reminder_min   integer      not null default 15,
  completed      boolean      not null default false,
  created_at     timestamptz  not null default now()
);

create index if not exists sw_user_date on public.scheduled_workouts(user_id, scheduled_date);

alter table public.scheduled_workouts enable row level security;

create policy "scheduled_workouts: read own"
  on public.scheduled_workouts for select
  using (auth.uid() = user_id);

create policy "scheduled_workouts: insert own"
  on public.scheduled_workouts for insert
  with check (auth.uid() = user_id);

create policy "scheduled_workouts: update own"
  on public.scheduled_workouts for update
  using (auth.uid() = user_id);

create policy "scheduled_workouts: delete own"
  on public.scheduled_workouts for delete
  using (auth.uid() = user_id);
