-- Usage logs for admin analytics / TCO dashboard
CREATE TABLE IF NOT EXISTS public.usage_logs (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type  text        NOT NULL,  -- 'chat', 'email', 'signup', 'oura_sync', 'withings_sync', 'apple_sync', 'support_ticket', 'integration_request'
  user_id     uuid        REFERENCES auth.users(id) ON DELETE SET NULL,
  metadata    jsonb       NOT NULL DEFAULT '{}',
  tokens_in   integer,
  tokens_out  integer,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ul_type_time ON public.usage_logs(event_type, created_at DESC);
CREATE INDEX IF NOT EXISTS ul_created   ON public.usage_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS ul_user      ON public.usage_logs(user_id, created_at DESC);

ALTER TABLE public.usage_logs ENABLE ROW LEVEL SECURITY;

-- No direct client access — all writes go through server-side admin client
CREATE POLICY "usage_logs: no direct client access"
  ON public.usage_logs FOR ALL
  USING (false)
  WITH CHECK (false);
