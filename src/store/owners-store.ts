import { create } from "zustand";
import type { IOwner } from "@/models/owner.model";
import { toast } from "@/store/toast-store";
import { getApiErrorMessage } from "@/lib/api/error";
import api from "@/lib/api/api";
import type { IJob } from "@/models/job.model";

interface OwnersStore {
  owners: IOwner[];
  isLoading: boolean;
  syncOwnerUserJobs: (jobs: IJob[]) => void;
  loadOwners: () => Promise<void>;
}

const useOwnersStore = create<OwnersStore>((set, get) => ({
  owners: [],
  isLoading: false,

  loadOwners: async () => {
    if (get().isLoading) return;
    set({ isLoading: true });

    try {
      const response = await api.get("/owners");
      const owners: IOwner[] = response.data;
      set({ owners });
    } catch (error) {
      const errorMessage = await getApiErrorMessage(error, "Failed to fetch owners");
      toast.error(errorMessage);
    } finally {
      set({ isLoading: false });
    }
  },

  syncOwnerUserJobs(jobs: IJob[]) {
    if (jobs.length === 0) return;

    // Get the owner ID from the first job sync they are all the current users jobs
    const ownerId = jobs[0].ownerId;

    // Transform jobs to the format expected by owners
    const ownerJobs = jobs.map((job) => ({
      id: job.id,
      ownerId: job.ownerId,
      name: job.name,
      location: job.location,
    }));

    const owners = get().owners.map((owner) => {
      if (owner.id === ownerId) {
        return {
          ...owner,
          jobs: ownerJobs,
        };
      }
      return owner;
    });

    set({ owners });
  },
}));

export default useOwnersStore;
