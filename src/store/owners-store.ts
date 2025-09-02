import { create } from "zustand";
import type { IOwner } from "@/models/owner.model";
import { owners as mockOwners } from "../lib/mock-data";

interface OwnersStore {
  owners: IOwner[];
  isLoaded: boolean;
  loadOwners: () => Promise<void>;
}

const simulateApiDelay = () => new Promise((resolve) => setTimeout(resolve, 300));

// Mock API functions
const fetchOwnersFromApi = async (): Promise<IOwner[]> => {
  await simulateApiDelay();
  return mockOwners;
};

const useOwnersStore = create<OwnersStore>((set, get) => ({
  owners: [],
  isLoaded: false,

  loadOwners: async () => {
    if (get().isLoaded) return; // Don't load if already loaded

    const owners = await fetchOwnersFromApi();
    set({ owners });
  },
}));

export default useOwnersStore;
