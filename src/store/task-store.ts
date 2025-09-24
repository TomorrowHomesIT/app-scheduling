import { create } from "zustand";
import type { IJobTaskStage } from "@/models/job.model";
import { toast } from "./toast-store";
import { getApiErrorMessage } from "@/lib/api/error";
import api from "@/lib/api/api";

interface TaskStore {
  taskStages: IJobTaskStage[];
  isLoading: boolean;

  loadTaskStages: () => Promise<void>;
}

const useTaskStore = create<TaskStore>((set, get) => ({
  taskStages: [],
  isLoading: false,

  loadTaskStages: async () => {
    if (get().isLoading) return;
    set({ isLoading: true });

    try {
      const stagesRes = await api.get("/task-stages");
      const stagesData: IJobTaskStage[] = stagesRes.data;
      const sortedStages = stagesData.sort((a, b) => a.order - b.order);
      set({ taskStages: sortedStages });
    } catch (error) {
      const errorMessage = await getApiErrorMessage(error, "Failed to fetch task stages");
      toast.error(errorMessage);
    } finally {
      set({ isLoading: false });
    }
  },
}));

export default useTaskStore;
