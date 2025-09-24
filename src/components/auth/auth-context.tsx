import { createClient } from "@/lib/supabase/client";
import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from "react";
import offlineQueue from "@/lib/offline-queue";
import { jobsDB } from "@/lib/jobs-db";
import { clearServiceWorkerAuth, setupServiceWorkerAuth } from "@/lib/service-worker-auth";
import { swVisibilityNotifier } from "@/lib/sw-visibility-notifier";

interface AuthContextType {
  isAuthLoading: boolean;
  isAuthenticated: boolean;
  user: IUserProfile | null;
  accessToken: string | null;
  logout: () => Promise<void>;
  getAccessToken: () => string | null;
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
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const supabase = createClient();

  /**
   * Common tasks to be handled when Supabase lets us know the user is authenticated
   */
  const handleLogin = useCallback(async () => {
    setIsAuthenticated(true);
    setIsAuthLoading(false);

    const { data } = await supabase.auth.getClaims();
    setUser({
      id: data?.claims?.sub,
      email: data?.claims?.email,
      name: data?.claims?.full_name || data?.claims?.name,
      avatar_url: data?.claims?.avatar_url,
    });

    const {
      data: { session },
    } = await supabase.auth.getSession();
    setAccessToken(session?.access_token || null);

    if (session?.access_token) {
      await setupServiceWorkerAuth(session.access_token);
      swVisibilityNotifier.initialize();
    }
  }, [supabase.auth]);

  /**
   * Common tasks to be handled when Supabase lets us know the user is logged out
   */
  const handleLogout = useCallback(async () => {
    setIsAuthenticated(false);
    setIsAuthLoading(false);
    setUser(null);
    setAccessToken(null);
    // Database
    await offlineQueue.clearQueue();
    await jobsDB.clearAll();
    // Service worker
    clearServiceWorkerAuth();
    swVisibilityNotifier.destroy();
  }, []);

  /**
   * Listen for auth state changes - fires on page load and when user logs in/out
   */
  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT" || (event === "TOKEN_REFRESHED" && !session)) {
        handleLogout();
      } else if (event === "SIGNED_IN" || (event === "TOKEN_REFRESHED" && session)) {
        handleLogin();
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase.auth, handleLogin, handleLogout]);

  const logout = async () => {
    await supabase.auth.signOut();
  };

  const getAccessToken = (): string | null => {
    return accessToken;
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, isAuthLoading, logout, accessToken, user, getAccessToken }}>
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
