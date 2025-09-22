import { useEffect, useRef } from "react";
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
import { registerServiceWorker, unregisterServiceWorker } from "@/lib/service-worker-registration";

/** Function is required so that useSidebar is used within the context */
function AppLayoutContent({ children }: { children: ReactNode }) {
  const { isSidebarOpen, setIsSidebarOpen } = useSidebar();
  const { isAuthenticated } = useAuth();
  const { loadOwners } = useOwnersStore();
  const { loadSuppliers } = useSupplierStore();
  const { loadUserJobs } = useJobStore();
  const { loadTaskStages } = useTaskStore();
  const { isLoading } = useLoadingStore();
  const serviceWorkerRegistered = useRef(false);

  // Bootstrap core data when user is authenticated (runs when isAuthenticated changes)
  useEffect(() => {
    if (!isAuthenticated) return;

    const bootstrapCoreData = async () => {
      try {
        console.log("Bootstrapping core data...");
        await Promise.all([loadOwners(), loadUserJobs(), loadSuppliers(), loadTaskStages()]);
        console.log("Core data bootstrapped successfully");
      } catch (error) {
        console.error("Failed to bootstrap core data:", error);
      }
    };

    bootstrapCoreData();
  }, [isAuthenticated, loadOwners, loadSuppliers, loadTaskStages, loadUserJobs]);

  // Register/unregister service worker based on authentication
  useEffect(() => {
    if (isAuthenticated && !serviceWorkerRegistered.current) {
      // Register service worker when user logs in
      registerServiceWorker().then(() => {
        serviceWorkerRegistered.current = true;
        console.log('Service worker registered after login');
      }).catch((error) => {
        console.error('Failed to register service worker:', error);
      });
    } else if (!isAuthenticated && serviceWorkerRegistered.current) {
      // Unregister service worker when user logs out
      unregisterServiceWorker();
      serviceWorkerRegistered.current = false;
      console.log('Service worker unregistered after logout');
    }
  }, [isAuthenticated]);

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
