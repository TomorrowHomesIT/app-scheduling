import { create } from "zustand";
import type { IJob, IJobTask, IUpdateJobRequest } from "@/models/job.model";
import { toast } from "@/store/toast-store";
import { getApiErrorMessage } from "@/lib/api/error";
import useOwnersStore from "@/store/owners-store";
import useLoadingStore from "@/store/loading-store";
import { jobsDB } from "@/lib/jobs-db";

interface JobSyncStatus {
  lastUpdated: number;
  lastSynced: number;
  hasPendingUpdates: boolean;
}

interface JobStore {
  jobs: IJob[]; // TODO I'm not sure this is actually uesd? We never load a list of jobs lol
  currentJob: IJob | null;
  currentJobSyncStatus: JobSyncStatus | null;
  isLoadingJobs: boolean;

  loadUserJobs: () => Promise<void>;
  loadJob: (id: number) => Promise<void>;
  setCurrentJob: (job: IJob | null) => void;
  updateJob: (jobId: number, updates: IUpdateJobRequest) => Promise<void>;
  updateJobTask: (jobId: number, jobTaskId: number, updates: Partial<IJobTask>) => Promise<void>;
  loadJobSyncStatus: (jobId: number) => Promise<void>;
}

const fetchJobByIdFromApi = async (id: number): Promise<IJob | null> => {
  try {
    const response = await fetch(`/api/jobs/${id}`);

    if (!response.ok) {
      throw new Error(await getApiErrorMessage(response, "Failed to fetch job"));
    }

    const job: IJob = await response.json();
    return job;
  } catch (error) {
    console.error("Error fetching job:", error);
    throw error;
  }
};

const fetchUserJobsFromApi = async (): Promise<IJob[] | null> => {
  try {
    const response = await fetch(`/api/user/jobs`);

    if (!response.ok) {
      throw new Error(await getApiErrorMessage(response, "Failed to fetch job"));
    }

    const job: IJob[] = await response.json();
    return job;
  } catch (error) {
    console.error("Error fetching user jobs:", error);
    throw error;
  }
};

const updateJobApi = async (jobId: number, updates: IUpdateJobRequest): Promise<boolean | null> => {
  try {
    const response = await fetch(`/api/jobs/${jobId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(updates),
    });

    if (!response.ok) {
      throw new Error(await getApiErrorMessage(response, "Failed to update job"));
    }

    const updatedJob: boolean = await response.json();
    return updatedJob;
  } catch (error) {
    console.error("Error updating job:", error);
    throw error;
  }
};

const useJobStore = create<JobStore>((set, get) => ({
  jobs: [],
  currentJob: null,
  currentJobSyncStatus: null,
  isLoadingJobs: false,

  loadUserJobs: async () => {
    const loading = useLoadingStore.getState();
    if (loading.jobs.isLoading) return;
    loading.setLoading("jobs", true);

    try {
      const jobs = await fetchUserJobsFromApi();
      for (const job of jobs || []) {
        await jobsDB.saveJob(job);
      }
      loading.setLoaded("jobs", true);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to load jobs";
      loading.setError("jobs", errorMessage);
    } finally {
      loading.setLoading("jobs", false);
    }
  },

  loadJob: async (id: number) => {
    if (get().isLoadingJobs) return;
    set({ isLoadingJobs: true });

    try {
      const localJob = await jobsDB.getJob(id);
      if (localJob) {
        set(() => ({ currentJob: localJob }));
        // Load sync status for local job
        const syncStatus = await jobsDB.getJobSyncStatus(id);
        set(() => ({ currentJobSyncStatus: syncStatus }));
        return;
      }

      // This likely isn't a users job, so always load from API
      const job = await fetchJobByIdFromApi(id);
      if (job) {
        set(() => ({ currentJob: job }));
        // For API-loaded jobs, we don't have sync status
        set(() => ({ currentJobSyncStatus: null }));
      }
    } finally {
      set({ isLoadingJobs: false });
    }
  },

  setCurrentJob: (job: IJob | null) => {
    set({ currentJob: job });
  },

  loadJobSyncStatus: async (jobId: number) => {
    try {
      const syncStatus = await jobsDB.getJobSyncStatus(jobId);
      set({ currentJobSyncStatus: syncStatus });
    } catch (error) {
      console.error("Failed to load job sync status:", error);
    }
  },

  updateJob: async (jobId: number, updates: IUpdateJobRequest) => {
    // Store the current state in case we need to rollback
    const previousState = get();

    await toast.while(updateJobApi(jobId, updates), {
      loading: "Updating job...",
      success: "Job updated",
      error: () => {
        set({ jobs: previousState.jobs, currentJob: previousState.currentJob });
        return "Failed to update job";
      },
    });

    const ownersStore = useOwnersStore.getState();
    if (updates.name) {
      ownersStore.setJobName(jobId, updates.name);
    }
    if (updates.ownerId !== undefined) {
      ownersStore.setJobOwner(jobId, updates.ownerId);
    }

    set((state) => {
      const updatedJobs = state.jobs.map((job) => (job.id === jobId ? { ...job, ...updates } : job));
      const updatedCurrentJob = state.currentJob?.id === jobId ? { ...state.currentJob, ...updates } : state.currentJob;

      // Save updated job to IndexedDB and mark as updated
      if (updatedCurrentJob) {
        jobsDB.saveJob(updatedCurrentJob);
        jobsDB.updateJobLastUpdated(jobId);
      }

      return {
        jobs: updatedJobs,
        currentJob: updatedCurrentJob,
      };
    });
  },

  // Sync the job with the updated task
  updateJobTask: async (jobId: number, jobTaskId: number, updates: Partial<IJobTask>) => {
    set((state) => {
      const updatedJobs = state.jobs.map((job) => {
        if (job.id === jobId) {
          return {
            ...job,
            tasks: job.tasks.map((task) => (task.id === jobTaskId ? { ...task, ...updates } : task)),
          };
        }
        return job;
      });

      let updatedCurrentJob = state.currentJob;
      if (updatedCurrentJob?.id === jobId) {
        updatedCurrentJob = {
          ...updatedCurrentJob,
          tasks: updatedCurrentJob.tasks.map((task) => (task.id === jobTaskId ? { ...task, ...updates } : task)),
        };
      }

      // Save updated job to IndexedDB and mark task as updated
      if (updatedCurrentJob) {
        jobsDB.saveJob(updatedCurrentJob);
        jobsDB.updateJobLastUpdated(jobId);
        jobsDB.updateTaskLastUpdated(jobId, jobTaskId);
      }

      return {
        jobs: updatedJobs,
        currentJob: updatedCurrentJob,
      };
    });
  },
}));

export default useJobStore;
