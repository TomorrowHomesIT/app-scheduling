import { create } from "zustand";
import type { ISupplier } from "@/models/supplier.model";
import { toast } from "./toast-store";
import { getApiErrorMessage } from "@/lib/api/error";
import useLoadingStore from "@/store/loading-store";
import api from "@/lib/api/api";

interface SupplierStore {
  suppliers: ISupplier[];
  activeSuppliers: ISupplier[];
  archivedSuppliers: ISupplier[];
  loadSuppliers: () => Promise<void>;
  getSupplierById: (id: number) => ISupplier | undefined;
}

const useSupplierStore = create<SupplierStore>((set, get) => ({
  suppliers: [],
  activeSuppliers: [],
  archivedSuppliers: [],

  loadSuppliers: async () => {
    const loading = useLoadingStore.getState();
    if (loading.suppliers.isLoading) return;

    loading.setLoading("suppliers", true);

    try {
      const response = await api.get(`/suppliers`);
      const suppliers: ISupplier[] = response.data;

      const activeSuppliers = suppliers.filter((supplier) => supplier.active);
      const archivedSuppliers = suppliers.filter((supplier) => !supplier.active);

      set({ suppliers, activeSuppliers, archivedSuppliers });
      loading.setLoaded("suppliers", true);
    } catch (error) {
      const errorMessage = await getApiErrorMessage(error);
      loading.setError("suppliers", errorMessage);
      toast.error(errorMessage);
    } finally {
      loading.setLoading("suppliers", false);
    }
  },

  getSupplierById: (id: number) => {
    return get().suppliers.find((supplier) => supplier.id === id);
  },
}));

export default useSupplierStore;
