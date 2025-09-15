import { create } from "zustand";
import type { IJob, IJobTask, IUpdateJobRequest } from "@/models/job.model";
import { toast } from "@/store/toast-store";
import { getApiErrorMessage } from "@/lib/api/error";
import useOwnersStore from "@/store/owners-store";

interface JobStore {
  jobs: IJob[]; // TODO I'm not sure this is actually uesd? We never load a list of jobs lol
  currentJob: IJob | null;

  loadJob: (id: number) => Promise<void>;
  setCurrentJob: (job: IJob | null) => void;
  updateJob: (jobId: number, updates: IUpdateJobRequest) => Promise<void>;
  updateJobTask: (jobId: number, jobTaskId: number, updates: Partial<IJobTask>) => void;
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
  isLoading: false,

  loadJob: async (id: number) => {
    if (get().isLoading) return;
    set({ isLoading: true });

    try {
      const job = await fetchJobByIdFromApi(id);
      if (job) {
        set((state) => {
          // Update or add job to jobs array
          const jobIndex = state.jobs.findIndex((j) => j.id === id);
          const updatedJobs = jobIndex !== -1 ? state.jobs.map((j) => (j.id === id ? job : j)) : [...state.jobs, job];

          return {
            jobs: updatedJobs,
            currentJob: job,
            isLoading: false,
          };
        });
      }
    } catch {
      // TODO error
    } finally {
      set({ isLoading: false });
    }
  },

  setCurrentJob: (job: IJob | null) => {
    set({ currentJob: job });
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

      return {
        jobs: updatedJobs,
        currentJob: updatedCurrentJob,
      };
    });
  },

  updateJobTask: (jobId: number, jobTaskId: number, updates: Partial<IJobTask>) => {
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

      return {
        jobs: updatedJobs,
        currentJob: updatedCurrentJob,
      };
    });
  },
}));

export default useJobStore;
