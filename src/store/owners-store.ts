import { create } from "zustand";
import type { IOwner } from "@/models/owner.model";
import { toast } from "@/store/toast-store";

interface OwnersStore {
  owners: IOwner[];
  isLoaded: boolean;
  isLoading: boolean;
  loadOwners: () => Promise<void>;
  setJobName: (jobId: number, name: string) => void;
}

const useOwnersStore = create<OwnersStore>((set, get) => ({
  owners: [],
  isLoaded: false,
  isLoading: false,

  loadOwners: async () => {
    if (get().isLoaded || get().isLoading) return; // Don't load if already loaded or loading

    set({ isLoading: true });

    try {
      const response = await fetch("/api/owners");

      if (!response.ok) {
        throw new Error("Failed to fetch owners");
      }

      const owners: IOwner[] = await response.json();
      set({ owners, isLoaded: true, isLoading: false });
    } catch {
      toast.error("Failed to fetch owners");
    } finally {
      set({ isLoading: false });
    }
  },

  setJobName: (jobId: number, name: string) => {
    set((state) => ({
      owners: state.owners.map((owner) => ({
        ...owner,
        jobs: owner.jobs?.map((job) => (job.id === jobId ? { ...job, name } : job)),
      })),
    }));
  },
}));

export default useOwnersStore;
