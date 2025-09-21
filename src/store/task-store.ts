import { create } from "zustand";
import type { ITask } from "@/models/task.model";
import type { IJobTaskStage } from "@/models/job.model";
import { toast, useToastStore } from "./toast-store";
import useLoadingStore from "./loading-store";
import { getApiErrorMessage } from "@/lib/api/error";
import { getTaskStages } from "@/lib/supabase/task-stages";
import { getTasks, updateTask as updateTaskHelper } from "@/lib/supabase/tasks";

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
      const updatedTask: ITask = await updateTaskHelper(taskId, updates);
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
      const tasks = await getTasks();
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
      const stagesData = await getTaskStages();
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
