"use client";

import { createClient } from "@/lib/supabase/client";
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { offlineQueue } from "@/lib/offline-queue";
import { jobsDB } from "@/lib/jobs-db";

interface AuthContextType {
  isAuthLoading: boolean;
  isAuthenticated: boolean;
  userId: string;
  logout: () => Promise<void>;
  login: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [userId, setUserId] = useState("");
  const supabase = createClient();

  useEffect(() => {
    const checkClaims = async () => {
      const { data, error } = await supabase.auth.getClaims();
      setUserId(data?.claims?.sub || "");
      setIsAuthenticated(!error && !!data?.claims);
      setIsAuthLoading(false);
    };

    checkClaims();
  }, [supabase.auth.getClaims]);

  const logout = async () => {
    await supabase.auth.signOut();
    setIsAuthenticated(false);

    // Clear offline queue and jobs data on logout
    await offlineQueue.clearQueue();
    await jobsDB.clearAll();
  };

  const login = () => {
    setIsAuthenticated(true);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, isAuthLoading, logout, login, userId }}>{children}</AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within a AuthProvider");
  }
  return context;
}
