import { create } from "zustand";
import type { IJob, IJobTask, IUpdateJobRequest } from "@/models/job.model";
import { toast } from "@/store/toast-store";
import { getApiErrorMessage } from "@/lib/api/error";
import useOwnersStore from "@/store/owners-store";
import useLoadingStore from "@/store/loading-store";
import { jobsDB } from "@/lib/jobs-db";
import api from "@/lib/api/api";

interface JobStore {
  currentJob: IJob | null;

  fetchUserJobsFromApi: () => Promise<IJob[]>;
  loadUserJobs: (withLoading?: boolean) => Promise<void>;
  loadJob: (id: number, withLoading?: boolean) => Promise<void>;
  setCurrentJob: (job: IJob | null) => void;
  updateJob: (jobId: number, updates: IUpdateJobRequest) => Promise<void>;
  updateJobTask: (jobId: number, jobTaskId: number, updates: Partial<IJobTask>) => Promise<void>;
  refreshJob: (jobId: number) => Promise<void>;
  forceSyncLocalJob: (jobId: number) => Promise<void>;
  syncJobWithDrive: (jobId: number) => Promise<void>;
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

const updateJobApi = async (jobId: number, updates: IUpdateJobRequest): Promise<boolean | null> => {
  try {
    const response = await api.patch(`/jobs/${jobId}`, updates);
    const updatedJob: boolean = response.data;

    return updatedJob;
  } catch (error) {
    console.error("Error updating job:", error);
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

  loadUserJobs: async (withLoading = true) => {
    const loading = useLoadingStore.getState();
    // TODO: this is probably not a ideal solution, we should just call loading where we need with load jobs etc.
    if (withLoading) {
      loading.setLoading("jobs", true);
    }

    try {
      const userJobs = await get().fetchUserJobsFromApi();
      for (const job of userJobs) {
        await jobsDB.saveJob(job);
      }
      loading.setLoaded("jobs", true);
    } catch (error) {
      const errorMessage = await getApiErrorMessage(error);
      loading.setError("jobs", errorMessage);
      throw error;
    } finally {
      if (withLoading) {
        loading.setLoading("jobs", false);
      }
    }
  },

  loadJob: async (id: number, withLoading = true) => {
    const loading = useLoadingStore.getState();
    if (withLoading) {
      loading.setLoading("currentJob", true);
    }

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
    } finally {
      if (withLoading) {
        loading.setLoading("currentJob", false);
      }
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

  forceSyncLocalJob: async (jobId: number) => {
    try {
      // Get the current job from DB to find pending tasks
      const currentJob = await jobsDB.getJob(jobId);
      if (!currentJob) {
        throw new Error(`Job ${jobId} not found in local DB`);
      }

      // Find tasks with pending changes (where lastUpdated > lastSynced)
      const pendingTasks = currentJob.tasks.filter(task => 
        task.lastUpdated && task.lastSynced && task.lastUpdated > task.lastSynced
      );
      
      if (pendingTasks.length > 0) {
        console.log(`Syncing ${pendingTasks.length} pending tasks for job ${jobId}`);
        
        // Send each pending task update to API
        for (const task of pendingTasks) {
          try {
            await api.patch(`/jobs/tasks/${task.id}`, task);
          } catch (error) {
            console.error(`Failed to sync task ${task.id}:`, error);
            throw error; // Fail fast if any task sync fails
          }
        }
      } else {
        console.log(`No pending tasks found for job ${jobId}`);
      }

      // Now fetch fresh data from API
      const job = await fetchJobByIdFromApi(jobId);
      if (job) {
        // Save to IndexedDB and mark as synced
        await jobsDB.saveJob(job);

        // Load job with sync status from DB and update store
        const jobWithSyncStatus = await jobsDB.getJob(jobId);
        set({ currentJob: jobWithSyncStatus });
      }
    } catch (error) {
      console.error("Failed to force refresh job:", error);
      throw error;
    }
  },

  updateJob: async (jobId: number, updates: IUpdateJobRequest) => {
    await toast.while(updateJobApi(jobId, updates), {
      loading: "Updating job...",
      success: "Job updated",
      error: "Failed to update job",
    });

    const ownersStore = useOwnersStore.getState();
    if (updates.name) {
      ownersStore.setJobName(jobId, updates.name);
    }
    if (updates.ownerId !== undefined) {
      ownersStore.setJobOwner(jobId, updates.ownerId);
    }

    // Update the store state
    set((state) => {
      const updatedCurrentJob = state.currentJob?.id === jobId ? { ...state.currentJob, ...updates } : state.currentJob;

      return {
        currentJob: updatedCurrentJob,
      };
    });

    // Save to IndexedDB and update sync status asynchronously
    const currentJob = get().currentJob;
    if (currentJob?.id === jobId) {
      await jobsDB.saveJob(currentJob, true); // Preserve pending status when updating locally
      await jobsDB.updateJobLastUpdated(jobId);
      set({ currentJob });
    }
  },

  // Sync the job with the updated task
  updateJobTask: async (jobId: number, jobTaskId: number, updates: Partial<IJobTask>) => {
    let updatedCurrentJob = get().currentJob;
    if (updatedCurrentJob?.id === jobId) {
      const now = Date.now();
      updatedCurrentJob = {
        ...updatedCurrentJob,
        tasks: updatedCurrentJob.tasks.map((task) => {
          if (task.id === jobTaskId) {
            // Mark this specific task as updated
            return { 
              ...task, 
              ...updates,
              lastUpdated: now,
              lastSynced: task.lastSynced || now, // Preserve existing sync time or set to now if first time
            };
          }
          return task;
        }),
        lastUpdated: now, // Mark job as updated too
      };
    }

    // Save updated job to IndexedDB with updated timestamp
    if (updatedCurrentJob) {
      // Save the entire job (which includes the updated task with inline sync status)
      await jobsDB.saveJob(updatedCurrentJob, true);
      // Mark the job as having unsaved changes
      await jobsDB.updateJobLastUpdated(jobId);
    }

    set(() => ({ currentJob: updatedCurrentJob }));
  },

  syncJobWithDrive: async (jobId: number) => {
    const { setLoading } = useLoadingStore.getState();
    setLoading("currentJob", true, "Syncing with Google Drive. This may take a while...");

    try {
      const response = await api.post(`/jobs/${jobId}/sync-drive`);
      const data = response.data;

      toast.success(`Job created and synced with Google Drive. Updated ${data?.updatedTasks || 0} task(s).`, 5000);
      await get().loadJob(jobId);
    } catch (error) {
      toast.error(await getApiErrorMessage(error, "Failed to sync with Google Drive"));
    } finally {
      setLoading("currentJob", false);
    }
  },
}));

export default useJobStore;
