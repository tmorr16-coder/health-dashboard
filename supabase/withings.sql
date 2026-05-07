-- ============================================================
-- Withings OAuth tokens
-- Run this in Supabase SQL Editor (Dashboard → SQL Editor → New query)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.withings_tokens (
  id            uuid         PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid         NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  access_token  text         NOT NULL,
  refresh_token text         NOT NULL,
  expires_at    timestamptz  NOT NULL,
  scope         text,
  created_at    timestamptz  NOT NULL DEFAULT now(),
  updated_at    timestamptz  NOT NULL DEFAULT now(),
  UNIQUE (user_id)
);

ALTER TABLE public.withings_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "withings_tokens: own rows only"
  ON public.withings_tokens FOR ALL
  USING (user_id = auth.uid());

COMMENT ON TABLE public.withings_tokens IS
  'Withings OAuth2 tokens — one row per user, upserted on each connect/refresh.';
