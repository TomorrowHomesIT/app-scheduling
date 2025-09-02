import { create } from "zustand";
import type { IFolder } from "@/models/folder.model";
import type { IJob } from "@/models/job.model";
import type { ITask } from "@/models/task.model";
import { folders as mockFolders, jobs as mockJobs } from "../lib/mock-data";

interface AppStore {
  folders: IFolder[];
  jobs: IJob[];
  currentJob: IJob | null;

  loadFolders: () => Promise<void>;
  loadJob: (id: number) => Promise<void>;
  setCurrentJob: (job: IJob | null) => void;
  updateTask: (taskId: number, updates: Partial<ITask>) => Promise<void>;
}

// Simulate API delay
const simulateApiDelay = () => new Promise((resolve) => setTimeout(resolve, 300));

// Mock API functions
const fetchFoldersFromApi = async (): Promise<IFolder[]> => {
  await simulateApiDelay();
  return mockFolders;
};

const fetchJobByIdFromApi = async (id: number): Promise<IJob | null> => {
  await simulateApiDelay();
  return mockJobs.find((job) => job.id === id) || null;
};

// Mock API function for updating a task
const updateTaskApi = async (taskId: number, updates: Partial<ITask>): Promise<ITask | null> => {
  await simulateApiDelay();
  // In real implementation, this would make a PATCH request to /tasks/{taskId}
  // For now, we'll just return the updated task from mock data
  for (const job of mockJobs) {
    const task = job.tasks?.find((t) => t.id === taskId);
    if (task) {
      Object.assign(task, updates);
      return task;
    }
  }
  return null;
};

const useAppStore = create<AppStore>((set, get) => ({
  folders: [],
  jobs: [],
  currentJob: null,

  loadFolders: async () => {
    const folders = await fetchFoldersFromApi();
    set({ folders });
  },

  loadJob: async (id: number) => {
    const job = await fetchJobByIdFromApi(id);
    if (job) {
      set((state) => {
        // Update or add job to jobs array
        const jobIndex = state.jobs.findIndex((j) => j.id === id);
        const updatedJobs = jobIndex !== -1 ? state.jobs.map((j) => (j.id === id ? job : j)) : [...state.jobs, job];

        return {
          jobs: updatedJobs,
          currentJob: job,
        };
      });
    }
  },

  setCurrentJob: (job: IJob | null) => {
    set({ currentJob: job });
  },

  updateTask: async (taskId: number, updates: Partial<ITask>) => {
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

    // Make API call to persist the change
    await updateTaskApi(taskId, updates);
  },
}));

export default useAppStore;
