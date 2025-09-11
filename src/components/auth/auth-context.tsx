"use client";

import { createClient } from "@/lib/supabase/client";
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { offlineQueue } from "@/lib/offline-queue";

interface AuthContextType {
  isAuthLoading: boolean;
  isAuthenticated: boolean;
  logout: () => Promise<void>;
  login: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    const checkClaims = async () => {
      const { data, error } = await supabase.auth.getClaims();
      setIsAuthenticated(!error && !!data?.claims);
      setIsAuthLoading(false);
    };

    checkClaims();
  }, [supabase.auth.getClaims]);

  const logout = async () => {
    await supabase.auth.signOut();
    setIsAuthenticated(false);

    // Clear offline queue on logout
    offlineQueue.clearQueue();
  };

  const login = () => {
    setIsAuthenticated(true);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, isAuthLoading, logout, login }}>{children}</AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within a AuthProvider");
  }
  return context;
}
