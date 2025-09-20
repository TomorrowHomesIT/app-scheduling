-- Fix cf_job_tasks sequence to prevent duplicate key errors
-- This resets the sequence to the correct value based on existing data

-- Reset the cf_job_tasks_id_seq to the maximum existing ID + 1
-- This prevents duplicate key violations when inserting new job tasks
SELECT setval('"public"."cf_job_tasks_id_seq"', COALESCE((SELECT MAX(id) FROM "public"."cf_job_tasks"), 0) + 1, false);
