

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE TYPE "public"."cf_task_progress" AS ENUM (
    'none',
    'to_call',
    'called',
    'confirmed',
    'started',
    'completed',
    'not_required'
);


ALTER TYPE "public"."cf_task_progress" OWNER TO "postgres";


CREATE TYPE "public"."cf_task_status" AS ENUM (
    'none',
    'scheduled',
    'rescheduled',
    'cancelled'
);


ALTER TYPE "public"."cf_task_status" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_updated_at_column"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
begin
  new.updated_at = now();
  return new;
end;
$$;


ALTER FUNCTION "public"."update_updated_at_column"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."cf_job_tasks" (
    "id" bigint NOT NULL,
    "job_id" bigint NOT NULL,
    "name" "text" NOT NULL,
    "supplier_id" bigint,
    "cost_center" "text",
    "progress" "public"."cf_task_progress" DEFAULT 'none'::"public"."cf_task_progress" NOT NULL,
    "status" "public"."cf_task_status" DEFAULT 'none'::"public"."cf_task_status" NOT NULL,
    "task_stage_id" bigint,
    "notes" "text",
    "start_date" timestamp with time zone,
    "purchase_order_links" "jsonb",
    "plan_links" "jsonb",
    "order" integer DEFAULT 0 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "doc_tags" "jsonb"
);


ALTER TABLE "public"."cf_job_tasks" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."cf_jobs" (
    "id" bigint NOT NULL,
    "name" "text" NOT NULL,
    "owner_id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "location" "text",
    "google_drive_dir_id" "text",
    "active" boolean DEFAULT true NOT NULL
);


ALTER TABLE "public"."cf_jobs" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."cf_jobs_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."cf_jobs_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."cf_jobs_id_seq" OWNED BY "public"."cf_jobs"."id";



CREATE TABLE IF NOT EXISTS "public"."cf_owners" (
    "id" bigint NOT NULL,
    "name" "text" NOT NULL,
    "user_id" "uuid",
    "color" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."cf_owners" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."cf_owners_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."cf_owners_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."cf_owners_id_seq" OWNED BY "public"."cf_owners"."id";



CREATE TABLE IF NOT EXISTS "public"."cf_task_stages" (
    "id" bigint NOT NULL,
    "name" "text" NOT NULL,
    "order" integer DEFAULT 0 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."cf_task_stages" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."cf_task_stages_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."cf_task_stages_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."cf_task_stages_id_seq" OWNED BY "public"."cf_task_stages"."id";



CREATE TABLE IF NOT EXISTS "public"."cf_tasks" (
    "id" bigint NOT NULL,
    "name" "text" NOT NULL,
    "task_stage_id" bigint,
    "doc_tags" "jsonb",
    "cost_center" double precision,
    "order" integer DEFAULT 0 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."cf_tasks" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."cf_tasks_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."cf_tasks_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."cf_tasks_id_seq" OWNED BY "public"."cf_job_tasks"."id";



CREATE SEQUENCE IF NOT EXISTS "public"."cf_tasks_id_seq1"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."cf_tasks_id_seq1" OWNER TO "postgres";


ALTER SEQUENCE "public"."cf_tasks_id_seq1" OWNED BY "public"."cf_tasks"."id";



CREATE TABLE IF NOT EXISTS "public"."suppliers" (
    "id" bigint NOT NULL,
    "name" "text" NOT NULL,
    "email" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "secondary_email" "text",
    "active" boolean DEFAULT true NOT NULL
);


ALTER TABLE "public"."suppliers" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."suppliers_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."suppliers_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."suppliers_id_seq" OWNED BY "public"."suppliers"."id";



ALTER TABLE ONLY "public"."cf_job_tasks" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."cf_tasks_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."cf_jobs" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."cf_jobs_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."cf_owners" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."cf_owners_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."cf_task_stages" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."cf_task_stages_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."cf_tasks" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."cf_tasks_id_seq1"'::"regclass");



ALTER TABLE ONLY "public"."suppliers" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."suppliers_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."cf_jobs"
    ADD CONSTRAINT "cf_jobs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."cf_owners"
    ADD CONSTRAINT "cf_owners_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."cf_task_stages"
    ADD CONSTRAINT "cf_task_stages_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."cf_job_tasks"
    ADD CONSTRAINT "cf_tasks_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."cf_tasks"
    ADD CONSTRAINT "cf_tasks_pkey1" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."suppliers"
    ADD CONSTRAINT "suppliers_pkey" PRIMARY KEY ("id");



CREATE OR REPLACE TRIGGER "update_cf_jobs_updated_at" BEFORE UPDATE ON "public"."cf_jobs" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_cf_owners_updated_at" BEFORE UPDATE ON "public"."cf_owners" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_cf_task_stages_updated_at" BEFORE UPDATE ON "public"."cf_task_stages" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_cf_tasks_updated_at" BEFORE UPDATE ON "public"."cf_job_tasks" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_cf_tasks_updated_at" BEFORE UPDATE ON "public"."cf_tasks" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



ALTER TABLE ONLY "public"."cf_job_tasks"
    ADD CONSTRAINT "cf_job_tasks_task_stage_id_fkey" FOREIGN KEY ("task_stage_id") REFERENCES "public"."cf_task_stages"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."cf_jobs"
    ADD CONSTRAINT "cf_jobs_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "public"."cf_owners"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."cf_owners"
    ADD CONSTRAINT "cf_owners_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."cf_job_tasks"
    ADD CONSTRAINT "cf_tasks_job_id_fkey" FOREIGN KEY ("job_id") REFERENCES "public"."cf_jobs"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."cf_job_tasks"
    ADD CONSTRAINT "cf_tasks_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "public"."suppliers"("id");



ALTER TABLE ONLY "public"."cf_tasks"
    ADD CONSTRAINT "cf_tasks_task_stage_id_fkey" FOREIGN KEY ("task_stage_id") REFERENCES "public"."cf_task_stages"("id") ON DELETE SET NULL;



CREATE POLICY "Allow UPDATE for selected users" ON "public"."cf_job_tasks" FOR UPDATE TO "authenticated", "service_role", "supabase_admin" USING (true) WITH CHECK (true);



CREATE POLICY "Enable insert for authenticated users only" ON "public"."cf_job_tasks" FOR INSERT TO "authenticated" WITH CHECK (true);



CREATE POLICY "Enable insert for authenticated users only" ON "public"."cf_jobs" FOR INSERT TO "authenticated" WITH CHECK (true);



CREATE POLICY "Enable read access for all users" ON "public"."cf_jobs" FOR SELECT TO "authenticated", "service_role", "supabase_admin" USING (true);



CREATE POLICY "Enable read access for all users" ON "public"."cf_owners" FOR SELECT TO "authenticated", "service_role", "supabase_admin" USING (true);



CREATE POLICY "Enable read access for select roles" ON "public"."cf_task_stages" FOR SELECT TO "authenticated", "service_role", "supabase_admin" USING (true);



CREATE POLICY "Enable read access for select roles" ON "public"."cf_tasks" FOR SELECT TO "authenticated", "service_role", "supabase_admin" USING (true);



CREATE POLICY "Enable read access for select users" ON "public"."suppliers" FOR SELECT TO "authenticated", "service_role", "supabase_admin" USING (true);



CREATE POLICY "Enable read access for selected users" ON "public"."cf_job_tasks" FOR SELECT TO "authenticated", "service_role", "supabase_admin" USING (true);



CREATE POLICY "Enable update for selected users only" ON "public"."cf_jobs" FOR UPDATE TO "authenticated", "service_role", "supabase_admin" USING (true) WITH CHECK (true);



ALTER TABLE "public"."cf_job_tasks" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."cf_jobs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."cf_owners" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."cf_task_stages" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."cf_tasks" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."suppliers" ENABLE ROW LEVEL SECURITY;




ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";


GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";

























































































































































GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "service_role";


















GRANT ALL ON TABLE "public"."cf_job_tasks" TO "anon";
GRANT ALL ON TABLE "public"."cf_job_tasks" TO "authenticated";
GRANT ALL ON TABLE "public"."cf_job_tasks" TO "service_role";



GRANT ALL ON TABLE "public"."cf_jobs" TO "anon";
GRANT ALL ON TABLE "public"."cf_jobs" TO "authenticated";
GRANT ALL ON TABLE "public"."cf_jobs" TO "service_role";



GRANT ALL ON SEQUENCE "public"."cf_jobs_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."cf_jobs_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."cf_jobs_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."cf_owners" TO "anon";
GRANT ALL ON TABLE "public"."cf_owners" TO "authenticated";
GRANT ALL ON TABLE "public"."cf_owners" TO "service_role";



GRANT ALL ON SEQUENCE "public"."cf_owners_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."cf_owners_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."cf_owners_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."cf_task_stages" TO "anon";
GRANT ALL ON TABLE "public"."cf_task_stages" TO "authenticated";
GRANT ALL ON TABLE "public"."cf_task_stages" TO "service_role";



GRANT ALL ON SEQUENCE "public"."cf_task_stages_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."cf_task_stages_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."cf_task_stages_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."cf_tasks" TO "anon";
GRANT ALL ON TABLE "public"."cf_tasks" TO "authenticated";
GRANT ALL ON TABLE "public"."cf_tasks" TO "service_role";



GRANT ALL ON SEQUENCE "public"."cf_tasks_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."cf_tasks_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."cf_tasks_id_seq" TO "service_role";



GRANT ALL ON SEQUENCE "public"."cf_tasks_id_seq1" TO "anon";
GRANT ALL ON SEQUENCE "public"."cf_tasks_id_seq1" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."cf_tasks_id_seq1" TO "service_role";



GRANT ALL ON TABLE "public"."suppliers" TO "anon";
GRANT ALL ON TABLE "public"."suppliers" TO "authenticated";
GRANT ALL ON TABLE "public"."suppliers" TO "service_role";



GRANT ALL ON SEQUENCE "public"."suppliers_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."suppliers_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."suppliers_id_seq" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";






























RESET ALL;
