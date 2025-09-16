import { create } from "zustand";

interface LoadingState {
  isLoading: boolean;
  isLoaded: boolean;
  error: string | null;
}

interface LoadingStore {
  // Individual loading states
  owners: LoadingState;
  suppliers: LoadingState;
  jobs: LoadingState;

  // Global loading state
  isLoading: boolean;
  isGlobalLoaded: boolean;

  // Actions
  setLoading: (key: "owners" | "suppliers" | "jobs", isLoading: boolean) => void;
  setLoaded: (key: "owners" | "suppliers" | "jobs", isLoaded: boolean) => void;
  setError: (key: "owners" | "suppliers" | "jobs", error: string | null) => void;
  reset: () => void;

  // Computed getters
  getIsLoading: () => boolean;
  getIsLoaded: () => boolean;
  getHasError: () => boolean;
}

const useLoadingStore = create<LoadingStore>((set, get) => ({
  // Initial state
  owners: { isLoading: false, isLoaded: false, error: null },
  suppliers: { isLoading: false, isLoaded: false, error: null },
  jobs: { isLoading: false, isLoaded: false, error: null },
  isLoading: false,
  isGlobalLoaded: false,

  setLoading: (key, isLoading) => {
    set((state) => ({
      [key]: { ...state[key], isLoading, error: isLoading ? null : state[key].error },
      isLoading: isLoading || state.suppliers.isLoading || state.jobs.isLoading,
    }));
  },

  setLoaded: (key, isLoaded) => {
    set((state) => {
      const newState = {
        ...state,
        [key]: { ...state[key], isLoaded, isLoading: false },
      };

      // Update global loaded state - all must be loaded
      const allLoaded = newState.owners.isLoaded && newState.suppliers.isLoaded && newState.jobs.isLoaded;

      return {
        ...newState,
        isGlobalLoaded: allLoaded,
        isLoading: !allLoaded && (newState.owners.isLoading || newState.suppliers.isLoading || newState.jobs.isLoading),
      };
    });
  },

  setError: (key, error) => {
    set((state) => ({
      [key]: { ...state[key], error, isLoading: false },
    }));
  },

  reset: () => {
    set({
      owners: { isLoading: false, isLoaded: false, error: null },
      suppliers: { isLoading: false, isLoaded: false, error: null },
      jobs: { isLoading: false, isLoaded: false, error: null },
      isLoading: false,
      isGlobalLoaded: false,
    });
  },

  getIsLoading: () => {
    const state = get();
    return state.owners.isLoading || state.suppliers.isLoading || state.jobs.isLoading;
  },

  getIsLoaded: () => {
    const state = get();
    return state.owners.isLoaded && state.suppliers.isLoaded && state.jobs.isLoaded;
  },

  getHasError: () => {
    const state = get();
    return !!(state.owners.error || state.suppliers.error || state.jobs.error);
  },
}));

export default useLoadingStore;
