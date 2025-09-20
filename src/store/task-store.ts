import { create } from "zustand";
import type { ITask } from "@/models/task.model";
import type { IJobTaskStage } from "@/models/job.model";
import { toast, useToastStore } from "./toast-store";
import useLoadingStore from "./loading-store";
import { getApiErrorMessage } from "@/lib/api/error";

interface TaskStore {
  tasks: ITask[];
  taskStages: IJobTaskStage[];
  isLoading: boolean;

  updateTask: (taskId: number, updates: Partial<ITask>) => Promise<void>;
  loadTasks: () => Promise<void>;
  loadTaskStages: () => Promise<void>;
}

const useTaskStore = create<TaskStore>((set, get) => ({
  tasks: [],
  taskStages: [],
  isLoading: false,

  updateTask: async (taskId: number, updates: Partial<ITask>) => {
    const loadingId = toast.loading("Updating task...");

    try {
      const tasksRes = await fetch(`/api/tasks/${taskId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updates),
      });

      if (!tasksRes.ok) {
        throw new Error("Failed to fetch task templates");
      }

      const updatedTask: ITask = await tasksRes.json();
      set((state) => ({ tasks: state.tasks.map((t) => (t.id === taskId ? { ...t, ...updatedTask } : t)) }));
      toast.success("Task updated successfully");
    } catch (error) {
      const errorMessage = await getApiErrorMessage(error);
      toast.error(errorMessage);
    } finally {
      useToastStore.getState().removeToast(loadingId);
    }
  },

  loadTasks: async () => {
    if (get().isLoading) return;
    set({ isLoading: true });

    try {
      const tasksRes = await fetch("/api/tasks");

      if (!tasksRes.ok) {
        throw new Error("Failed to fetch task templates");
      }

      const tasks: ITask[] = await tasksRes.json();
      set({ tasks, isLoading: false });
    } catch {
      toast.error("Failed to fetch task templates");
    } finally {
      set({ isLoading: false });
    }
  },

  loadTaskStages: async () => {
    const { taskStages, setLoading } = useLoadingStore.getState();
    if (get().taskStages.length > 0 || taskStages.isLoading) return;
    setLoading("taskStages", true);

    try {
      const stagesRes = await fetch("/api/task-stages");
      if (!stagesRes.ok) {
        throw new Error("Failed to fetch task stages");
      }

      const stagesData: IJobTaskStage[] = await stagesRes.json();
      const sortedStages = stagesData.sort((a, b) => a.order - b.order);
      set({ taskStages: sortedStages });
    } catch {
      toast.error("Failed to fetch task stages");
    } finally {
      setLoading("taskStages", false);
    }
  },
}));

export default useTaskStore;
