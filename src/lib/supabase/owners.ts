import { createClient } from '@/lib/supabase/client';
import { toCamelCase } from '@/lib/api/casing';
import type { IOwner, IOwnerJob } from '@/models/owner.model';

export async function getOwners(): Promise<IOwner[]> {
  const supabase = createClient();

  // Fetch owners from cf_owners table
  const { data: ownersData, error: ownersError } = await supabase
    .from('cf_owners')
    .select('id, name, color, user_id')
    .order('name');

  if (!ownersData || ownersError) {
    throw new Error(ownersError?.message || 'Failed to fetch owners');
  }

  // Fetch jobs from cf_jobs table - only active jobs
  const { data: jobsData, error: jobsError } = await supabase
    .from('cf_jobs')
    .select('id, name, owner_id, location')
    .eq('active', true)
    .order('name');

  if (jobsError) {
    throw new Error(jobsError.message || 'Failed to fetch jobs');
  }

  // Convert to camelCase
  const owners: IOwner[] = toCamelCase(ownersData);
  const jobs: IOwnerJob[] = toCamelCase(jobsData || []);

  // Build the owner structure with jobs
  const ownersWithJobs = owners.map((owner) => ({
    ...owner,
    jobs: jobs.filter((job) => job.ownerId === owner.id),
  }));

  return ownersWithJobs;
}