-- ============================================================
-- Withings OAuth Tokens
-- Run in: Supabase Dashboard → SQL Editor → New query → Run
-- ============================================================

create table if not exists public.withings_tokens (
  user_id       uuid        primary key references public.profiles(id) on delete cascade,
  access_token  text        not null,
  refresh_token text        not null,
  expires_at    timestamptz not null,
  scope         text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

comment on table public.withings_tokens is
  'OAuth tokens for Withings API. user_id is the PK — one Withings account per user.';

alter table public.withings_tokens enable row level security;

create policy "withings_tokens: own row only"
  on public.withings_tokens for all
  using  (auth.uid() = user_id)
  with check (auth.uid() = user_id);
