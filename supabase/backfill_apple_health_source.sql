-- One-time backfill: tag legacy Apple Health export rows with source='apple_health'.
--
-- The webhook used to save the raw device source ("Terry's iPhone",
-- "Terry's Apple Watch", "Oura", etc). The fix saves source='apple_health'
-- going forward; this migration cleans up the existing rows.
--
-- The unique index (user_id, timestamp, metric_name, source) means we must
-- collapse duplicates BEFORE renaming the source, or the UPDATE will throw.

-- Step 1: Remove rows whose (user_id, timestamp, metric_name) already has
-- a canonical source='apple_health' row. Their data is redundant.
DELETE FROM public.apple_health_metrics a
USING public.apple_health_metrics b
WHERE a.user_id     = b.user_id
  AND a.timestamp   = b.timestamp
  AND a.metric_name = b.metric_name
  AND a.id          <> b.id
  AND b.source      = 'apple_health'
  AND a.source NOT IN ('oura', 'withings', 'apple_health');

-- Step 2: Within the to-be-remapped rows, keep only the lowest-id row per
-- (user_id, timestamp, metric_name) to avoid UNIQUE violations on UPDATE.
DELETE FROM public.apple_health_metrics
WHERE id IN (
  SELECT id FROM (
    SELECT id,
           ROW_NUMBER() OVER (
             PARTITION BY user_id, timestamp, metric_name
             ORDER BY id
           ) AS rn
    FROM public.apple_health_metrics
    WHERE source NOT IN ('oura', 'withings', 'apple_health')
  ) ranked
  WHERE rn > 1
);

-- Step 3: Re-tag every surviving row as source='apple_health'.
UPDATE public.apple_health_metrics
SET source = 'apple_health'
WHERE source NOT IN ('oura', 'withings', 'apple_health');

-- Sanity check
SELECT source, COUNT(*) FROM public.apple_health_metrics GROUP BY source ORDER BY 2 DESC;
