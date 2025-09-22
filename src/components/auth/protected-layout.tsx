import { useNavigate, Outlet } from "react-router";
import { useEffect } from "react";
import { useAuth } from "./auth-context";

export function ProtectedLayout() {
  const { isAuthLoading, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthLoading && !isAuthenticated) {
      navigate("/auth/login");
    }
  }, [isAuthLoading, isAuthenticated, navigate]);

  // Don't render protected content until auth is checked and user is authenticated
  if (isAuthLoading || !isAuthenticated) {
    return null;
  }

  return <Outlet />;
}
