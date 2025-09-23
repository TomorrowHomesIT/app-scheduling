import { createClient } from "@/lib/supabase/client";
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import offlineQueue from "@/lib/offline-queue";
import { jobsDB } from "@/lib/jobs-db";

interface AuthContextType {
  isAuthLoading: boolean;
  isAuthenticated: boolean;
  user: IUserProfile | null;
  logout: () => Promise<void>;
  login: () => void;
  getAccessToken: () => Promise<string | null>;
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
    await offlineQueue.clearQueue();
    await jobsDB.clearAll();
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

  const getAccessToken = async (): Promise<string | null> => {
    if (!isAuthenticated) return null;

    const {
      data: { session },
    } = await supabase.auth.getSession();
    return session?.access_token || null;
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, isAuthLoading, logout, login, user, getAccessToken }}>
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
