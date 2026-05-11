-- ============================================================
-- Integration Requests
-- Run this in: Supabase Dashboard → SQL Editor → New query → Run
-- ============================================================

CREATE TABLE IF NOT EXISTS public.integration_requests (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid        REFERENCES auth.users(id) ON DELETE SET NULL,
  user_email   text,
  user_name    text,
  integration  text        NOT NULL,   -- e.g. "Fitbit", "Garmin"
  description  text,                   -- why they want it / use case
  status       text        NOT NULL DEFAULT 'pending'
                           CHECK (status IN ('pending', 'reviewed', 'planned', 'declined')),
  admin_note   text,                   -- optional note from admin
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ir_status_time ON public.integration_requests(status, created_at DESC);

ALTER TABLE public.integration_requests ENABLE ROW LEVEL SECURITY;

-- Block direct client access — all access via service role on the server
CREATE POLICY "integration_requests: no direct client access"
  ON public.integration_requests FOR ALL
  USING (false)
  WITH CHECK (false);
