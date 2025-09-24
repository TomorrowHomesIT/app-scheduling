import { create } from "zustand";
import type { IOwner } from "@/models/owner.model";
import { toast } from "@/store/toast-store";
import { getApiErrorMessage } from "@/lib/api/error";
import api from "@/lib/api/api";

interface OwnersStore {
  owners: IOwner[];
  isLoading: boolean;
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
}));

export default useOwnersStore;
