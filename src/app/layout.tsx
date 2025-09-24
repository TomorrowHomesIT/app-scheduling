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
import { setupServiceWorkerAuth, clearServiceWorkerAuth } from "@/lib/service-worker-auth";
import useJobSyncStore from "@/store/job/job-sync-store";
import { swVisibilityNotifier } from "@/lib/sw-visibility-notifier";

/** Function is required so that useSidebar is used within the context */
function AppLayoutContent({ children }: { children: ReactNode }) {
  const { isSidebarOpen, setIsSidebarOpen } = useSidebar();
  const { isAuthenticated, getAccessToken, isAuthLoading } = useAuth();
  const { loadOwners } = useOwnersStore();
  const { loadSuppliers } = useSupplierStore();
  const { loadTaskStages } = useTaskStore();
  const { isLoading } = useLoadingStore();
  const { syncUserJobs } = useJobSyncStore();
  // Bootstrap core data when user is authenticated (runs when isAuthenticated changes)
  useEffect(() => {
    if (!isAuthenticated) return;

    const bootstrapCoreData = async () => {
      try {
        console.log("Bootstrapping core data...");
        await Promise.all([loadOwners(), syncUserJobs(), loadSuppliers(), loadTaskStages()]);
        console.log("Core data bootstrapped successfully");
      } catch (error) {
        console.error("Failed to bootstrap core data:", error);
      }
    };

    bootstrapCoreData();
  }, [isAuthenticated, loadOwners, loadSuppliers, loadTaskStages, syncUserJobs]);

  // Handle service worker auth - setup on login, clear on logout
  // TODO this doesn't look to handle refreshed token? Or d
  useEffect(() => {
    const handleServiceWorkerAuth = async () => {
      if (isAuthLoading) return;

      if (isAuthenticated) {
        const accessToken = getAccessToken();
        if (accessToken) {
          await setupServiceWorkerAuth(accessToken);
          swVisibilityNotifier.initialize();
          console.log("Service worker auth setup complete");
        }
      } else {
        // Clear auth when user logs out
        clearServiceWorkerAuth();
        swVisibilityNotifier.destroy();
        console.log("Service worker auth cleared");
      }
    };

    handleServiceWorkerAuth();
  }, [isAuthenticated, getAccessToken, isAuthLoading]);

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
