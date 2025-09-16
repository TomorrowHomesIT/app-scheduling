"use client";

import { useEffect } from "react";
import { AuthProvider, useAuth } from "@/components/auth/auth-context";
import { Sidebar } from "@/components/sidebar/sidebar";
import { SidebarProvider, useSidebar } from "@/components/sidebar/sidebar-context";
import useOwnersStore from "@/store/owners-store";
import useSupplierStore from "@/store/supplier-store";
import type { ReactNode } from "react";
import useJobStore from "@/store/job/job-store";
import useTaskStore from "@/store/task-store";
import useLoadingStore from "@/store/loading-store";
import { Spinner } from "@/components/ui/spinner";

/** Function is required so that useSidebar is used within the context */
function AppLayoutContent({ children }: { children: ReactNode }) {
  const { isSidebarOpen, setIsSidebarOpen } = useSidebar();
  const { isAuthenticated } = useAuth();
  const { loadOwners } = useOwnersStore();
  const { loadSuppliers } = useSupplierStore();
  const { loadUserJobs } = useJobStore();
  const { loadTaskStages } = useTaskStore();
  const { isLoading } = useLoadingStore();

  // Bootstrap all data when user is authenticated
  useEffect(() => {
    if (!isAuthenticated) return;
    // TODO should we remove cached data?

    const bootstrapData = async () => {
      try {
        console.log("Bootstrapping data...");
        await Promise.all([loadOwners(), loadSuppliers(), loadUserJobs(), loadTaskStages()]);
        console.log("Data bootstrapped successfully");
      } catch (error) {
        console.error("Failed to bootstrap data:", error);
      }
    };

    bootstrapData();
  }, [isAuthenticated, loadOwners, loadSuppliers, loadUserJobs, loadTaskStages]);

  if (isLoading && isAuthenticated) {
    return (
      <div className="flex items-center justify-center h-full w-full">
        <Spinner variant="default" size="xl" />
      </div>
    );
  }

  return (
    <>
      {isAuthenticated && <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />}
      <main className="flex-1 overflow-auto flex flex-col">{children}</main>
    </>
  );
}

export function AppLayoutClient({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <AuthProvider>
      <SidebarProvider>
        <AppLayoutContent>{children}</AppLayoutContent>
      </SidebarProvider>
    </AuthProvider>
  );
}
