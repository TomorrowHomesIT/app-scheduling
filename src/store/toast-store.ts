import { create } from "zustand";

export type TToastType = "success" | "error" | "warning" | "loading";

export interface IToast {
  id: string;
  message: string;
  type: TToastType;
  duration?: number;
  createdAt: number;
  isRemoving?: boolean;
}

interface IToastStore {
  toasts: IToast[];
  addToast: (toast: Omit<IToast, "id" | "createdAt">) => string;
  removeToast: (id: string) => void;
  updateToast: (id: string, updates: Partial<IToast>) => void;
  clearAllToasts: () => void;
}

export const useToastStore = create<IToastStore>((set, get) => ({
  toasts: [],

  addToast: (toast) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const newToast: IToast = {
      ...toast,
      id,
      createdAt: Date.now(),
      duration: toast.duration ?? (toast.type === "loading" ? 0 : 5000),
    };

    set((state) => ({
      toasts: [...state.toasts, newToast],
    }));

    // Auto-remove after duration (if not loading type and duration is set)
    if (newToast.duration && newToast.duration > 0) {
      setTimeout(() => {
        get().removeToast(id);
      }, newToast.duration);
    }

    return id;
  },

  removeToast: (id) => {
    // First mark as removing for animation
    set((state) => ({
      toasts: state.toasts.map((toast) => (toast.id === id ? { ...toast, isRemoving: true } : toast)),
    }));

    // Then actually remove after animation
    setTimeout(() => {
      set((state) => ({
        toasts: state.toasts.filter((toast) => toast.id !== id),
      }));
    }, 300);
  },

  updateToast: (id, updates) => {
    set((state) => ({
      toasts: state.toasts.map((toast) => (toast.id === id ? { ...toast, ...updates } : toast)),
    }));

    // If updating to a non-loading type with duration, auto-remove
    if (updates.type && updates.type !== "loading" && updates.duration !== 0) {
      const duration = updates.duration ?? 5000;
      setTimeout(() => {
        get().removeToast(id);
      }, duration);
    }
  },

  clearAllToasts: () => {
    set({ toasts: [] });
  },
}));

// Helper functions for common toast operations
export const toast = {
  success: (message: string, duration?: number) => {
    return useToastStore.getState().addToast({ message, type: "success", duration });
  },
  error: (message: string, duration?: number) => {
    return useToastStore.getState().addToast({ message, type: "error", duration });
  },
  warning: (message: string, duration?: number) => {
    return useToastStore.getState().addToast({ message, type: "warning", duration });
  },
  loading: (message: string) => {
    return useToastStore.getState().addToast({ message, type: "loading", duration: 0 });
  },
  while: async <T>(
    promise: Promise<T>,
    messages: {
      loading: string;
      success: string | ((data: T) => string);
      error: string | ((error: unknown) => string);
    },
  ): Promise<T> => {
    const id = toast.loading(messages.loading);
    try {
      const result = await promise;
      const successMsg = typeof messages.success === "function" ? messages.success(result) : messages.success;
      useToastStore.getState().updateToast(id, {
        message: successMsg,
        type: "success",
        duration: 1000,
      });
      return result;
    } catch (error) {
      const errorMsg = typeof messages.error === "function" ? messages.error(error) : messages.error;
      useToastStore.getState().updateToast(id, {
        message: errorMsg,
        type: "error",
        duration: 8000,
      });
      throw error;
    }
  },
};
