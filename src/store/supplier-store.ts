import { create } from "zustand";
import type { ISupplier } from "@/models/supplier.model";

interface SupplierStore {
  suppliers: ISupplier[];
  isLoaded: boolean;
  loadSuppliers: () => Promise<void>;
  getSupplierById: (id: number) => ISupplier | undefined;
}

const fetchSuppliers = async (): Promise<ISupplier[]> => {
  const response = await fetch("/api/suppliers");

  if (!response.ok) {
    throw new Error(`Failed to fetch suppliers: ${response.statusText}`);
  }

  return response.json();
};

const useSupplierStore = create<SupplierStore>((set, get) => ({
  suppliers: [],
  isLoaded: false,

  loadSuppliers: async () => {
    if (get().isLoaded) return; // Don't load if already loaded

    try {
      const suppliers = await fetchSuppliers();
      set({ suppliers, isLoaded: true });
    } catch (error) {
      console.error("Error loading suppliers:", error);
      // TODO might want to set an error state here
    }
  },

  getSupplierById: (id: number) => {
    return get().suppliers.find((supplier) => supplier.id === id);
  },
}));

export default useSupplierStore;
