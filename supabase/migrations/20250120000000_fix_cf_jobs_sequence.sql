-- Fix cf_jobs sequence to prevent duplicate key errors
-- This resets the sequence to the correct value based on existing data

-- Reset the cf_jobs_id_seq to the maximum existing ID + 1
-- This prevents duplicate key violations when inserting new jobs
SELECT setval('"public"."cf_jobs_id_seq"', COALESCE((SELECT MAX(id) FROM "public"."cf_jobs"), 0) + 1, false);
