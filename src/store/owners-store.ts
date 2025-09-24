import { create } from "zustand";
import type { IOwner } from "@/models/owner.model";
import { toast } from "@/store/toast-store";
import useLoadingStore from "@/store/loading-store";
import api from "@/lib/api/api";

interface OwnersStore {
  owners: IOwner[];
  loadOwners: () => Promise<void>;
}

const useOwnersStore = create<OwnersStore>((set) => ({
  owners: [],

  loadOwners: async () => {
    const loading = useLoadingStore.getState();

    if (loading.owners.isLoading) return;
    loading.setLoading("owners", true);

    try {
      const response = await api.get("/owners");
      const owners: IOwner[] = response.data;
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
}));

export default useOwnersStore;
