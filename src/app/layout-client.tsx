"use client";

import { useEffect, useState } from "react";
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
import { useRouter } from "next/navigation";
import useOfflineStore from "@/store/offline-store";

/** Function is required so that useSidebar is used within the context */
function AppLayoutContent({ children }: { children: ReactNode }) {
  const { isSidebarOpen, setIsSidebarOpen } = useSidebar();
  const { isAuthenticated, user } = useAuth();
  const { loadOwners, owners } = useOwnersStore();
  const { loadSuppliers } = useSupplierStore();
  const { loadUserJobs } = useJobStore();
  const { loadTaskStages } = useTaskStore();
  const { isLoading } = useLoadingStore();
  const { initializeOfflineMode, isOfflineModeEnabled } = useOfflineStore();
  const router = useRouter();
  const [isPreloadingRoutes, setIsPreloadingRoutes] = useState(false);
  const [preloadingProgress, setPreloadingProgress] = useState({ current: 0, total: 0 });

  // Bootstrap all data when user is authenticated
  useEffect(() => {
    if (!isAuthenticated) return;
    // TODO should we remove cached data?

    const bootstrapData = async () => {
      try {
        console.log("Bootstrapping data...");
        const isOfflineEnabled = await initializeOfflineMode();
        const promise = [loadOwners(), loadSuppliers(), loadTaskStages()];

        if (isOfflineEnabled) {
          promise.push(loadUserJobs());
        }

        await Promise.all(promise);
        console.log("Data bootstrapped successfully");
      } catch (error) {
        console.error("Failed to bootstrap data:", error);
      }
    };

    bootstrapData();
  }, [isAuthenticated, loadOwners, loadSuppliers, loadUserJobs, loadTaskStages, initializeOfflineMode]);

  // Navigate to all routes to preload them for offline access
  useEffect(() => {
    if (!isAuthenticated || !owners?.length || !isOfflineModeEnabled) return;

    console.log("Navigating to all routes for offline preloading...");

    // Collect all job routes from owners
    const jobRoutes: string[] = [];
    owners.forEach((owner) => {
      if (owner.jobs && owner.userId && owner.userId === user?.id) {
        owner.jobs.forEach((job) => {
          jobRoutes.push(`/jobs/${job.id}`);
        });
      }
    });

    if (!jobRoutes.length) return;
    const coreRoutes = ["/", "/jobs", "/offline"];
    const allRoutes = [...coreRoutes, ...jobRoutes];

    console.log(`Navigating to ${allRoutes.length} routes for preloading:`, allRoutes);

    // Navigate to each route sequentially to ensure full loading
    const navigateToRoutes = async () => {
      setIsPreloadingRoutes(true);
      setPreloadingProgress({ current: 0, total: allRoutes.length });

      // Check if we're offline before attempting navigation
      if (!navigator.onLine) {
        setIsPreloadingRoutes(false);
        return;
      }

      for (let i = 0; i < allRoutes.length; i++) {
        const route = allRoutes[i];
        try {
          console.log(`Navigating to: ${route} (${i + 1}/${allRoutes.length})`);
          setPreloadingProgress({ current: i + 1, total: allRoutes.length });
          router.push(route);
          // Wait a bit for the route to fully load
          await new Promise((resolve) => setTimeout(resolve, 1000));
        } catch (error) {
          console.error(`Failed to navigate to ${route}:`, error);
        }
      }

      console.log("Finished preloading all routes");
      router.push(jobRoutes[0]);
      await new Promise((resolve) => setTimeout(resolve, 200));
      setIsPreloadingRoutes(false);
    };

    navigateToRoutes();
  }, [isAuthenticated, owners, router, user, isOfflineModeEnabled]);

  if ((isLoading || isPreloadingRoutes) && isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center h-full w-full space-y-4">
        <Spinner variant="default" size="xl" />
        {!isPreloadingRoutes && <p className="text-sm text-gray-600">Loading jobs, tasks, and suppliers...</p>}
        {isPreloadingRoutes && (
          <div className="text-center">
            <p className="text-sm text-gray-600">Loading offline access...</p>
            <p className="text-xs text-gray-500">
              {preloadingProgress.current} of {preloadingProgress.total} pages loaded
            </p>
          </div>
        )}
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
