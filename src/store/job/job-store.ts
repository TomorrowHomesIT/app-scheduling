import { create } from "zustand";
import type { IJob, IJobTask } from "@/models/job.model";
import { toast } from "@/store/toast-store";
import { getApiErrorMessage } from "@/lib/api/error";
import { jobsDB } from "@/lib/jobs-db";
import api from "@/lib/api/api";
import offlineQueue from "@/lib/offline-queue";
import { useAuth } from "@/components/auth/auth-context";

interface JobStore {
  currentJob: IJob | null;

  fetchUserJobsFromApi: () => Promise<IJob[]>;
  loadJob: (id: number) => Promise<void>;
  setCurrentJob: (job: IJob | null) => void;
  updateJobTask: (jobId: number, taskId: number, updates: Partial<IJobTask>) => Promise<void>;
  refreshJob: (jobId: number) => Promise<void>;
  syncAndRefreshJob: (jobId: number) => Promise<void>;
}

const fetchJobByIdFromApi = async (id: number): Promise<IJob | null> => {
  try {
    const response = await api.get(`/jobs/${id}`);
    const job: IJob = response.data;
    return job;
  } catch (error) {
    console.error("Error fetching job:", error);
    throw error;
  }
};

const useJobStore = create<JobStore>((set, get) => ({
  userJobs: [],
  currentJob: null,

  fetchUserJobsFromApi: async (): Promise<IJob[]> => {
    try {
      const response = await api.get(`/user/jobs`);
      const job: IJob[] = response.data;
      return job;
    } catch (error) {
      console.error("Error fetching user jobs:", error);
      throw error;
    }
  },

  loadJob: async (id: number) => {
    try {
      /** Load the job from the DB, it may have been updated by sync */
      const localJob = await jobsDB.getJob(id);
      if (localJob) {
        set(() => ({ currentJob: localJob }));
        return;
      }

      // This likely isn't a users job, so always load from API
      const job = await fetchJobByIdFromApi(id);
      if (job) {
        set(() => ({ currentJob: job }));
      }
    } catch (error) {
      toast.error(await getApiErrorMessage(error, "Failed to load job"));
      throw error;
    }
  },

  setCurrentJob: (job: IJob | null) => {
    set({ currentJob: job });
  },

  refreshJob: async (jobId: number) => {
    try {
      // Fetch fresh data from API
      const job = await fetchJobByIdFromApi(jobId);
      if (job) {
        // Save to IndexedDB and mark as synced
        await jobsDB.saveJob(job);

        // Load job with sync status from DB and update store
        const jobWithSyncStatus = await jobsDB.getJob(jobId);
        set({ currentJob: jobWithSyncStatus });
      }
    } catch (error) {
      console.error("Failed to refresh job:", error);
      throw error;
    }
  },

  syncAndRefreshJob: async (jobId: number) => {
    const { getAccessToken } = useAuth();
    try {
      // Get queued requests for this job from the offline queue
      const queuedRequests = await offlineQueue.getQueuedRequestsForJob(jobId);
      const authToken = getAccessToken() ?? undefined;

      if (queuedRequests.length > 0) {
        console.log(`Processing ${queuedRequests.length} queued requests for job ${jobId}`);
        // Process each queued request - this will remove the request from the queue if successful
        for (const request of queuedRequests) {
          await offlineQueue.processRequest(request, authToken);
        }
      } else {
        console.log(`No queued requests found for job ${jobId}`);
      }

      // Always fetch fresh data from API after sync attempt
      await get().refreshJob(jobId);
    } catch (error) {
      console.error("Failed to force sync job:", error);
      throw error;
    }
  },

  // Sync the job with the updated task
  updateJobTask: async (jobId: number, taskId: number, updates: Partial<IJobTask>) => {
    let updatedCurrentJob = get().currentJob;
    if (updatedCurrentJob?.id === jobId) {
      updatedCurrentJob = {
        ...updatedCurrentJob,
        tasks: updatedCurrentJob.tasks.map((task) => {
          if (task.id === taskId) {
            return {
              ...task,
              ...updates,
            };
          }
          return task;
        }),
      };
    }

    // Save updated job to IndexedDB with updated timestamp
    if (updatedCurrentJob) {
      // Don't update the lastSynced time when updating locally
      await jobsDB.saveJob(updatedCurrentJob, false);
    }

    set(() => ({ currentJob: updatedCurrentJob }));
  },
}));

export default useJobStore;
