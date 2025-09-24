import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RefreshCw } from "lucide-react";
import { LogoutButton } from "@/components/auth/logout-button";
import { PageHeader } from "@/components/page-header";
import { ConfirmationModal } from "@/components/modals/confirm/confirm-modal";
import useAppStore from "@/store/app.store";

export default function SettingsPage() {
  const [showServiceWorkerRefreshDialog, setShowServiceWorkerRefreshDialog] = useState(false);

  const { isRestarting, restartApp, hardRestartApp } = useAppStore();

  return (
    <div className="flex flex-col h-full bg-background">
      <div className="border-b bg-background">
        <PageHeader title="Settings" backLink="/" description="Application settings and diagnostics" />
      </div>

      <div className="container mx-auto p-6 sm:max-w-4xl space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Version</CardTitle>
            <CardDescription>Beta 1.0.1</CardDescription>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Restarts</CardTitle>
            <CardDescription>These are designed to update and help clear issues with the app</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col sm:flex-row justify-between gap-2">
              <Button onClick={restartApp} disabled={isRestarting} className="flex-1 sm:w-auto" variant="default">
                <RefreshCw className={`mr-2 h-4 w-4 ${isRestarting ? "animate-spin" : ""}`} />
                Restart App
              </Button>

              <Button
                onClick={() => setShowServiceWorkerRefreshDialog(true)}
                disabled={isRestarting}
                variant="destructive"
                className="flex-1 sm:w-auto"
              >
                <RefreshCw className={`mr-2 h-4 w-4 ${isRestarting ? "animate-spin" : ""}`} />
                Hard Restart App
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
        onConfirm={hardRestartApp}
      />
    </div>
  );
}
