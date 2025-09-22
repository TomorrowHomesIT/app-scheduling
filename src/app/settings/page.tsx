import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RefreshCw, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { LogoutButton } from "@/components/auth/logout-button";
import { PageHeader } from "@/components/page-header";
import useOfflineStore from "@/store/offline-store";
import { ConfirmationModal } from "@/components/modals/confirm/confirm-modal";

export default function SettingsPage() {
  const [showServiceWorkerRefreshDialog, setShowServiceWorkerRefreshDialog] = useState(false);
  const [showFullRefreshDialog, setShowFullRefreshDialog] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [reloadStatus, setReloadStatus] = useState<string | null>(null);
  const { clearCache } = useOfflineStore();

  const handleHardRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      window.location.reload();
    }, 500);
  };

  const handleServiceWorkerRefresh = async () => {
    setIsRefreshing(true);
    setReloadStatus("Updating service worker...");

    try {
      if ("serviceWorker" in navigator && navigator.serviceWorker.controller) {
        const registrations = await navigator.serviceWorker.getRegistrations();

        for (const registration of registrations) {
          await registration.unregister();
        }

        setReloadStatus("Service worker unregistered. Refreshing...");

        setTimeout(() => {
          window.location.reload();
        }, 1000);
      } else {
        setReloadStatus("No service worker found or not supported");
        setIsRefreshing(false);
      }
    } catch (error) {
      console.error("Error refreshing service worker:", error);
      setReloadStatus("Error refreshing service worker");
      setIsRefreshing(false);
    }
  };

  const handleFullRefresh = async () => {
    setIsRefreshing(true);
    setReloadStatus("Clearing all caches and refreshing...");

    try {
      if ("serviceWorker" in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        for (const registration of registrations) {
          console.log("Unregistering service worker:", registration.scope);
          await registration.unregister();
        }
      }

      await clearCache();

      setReloadStatus("All caches cleared. Refreshing...");

      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (error) {
      console.error("Error during full refresh:", error);
      setReloadStatus("Error during full refresh");
      setIsRefreshing(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-background">
      <div className="border-b bg-background">
        <PageHeader title="Settings" backLink="/" description="Application settings and diagnostics" />
      </div>

      <div className="container mx-auto p-6 sm:max-w-4xl space-y-6">
        {reloadStatus && (
          <Alert variant="warning">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{reloadStatus}</AlertDescription>
          </Alert>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Restarts</CardTitle>
            <CardDescription>
              These are designed to update and help clear issues with the app. Avoid using them unless necessary.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col sm:flex-row justify-between gap-2">
              <Button
                onClick={handleHardRefresh}
                disabled={isRefreshing}
                className="flex-1 sm:w-auto"
                variant="default"
              >
                <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
                Restart App
              </Button>

              <Button
                onClick={() => setShowServiceWorkerRefreshDialog(true)}
                disabled={isRefreshing}
                variant="destructive"
                className="flex-1 sm:w-auto"
              >
                <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
                Restart Service Worker
              </Button>

              <Button
                onClick={() => setShowFullRefreshDialog(true)}
                disabled={isRefreshing}
                variant="destructive"
                className="flex-1 sm:w-auto"
              >
                <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
                Clear Cache & Reload
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <LogoutButton />
        </div>
      </div>

      <ConfirmationModal
        open={showServiceWorkerRefreshDialog}
        onOpenChange={setShowServiceWorkerRefreshDialog}
        description="This will cause the service worker to be unregistered and the app to be refreshed. This is useful if you are missing a required update."
        confirmText="Do it"
        onConfirm={handleServiceWorkerRefresh}
      />

      <ConfirmationModal
        open={showFullRefreshDialog}
        onOpenChange={setShowFullRefreshDialog}
        description="This may result in data loss if there are un-synced changes. This will clear page and data caches and reload the app. If you are offline, it may not reload."
        confirmText="Do it"
        onConfirm={handleFullRefresh}
      />
    </div>
  );
}
