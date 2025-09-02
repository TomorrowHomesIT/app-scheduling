import { create } from "zustand";
import type { ITask } from "@/models/task.model";
import type { IJobTaskStage } from "@/models/job.model";

interface TaskTemplateStore {
  tasks: ITask[];
  stages: IJobTaskStage[];
  isLoading: boolean;
  
  loadTasksAndStages: () => Promise<void>;
}

const useTaskTemplateStore = create<TaskTemplateStore>((set, get) => ({
  tasks: [],
  stages: [],
  isLoading: false,

  loadTasksAndStages: async () => {
    // Don't fetch if already loaded or currently loading
    if (get().tasks.length > 0 && get().stages.length > 0 || get().isLoading) return;

    set({ isLoading: true });

    try {
      // Fetch both tasks and stages in parallel
      const [tasksRes, stagesRes] = await Promise.all([
        fetch("/api/tasks"),
        fetch("/api/task-stages"),
      ]);

      if (!tasksRes.ok || !stagesRes.ok) {
        throw new Error("Failed to fetch task templates");
      }

      const tasksData: ITask[] = await tasksRes.json();
      const stagesData: IJobTaskStage[] = await stagesRes.json();

      // Sort stages by order
      const sortedStages = stagesData.sort((a, b) => a.order - b.order);

      set({
        tasks: tasksData,
        stages: sortedStages,
        isLoading: false,
      });
    } catch {
      // TODO error
    } finally {
      set({ isLoading: false });
    }
  },
}));

export default useTaskTemplateStore;