import { create } from "zustand";
import type { IJob, IUpdateJobRequest } from "@/models/job.model";
import type { IJobTask } from "@/models/job.model";
import { toast } from "@/store/toast-store";

interface JobStore {
  jobs: IJob[];
  currentJob: IJob | null;
  isLoading: boolean;

  loadJob: (id: number) => Promise<void>;
  setCurrentJob: (job: IJob | null) => void;
  updateJob: (jobId: number, updates: IUpdateJobRequest) => Promise<void>;
  updateTask: (taskId: number, updates: Partial<IJobTask>) => Promise<void>;
}

const fetchJobByIdFromApi = async (id: number): Promise<IJob | null> => {
  try {
    const response = await fetch(`/api/jobs/${id}`);

    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      throw new Error("Failed to fetch job");
    }

    const job: IJob = await response.json();
    return job;
  } catch (error) {
    console.error("Error fetching job:", error);
    throw error;
  }
};

const updateTaskApi = async (taskId: number, updates: Partial<IJobTask>): Promise<IJobTask | null> => {
  try {
    const response = await fetch(`/api/tasks/${taskId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(updates),
    });

    if (!response.ok) {
      throw new Error("Failed to update task");
    }

    const updatedTask: IJobTask = await response.json();
    return updatedTask;
  } catch (error) {
    console.error("Error updating task:", error);
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
      throw new Error("Failed to update job");
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

    // Optimistically update the UI
    set((state) => {
      // Update job in jobs array
      const updatedJobs = state.jobs.map((job) => (job.id === jobId ? { ...job, ...updates } : job));

      // Update currentJob if it's the same job
      const updatedCurrentJob = state.currentJob?.id === jobId ? { ...state.currentJob, ...updates } : state.currentJob;

      return {
        jobs: updatedJobs,
        currentJob: updatedCurrentJob,
      };
    });

    // Show toast notification for the update
    await toast.while(updateJobApi(jobId, updates), {
      loading: "Updating job...",
      success: "Job updated",
      error: (error) => {
        // Rollback on error
        console.error("Failed to update job, rolling back:", error);
        set({
          jobs: previousState.jobs,
          currentJob: previousState.currentJob,
        });
        return "Failed to update job";
      },
    });
  },

  updateTask: async (taskId: number, updates: Partial<IJobTask>) => {
    // Store the current state in case we need to rollback
    // TODO we probably need to just store the request if there is no internet
    const previousState = get();

    // Optimistically update the UI
    set((state) => {
      // Find which job contains this task
      const jobWithTask = state.jobs.find((job) => job.tasks?.some((task) => task.id === taskId));

      if (!jobWithTask) return state;

      // Update the task in the specific job
      const updatedJobs = state.jobs.map((job) => {
        if (job.id === jobWithTask.id) {
          return {
            ...job,
            tasks: job.tasks?.map((task) => (task.id === taskId ? { ...task, ...updates } : task)),
          };
        }

        return job;
      });

      // Also update currentJob if it's the same job
      let updatedCurrentJob = state.currentJob;
      if (updatedCurrentJob?.id === jobWithTask.id) {
        updatedCurrentJob = {
          ...updatedCurrentJob,
          tasks: updatedCurrentJob.tasks.map((task) => (task.id === taskId ? { ...task, ...updates } : task)),
        };
      }

      return {
        jobs: updatedJobs,
        currentJob: updatedCurrentJob,
      };
    });

    // Determine what's being updated for specific toast messages
    const getUpdateMessage = () => {
      if (updates.supplierId !== undefined) return "supplier";
      if (updates.progress !== undefined) return "progress";
      if (updates.startDate !== undefined) return "start date";
      if (updates.notes !== undefined) return "notes";
      if (updates.purchaseOrderLinks !== undefined) return "purchase orders";
      if (updates.planLinks !== undefined) return "plan links";

      return "task";
    };

    const updateType = getUpdateMessage();

    await toast.while(updateTaskApi(taskId, updates), {
      loading: `Saving ${updateType}...`,
      success: `Updated ${updateType}`,
      error: (error) => {
        // Rollback on error
        console.error("Failed to update task, rolling back:", error);
        set({
          jobs: previousState.jobs,
          currentJob: previousState.currentJob,
        });
        return `Failed to update ${updateType}`;
      },
    });
  },
}));

export default useJobStore;
