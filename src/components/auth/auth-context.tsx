"use client";

import { createClient } from "@/lib/supabase/client";
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { offlineQueue } from "@/lib/offline-queue";
import { jobsDB } from "@/lib/jobs-db";
import useOfflineStore from "@/store/offline-store";

interface AuthContextType {
  isAuthLoading: boolean;
  isAuthenticated: boolean;
  user: IUserProfile | null;
  logout: () => Promise<void>;
  login: () => void;
}

interface IUserProfile {
  id?: string;
  email?: string;
  name?: string;
  avatar_url?: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const { setOfflineMode } = useOfflineStore();
  const [user, setUser] = useState<IUserProfile | null>(null);
  const supabase = createClient();

  useEffect(() => {
    const checkClaims = async () => {
      const { data, error } = await supabase.auth.getClaims();
      setUser({
        id: data?.claims?.sub,
        email: data?.claims?.email,
        name: data?.claims?.full_name || data?.claims?.name,
        avatar_url: data?.claims?.avatar_url,
      });
      setIsAuthenticated(!error && !!data?.claims);
      setIsAuthLoading(false);
    };

    checkClaims();
  }, [supabase.auth.getClaims]);

  const logout = async () => {
    await supabase.auth.signOut();
    setIsAuthenticated(false);
    setUser(null);

    // Clear offline queue and jobs data on logout
    await setOfflineMode(false);
  };

  const login = async () => {
    setIsAuthenticated(true);
    setIsAuthLoading(false);

    const { data } = await supabase.auth.getClaims();

    setUser({
      id: data?.claims?.sub,
      email: data?.claims?.email,
      name: data?.claims?.full_name || data?.claims?.name,
      avatar_url: data?.claims?.avatar_url,
    });
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, isAuthLoading, logout, login, user }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within a AuthProvider");
  }
  return context;
}
