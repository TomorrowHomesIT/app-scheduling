-- Fix sequence ownership for cf_job_tasks table
-- The issue is that cf_job_tasks is using cf_tasks_id_seq which conflicts with cf_tasks table

-- Create a new sequence specifically for cf_job_tasks
CREATE SEQUENCE IF NOT EXISTS "public"."cf_job_tasks_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

-- Set ownership of the new sequence to cf_job_tasks.id
ALTER SEQUENCE "public"."cf_job_tasks_id_seq" OWNED BY "public"."cf_job_tasks"."id";

-- Update cf_job_tasks.id to use the new sequence
ALTER TABLE ONLY "public"."cf_job_tasks" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."cf_job_tasks_id_seq"'::"regclass");

-- Remove the old sequence ownership from cf_job_tasks
-- (cf_tasks_id_seq should only be owned by cf_tasks table)
ALTER SEQUENCE "public"."cf_tasks_id_seq" OWNED BY "public"."cf_tasks"."id";
