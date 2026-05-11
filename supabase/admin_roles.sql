-- ============================================================
-- Admin Roles & Invitations
-- Run this in: Supabase Dashboard → SQL Editor → New query → Run
-- ============================================================

-- 1. Add role column to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS role text NOT NULL DEFAULT 'standard'
  CHECK (role IN ('standard', 'admin'));

-- 2. Invitations table — tracks sent invites and their status
CREATE TABLE IF NOT EXISTS public.invitations (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  email       text        NOT NULL,
  role        text        NOT NULL DEFAULT 'standard' CHECK (role IN ('standard', 'admin')),
  invited_by  uuid        REFERENCES auth.users(id) ON DELETE SET NULL,
  invited_at  timestamptz NOT NULL DEFAULT now(),
  accepted_at timestamptz
);

ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;

-- Block direct client access — all access goes through service role on the server
CREATE POLICY "invitations: no direct client access"
  ON public.invitations FOR ALL
  USING (false)
  WITH CHECK (false);

-- 3. Set Terry Morris as the default admin
UPDATE public.profiles SET role = 'admin' WHERE email = 'tmorr16@gmail.com';
