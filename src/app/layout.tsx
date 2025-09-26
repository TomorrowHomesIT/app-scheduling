import { useEffect } from "react";
import { AuthProvider, useAuth } from "@/components/auth/auth-context";
import { Sidebar } from "@/components/sidebar/sidebar";
import { SidebarProvider, useSidebar } from "@/components/sidebar/sidebar-context";
import useOwnersStore from "@/store/owners-store";
import useSupplierStore from "@/store/supplier-store";
import type { ReactNode } from "react";
import useTaskStore from "@/store/task-store";
import useLoadingStore from "@/store/loading-store";
import { Spinner } from "@/components/ui/spinner";
import useJobSyncStore from "@/store/job/job-sync-store";
import logger from "@/lib/logger";

/** Function is required so that useSidebar is used within the context */
function AppLayoutContent({ children }: { children: ReactNode }) {
  const { isSidebarOpen, setIsSidebarOpen } = useSidebar();
  const { isAuthenticated } = useAuth();
  const { loadOwners } = useOwnersStore();
  const { loadSuppliers } = useSupplierStore();
  const { loadTaskStages } = useTaskStore();
  const { isLoading, setLoading } = useLoadingStore();
  const { syncUserJobs } = useJobSyncStore();

  // Bootstrap core data when user is authenticated (runs when isAuthenticated changes)
  useEffect(() => {
    if (!isAuthenticated) return;

    const bootstrapCoreData = async () => {
      setLoading(true);
      try {
        console.log("Bootstrapping core data...");
        await Promise.all([loadOwners(), syncUserJobs(), loadSuppliers(), loadTaskStages()]);
        logger.log("App bootstrapped successfully");
      } catch (error) {
        logger.error("App bootstrap failed", { Error: JSON.stringify(error) });
      } finally {
        setLoading(false);
      }
    };

    bootstrapCoreData();
  }, [isAuthenticated, loadOwners, loadSuppliers, loadTaskStages, syncUserJobs, setLoading]);

  // Show full loading screen during initial data loading
  if (isLoading && isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center h-full w-full space-y-4">
        <Spinner variant="default" size="xl" />
      </div>
    );
  }

  return (
    <>
      {isAuthenticated && <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />}
      <main className="flex-1 overflow-auto flex flex-col relative">{children}</main>
    </>
  );
}

export function AppLayout({
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
