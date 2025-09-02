import { createClient } from "@/lib/supabase/server";
import { toCamelCase } from "@/lib/api/casing";
import type { IOwner, IOwnerJob } from "@/models/owner.model";

export async function GET() {
  const supabase = await createClient();

  // Fetch owners from cf_owners table
  const { data: ownersData, error: ownersError } = await supabase
    .from("cf_owners")
    .select("id, name, color, user_id")
    .order("name");

  if (!ownersData || ownersError) {
    return Response.json({ error: ownersError }, { status: 500 });
  }

  // Fetch jobs from ck_jobs table
  const { data: jobsData, error: jobsError } = await supabase
    .from("cf_jobs")
    .select("id, name, owner_id")
    .order("name");

  if (jobsError) {
    return Response.json({ error: jobsError }, { status: 500 });
  }

  // Convert to camelCase
  const owners: IOwner[] = toCamelCase(ownersData);
  const jobs: IOwnerJob[] = toCamelCase(jobsData || []);

  // Build the owner structure with jobs
  const ownersWithJobs = owners.map((owner) => ({
    ...owner,
    jobs: jobs.filter((job) => job.ownerId === owner.id),
  }));

  return Response.json(ownersWithJobs, { status: 200 });
}
