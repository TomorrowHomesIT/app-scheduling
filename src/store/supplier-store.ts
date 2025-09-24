import { create } from "zustand";
import type { ISupplier } from "@/models/supplier.model";
import { toast } from "./toast-store";
import { getApiErrorMessage } from "@/lib/api/error";
import api from "@/lib/api/api";

interface SupplierStore {
  isLoading: boolean;
  suppliers: ISupplier[];
  activeSuppliers: ISupplier[];
  archivedSuppliers: ISupplier[];
  loadSuppliers: () => Promise<void>;
  getSupplierById: (id: number) => ISupplier | undefined;
}

const useSupplierStore = create<SupplierStore>((set, get) => ({
  isLoading: false,
  suppliers: [],
  activeSuppliers: [],
  archivedSuppliers: [],

  loadSuppliers: async () => {
    if (get().isLoading) return;
    set({ isLoading: true });

    try {
      const response = await api.get(`/suppliers`);
      const suppliers: ISupplier[] = response.data;

      const activeSuppliers = suppliers.filter((supplier) => supplier.active);
      const archivedSuppliers = suppliers.filter((supplier) => !supplier.active);

      set({ suppliers, activeSuppliers, archivedSuppliers });
    } catch (error) {
      const errorMessage = await getApiErrorMessage(error, "Error loading suppliers");
      toast.error(errorMessage);
    } finally {
      set({ isLoading: false });
    }
  },

  getSupplierById: (id: number) => {
    return get().suppliers.find((supplier) => supplier.id === id);
  },
}));

export default useSupplierStore;
