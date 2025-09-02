import { create } from "zustand";
import type { ISupplier } from "@/models/supplier.model";
import { suppliers as mockSuppliers } from "../lib/mock-data";

interface SupplierStore {
  suppliers: ISupplier[];
  isLoaded: boolean;
  loadSuppliers: () => Promise<void>;
  getSupplierById: (id: number) => ISupplier | undefined;
}

// Simulate API delay
const simulateApiDelay = () => new Promise((resolve) => setTimeout(resolve, 200));

// Mock API function
const fetchSuppliersFromApi = async (): Promise<ISupplier[]> => {
  await simulateApiDelay();
  return mockSuppliers;
};

const useSupplierStore = create<SupplierStore>((set, get) => ({
  suppliers: [],
  isLoaded: false,

  loadSuppliers: async () => {
    if (get().isLoaded) return; // Don't load if already loaded

    const suppliers = await fetchSuppliersFromApi();
    set({ suppliers, isLoaded: true });
  },

  getSupplierById: (id: number) => {
    return get().suppliers.find((supplier) => supplier.id === id);
  },
}));

export default useSupplierStore;
