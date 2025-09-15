import { create } from "zustand";
import type { ISupplier } from "@/models/supplier.model";
import { toast } from "./toast-store";
import { getApiErrorMessage } from "@/lib/api/error";
import useLoadingStore from "@/store/loading-store";

interface SupplierStore {
  suppliers: ISupplier[];
  archivedSuppliers: ISupplier[];
  isArchivedLoaded: boolean;
  loadSuppliers: () => Promise<void>;
  loadArchivedSuppliers: () => Promise<void>;
  getSupplierById: (id: number) => ISupplier | undefined;
}

const fetchSuppliers = async (active: boolean): Promise<ISupplier[]> => {
  const response = await fetch(`/api/suppliers?active=${active}`);

  if (!response.ok) {
    throw new Error(`Failed to fetch suppliers: ${response.statusText}`);
  }

  return response.json();
};

const useSupplierStore = create<SupplierStore>((set, get) => ({
  suppliers: [],
  archivedSuppliers: [],
  isArchivedLoaded: false,

  loadSuppliers: async () => {
    const loading = useLoadingStore.getState();
    if (loading.suppliers.isLoading) return;

    loading.setLoading("suppliers", true);

    try {
      const suppliers = await fetchSuppliers(true);
      set({ suppliers });
      loading.setLoaded("suppliers", true);
    } catch (error) {
      const errorMessage = await getApiErrorMessage(error);
      loading.setError("suppliers", errorMessage);
      toast.error(errorMessage);
    } finally {
      loading.setLoading("suppliers", false);
    }
  },

  loadArchivedSuppliers: async () => {
    if (get().isArchivedLoaded) return; // Don't load if already loaded

    try {
      const suppliers = await fetchSuppliers(false);
      set({ archivedSuppliers: suppliers, isArchivedLoaded: true });
    } catch (error) {
      toast.error(await getApiErrorMessage(error));
    }
  },

  getSupplierById: (id: number) => {
    return get().suppliers.find((supplier) => supplier.id === id);
  },
}));

export default useSupplierStore;
