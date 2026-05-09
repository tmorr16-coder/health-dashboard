-- ============================================================
-- Medications table
-- Run this in: Supabase Dashboard → SQL Editor → New query → Run
-- ============================================================

create table if not exists public.medications (
  id          uuid         primary key default gen_random_uuid(),
  user_id     uuid         not null references public.profiles(id) on delete cascade,
  name        text         not null,
  dose        text         not null,
  schedule    text         not null default 'Daily · AM',
  active      boolean      not null default true,
  created_at  timestamptz  not null default now()
);

create index if not exists medications_user
  on public.medications(user_id, active, created_at);

comment on table public.medications is
  'User medication list — name, dose, schedule. active=false soft-deletes a row.';

-- RLS (matches the pattern used by other tables in schema.sql)
alter table public.medications enable row level security;

create policy "medications: own rows only"
  on public.medications for all
  using  (auth.uid() = user_id)
  with check (auth.uid() = user_id);
