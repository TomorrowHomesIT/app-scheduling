import { create } from "zustand";
import type { ITask } from "@/models/task.model";
import type { IJobTaskStage } from "@/models/job.model";
import { toast } from "./toast-store";
import useLoadingStore from "./loading-store";

interface TaskStore {
  tasks: ITask[];
  taskStages: IJobTaskStage[];
  isLoading: boolean;

  loadTasks: () => Promise<void>;
  loadTaskStages: () => Promise<void>;
}

const useTaskStore = create<TaskStore>((set, get) => ({
  tasks: [],
  taskStages: [],
  isLoading: false,

  loadTasks: async () => {
    // Don't fetch if already loaded or currently loading
    if (get().tasks.length > 0 || get().isLoading) return;
    set({ isLoading: true });

    try {
      // Fetch both tasks and stages in parallel
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
