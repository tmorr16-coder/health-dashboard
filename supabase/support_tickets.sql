-- ============================================================
-- Support Tickets
-- Run this in: Supabase Dashboard → SQL Editor → New query → Run
-- ============================================================

CREATE TABLE IF NOT EXISTS public.support_tickets (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid        REFERENCES auth.users(id) ON DELETE SET NULL,
  user_email   text,
  user_name    text,
  type         text        NOT NULL DEFAULT 'question'
                           CHECK (type IN ('bug', 'feature', 'question', 'other')),
  subject      text        NOT NULL,
  description  text        NOT NULL,
  status       text        NOT NULL DEFAULT 'open'
                           CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
  admin_note   text,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS st_status_time ON public.support_tickets(status, created_at DESC);

ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;

-- Block direct client access — all access via service role on the server
CREATE POLICY "support_tickets: no direct client access"
  ON public.support_tickets FOR ALL
  USING (false)
  WITH CHECK (false);
