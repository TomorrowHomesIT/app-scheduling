import { create } from "zustand";

interface LoadingStore {
  // Global loading state
  isLoading: boolean;
  // Actions
  setLoading: (isLoading: boolean, message?: string) => void;
  reset: () => void;
}

const useGlobalLoadingStore = create<LoadingStore>((set) => ({
  // Initial state
  isLoading: false,

  setLoading: (isLoading, message) => {
    set((state) => {
      return {
        ...state,
        isLoading,
        message,
      };
    });
  },

  reset: () => {
    set({
      isLoading: false,
    });
  },
}));

export default useGlobalLoadingStore;
