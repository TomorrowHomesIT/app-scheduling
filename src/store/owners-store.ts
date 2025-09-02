import { create } from "zustand";
import type { IOwner } from "@/models/owner.model";

interface OwnersStore {
  owners: IOwner[];
  isLoaded: boolean;
  isLoading: boolean;
  loadOwners: () => Promise<void>;
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
      // TODO error
    } finally {
      set({ isLoading: false });
    }
  },
}));

export default useOwnersStore;
