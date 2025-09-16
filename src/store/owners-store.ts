import { create } from "zustand";
import type { IOwner, IOwnerJob } from "@/models/owner.model";
import { toast } from "@/store/toast-store";
import useLoadingStore from "@/store/loading-store";

interface OwnersStore {
  owners: IOwner[];
  loadOwners: () => Promise<void>;
  setJobName: (jobId: number, name: string) => void;
  setJobOwner: (jobId: number, ownerId: number) => void;
}

const useOwnersStore = create<OwnersStore>((set) => ({
  owners: [],

  loadOwners: async () => {
    const loading = useLoadingStore.getState();

    if (loading.owners.isLoading) return;
    loading.setLoading("owners", true);

    try {
      const response = await fetch("/api/owners");

      if (!response.ok) {
        throw new Error("Failed to fetch owners");
      }

      const owners: IOwner[] = await response.json();
      set({ owners });
      loading.setLoaded("owners", true);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to fetch owners";
      loading.setError("owners", errorMessage);
      toast.error("Failed to fetch owners");
    } finally {
      loading.setLoading("owners", false);
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

  setJobOwner: (jobId: number, newOwnerId: number) => {
    set((state) => {
      const matchingJob = state.owners.flatMap((owner) => owner.jobs).find((job) => job?.id === jobId);
      if (!matchingJob) return state;

      const updatedJob: IOwnerJob = { ...matchingJob, ownerId: newOwnerId };

      // Update owners: remove job from old owner, add to new owner
      return {
        owners: state.owners.map((owner) => {
          // Remove job from any current owner
          const filteredJobs = owner.jobs?.filter((j) => j.id !== jobId) || [];

          if (owner.id === newOwnerId) {
            return { ...owner, jobs: [...filteredJobs, updatedJob] };
          }

          return { ...owner, jobs: filteredJobs };
        }),
      };
    });
  },
}));

export default useOwnersStore;
