import { useAuth } from "@/components/auth/auth-context";
import { Logo } from "@/components/ui/logo";
import { useEffect } from "react";
import { Outlet, useNavigate } from "react-router";

export default function AuthLayout() {
  const { isAuthLoading, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthLoading && isAuthenticated) {
      navigate("/");
    }
  }, [isAuthLoading, isAuthenticated, navigate]);

  if (isAuthLoading || isAuthenticated) {
    return null;
  }

  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm flex flex-col gap-6">
        <Logo text="Onsite" />
        <Outlet />
      </div>
    </div>
  );
}
