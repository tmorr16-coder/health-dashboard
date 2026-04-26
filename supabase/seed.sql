-- =============================================================
-- DEV SEED — run ONCE in Supabase SQL Editor
-- Creates a hardcoded dev user and disables RLS so queries work
-- without a real auth session.
--
-- REMOVE BEFORE PRODUCTION:
--   1. Delete this file (or don't re-run it)
--   2. Re-enable RLS: ALTER TABLE <table> ENABLE ROW LEVEL SECURITY;
-- =============================================================


-- -------------------------------------------------------------
-- 1. Insert the dev user into auth.users
--    (Supabase's GoTrue table — we insert directly since we're
--    bypassing the normal sign-up flow)
-- -------------------------------------------------------------
insert into auth.users (
  id,
  instance_id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_app_meta_data,
  raw_user_meta_data
)
values (
  '00000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000000',
  'authenticated',
  'authenticated',
  'dev@localhost',
  '',           -- no password; we never actually log in
  now(),
  now(),
  now(),
  '{"provider":"email","providers":["email"]}',
  '{}'
)
on conflict (id) do nothing;


-- -------------------------------------------------------------
-- 2. Ensure the profiles row exists
--    The on_auth_user_created trigger fires on INSERT into auth.users,
--    so this is usually automatic — but the ON CONFLICT guard
--    makes this script safe to re-run.
-- -------------------------------------------------------------
insert into public.profiles (id, email)
values ('00000000-0000-0000-0000-000000000001', 'dev@localhost')
on conflict (id) do nothing;


-- -------------------------------------------------------------
-- 3. Disable RLS on all tables
--    This lets the anon/service key read and write every row
--    without needing auth.uid() to match anything.
--    Re-enable these before going to production.
-- -------------------------------------------------------------
alter table public.profiles              disable row level security;
alter table public.doses                 disable row level security;
alter table public.workout_sessions      disable row level security;
alter table public.exercises             disable row level security;
alter table public.sets                  disable row level security;
alter table public.apple_health_metrics  disable row level security;
alter table public.apple_health_workouts disable row level security;
