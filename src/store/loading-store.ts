import { create } from "zustand";

interface LoadingState {
  isLoading: boolean;
  isLoaded: boolean;
  error: string | null;
}

interface CurrentJobLoadingState {
  isLoading: boolean;
  message: string | null;
  error: string | null;
}

interface LoadingStore {
  // Individual loading states
  owners: LoadingState;
  suppliers: LoadingState;
  jobs: LoadingState;
  taskStages: LoadingState;

  // The current job is seperate from the global loading state
  currentJob: CurrentJobLoadingState;

  // Global loading state
  isLoading: boolean;
  isGlobalLoaded: boolean;

  // Actions
  setLoading: (
    key: "owners" | "suppliers" | "taskStages" | "jobs" | "currentJob",
    isLoading: boolean,
    message?: string,
  ) => void;
  setLoaded: (key: "owners" | "suppliers" | "taskStages" | "jobs" | "currentJob", isLoaded: boolean) => void;
  setError: (key: "owners" | "suppliers" | "taskStages" | "jobs" | "currentJob", error: string | null) => void;
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
  taskStages: { isLoading: false, isLoaded: false, error: null },
  currentJob: { isLoading: false, message: null, error: null },
  isLoading: false,
  isGlobalLoaded: false,

  setLoading: (key, isLoading, message) => {
    set((state) => {
      const newState = {
        ...state,
        [key]: { ...state[key], isLoading, error: isLoading ? null : state[key].error, message },
      };

      // Update global isLoading only for states other than currentJob
      if (key === "currentJob") {
        return newState;
      }

      // For other states, update global isLoading
      const globalLoading =
        newState.owners.isLoading ||
        newState.suppliers.isLoading ||
        newState.jobs.isLoading ||
        newState.taskStages.isLoading;

      return {
        ...newState,
        isLoading: globalLoading,
      };
    });
  },

  setLoaded: (key, isLoaded) => {
    set((state) => {
      const newState = {
        ...state,
        [key]: { ...state[key], isLoaded, isLoading: false },
      };

      // Update global loaded state - all must be loaded
      const allLoaded =
        newState.owners.isLoaded && newState.suppliers.isLoaded && newState.jobs.isLoaded && newState.taskStages.isLoaded;
      const isLoading =
        newState.owners.isLoading ||
        newState.suppliers.isLoading ||
        newState.jobs.isLoading ||
        newState.taskStages.isLoading;

      return {
        ...newState,
        isGlobalLoaded: allLoaded,
        isLoading: !allLoaded && isLoading,
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
      taskStages: { isLoading: false, isLoaded: false, error: null },
      currentJob: { isLoading: false, message: null, error: null },
      isLoading: false,
      isGlobalLoaded: false,
    });
  },

  getIsLoading: () => {
    const state = get();
    return state.owners.isLoading || state.suppliers.isLoading || state.jobs.isLoading || state.taskStages.isLoading;
  },

  getIsLoaded: () => {
    const state = get();
    return state.owners.isLoaded && state.suppliers.isLoaded && state.jobs.isLoaded && state.taskStages.isLoaded;
  },

  getHasError: () => {
    const state = get();
    return !!(state.owners.error || state.suppliers.error || state.jobs.error || state.taskStages.error);
  },
}));

export default useLoadingStore;
