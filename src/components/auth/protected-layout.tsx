import { useNavigate } from "react-router";
import { useEffect } from "react";
import { useAuth } from "./auth-context";

export function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const { isAuthLoading, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthLoading) return;

    if (!isAuthenticated) {
      navigate("/auth/login");
    }
  }, [isAuthLoading, isAuthenticated, router]);

  return <>{children}</>;
}
