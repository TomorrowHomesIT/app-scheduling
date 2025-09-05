import { create } from "zustand";
import type { ISupplier } from "@/models/supplier.model";
import { toast } from "./toast-store";
import { getApiErrorMessage } from "@/lib/api/error";

interface SupplierStore {
  suppliers: ISupplier[];
  archivedSuppliers: ISupplier[];
  isLoaded: boolean;
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
  isLoaded: false,
  isArchivedLoaded: false,

  loadSuppliers: async () => {
    if (get().isLoaded) return; // Don't load if already loaded

    try {
      const suppliers = await fetchSuppliers(true);
      set({ suppliers, isLoaded: true });
    } catch (error) {
      toast.error(await getApiErrorMessage(error));
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
