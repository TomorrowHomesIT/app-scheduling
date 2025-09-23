import { create } from "zustand";
import type { IJob, IJobTask, IUpdateJobRequest } from "@/models/job.model";
import { toast } from "@/store/toast-store";
import { getApiErrorMessage } from "@/lib/api/error";
import useOwnersStore from "@/store/owners-store";
import useLoadingStore from "@/store/loading-store";
import { jobsDB } from "@/lib/jobs-db";
import api from "@/lib/api/api";

interface JobStore {
  jobs: IJob[]; // TODO I'm not sure this is actually uesd? We never load a list of jobs lol
  currentJob: IJob | null;

  loadUserJobs: (withLoading?: boolean) => Promise<void>;
  loadJob: (id: number, withLoading?: boolean) => Promise<void>;
  setCurrentJob: (job: IJob | null) => void;
  updateJob: (jobId: number, updates: IUpdateJobRequest) => Promise<void>;
  updateJobTask: (jobId: number, jobTaskId: number, updates: Partial<IJobTask>) => Promise<void>;
  refreshJob: (jobId: number) => Promise<void>;
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

const fetchUserJobsFromApi = async (): Promise<IJob[] | null> => {
  try {
    const response = await api.get(`/user/jobs`);
    const job: IJob[] = response.data;
    return job;
  } catch (error) {
    console.error("Error fetching user jobs:", error);
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
  jobs: [],
  currentJob: null,

  loadUserJobs: async (withLoading = true) => {
    const loading = useLoadingStore.getState();
    // TODO: this is probably not a ideal solution, we should just call loading where we need with load jobs etc.
    if (withLoading) {
      loading.setLoading("jobs", true);
    }

    try {
      const jobs = await fetchUserJobsFromApi();
      for (const job of jobs || []) {
        await jobsDB.saveJob(job);
      }
      loading.setLoaded("jobs", true);
    } catch (error) {
      const errorMessage = await getApiErrorMessage(error);
      loading.setError("jobs", errorMessage);
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

    // Update the store state
    set((state) => {
      const updatedJobs = state.jobs.map((job) => (job.id === jobId ? { ...job, ...updates } : job));
      const updatedCurrentJob = state.currentJob?.id === jobId ? { ...state.currentJob, ...updates } : state.currentJob;

      return {
        jobs: updatedJobs,
        currentJob: updatedCurrentJob,
      };
    });

    // Save to IndexedDB and update sync status asynchronously
    const currentJob = get().currentJob;
    if (currentJob?.id === jobId) {
      await jobsDB.saveJob(currentJob);
      await jobsDB.updateJobLastUpdated(jobId);
      set({ currentJob });
    }
  },

  // Sync the job with the updated task
  updateJobTask: async (jobId: number, jobTaskId: number, updates: Partial<IJobTask>) => {
    const updatedJobs = get().jobs.map((job) => {
      if (job.id === jobId) {
        return {
          ...job,
          tasks: job.tasks.map((task) => (task.id === jobTaskId ? { ...task, ...updates } : task)),
        };
      }
      return job;
    });

    let updatedCurrentJob = get().currentJob;
    if (updatedCurrentJob?.id === jobId) {
      updatedCurrentJob = {
        ...updatedCurrentJob,
        tasks: updatedCurrentJob.tasks.map((task) => (task.id === jobTaskId ? { ...task, ...updates } : task)),
        lastUpdated: Date.now(),
      };
    }

    // Save updated job to IndexedDB and mark task as updated
    if (updatedCurrentJob) {
      jobsDB.saveJob(updatedCurrentJob);
      jobsDB.updateJobLastUpdated(jobId);
      jobsDB.updateTaskLastUpdated(jobId, jobTaskId);
    }

    set(() => {
      return {
        jobs: updatedJobs,
        currentJob: updatedCurrentJob,
      };
    });
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
