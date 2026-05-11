-- ============================================================
-- User Approval Status
-- Run this in: Supabase Dashboard → SQL Editor → New query → Run
-- ============================================================

-- 1. Add status column — new users default to 'pending'
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'pending'
  CHECK (status IN ('pending', 'approved', 'rejected'));

-- 2. Approve all existing users (they were already in the system)
UPDATE public.profiles SET status = 'approved';

-- 3. Update the handle_new_user trigger to also set status = 'pending'
--    (the INSERT default handles this automatically, but making it explicit)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, status)
  VALUES (new.id, new.email, 'pending')
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$;
