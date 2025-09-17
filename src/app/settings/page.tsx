"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RefreshCw, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { LogoutButton } from "@/components/auth/logout-button";

export default function SettingsPage() {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [swStatus, setSwStatus] = useState<string | null>(null);

  const handleHardRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      window.location.reload();
    }, 500);
  };

  const handleServiceWorkerRefresh = async () => {
    setIsRefreshing(true);
    setSwStatus("Updating service worker...");

    try {
      if ("serviceWorker" in navigator && navigator.serviceWorker.controller) {
        const registrations = await navigator.serviceWorker.getRegistrations();

        for (const registration of registrations) {
          await registration.unregister();
        }

        setSwStatus("Service worker unregistered. Refreshing...");

        setTimeout(() => {
          window.location.reload();
        }, 1000);
      } else {
        setSwStatus("No service worker found or not supported");
        setIsRefreshing(false);
      }
    } catch (error) {
      console.error("Error refreshing service worker:", error);
      setSwStatus("Error refreshing service worker");
      setIsRefreshing(false);
    }
  };

  const handleFullRefresh = async () => {
    setIsRefreshing(true);
    setSwStatus("Clearing all caches and refreshing...");

    try {
      if ("serviceWorker" in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        for (const registration of registrations) {
          await registration.unregister();
        }
      }

      if ("caches" in window) {
        const cacheNames = await caches.keys();
        await Promise.all(cacheNames.map((cacheName) => caches.delete(cacheName)));
      }

      setSwStatus("All caches cleared. Refreshing...");

      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (error) {
      console.error("Error during full refresh:", error);
      setSwStatus("Error during full refresh");
      setIsRefreshing(false);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">Settings</h1>

      <div className="space-y-6">
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
                variant="outline"
              >
                <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
                Restart App
              </Button>

              <Button
                onClick={handleServiceWorkerRefresh}
                disabled={isRefreshing}
                variant="outline"
                className="flex-1 sm:w-auto"
              >
                <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
                Restart Service Worker
              </Button>

              <Button
                onClick={handleFullRefresh}
                disabled={isRefreshing}
                variant="destructive"
                className="flex-1 sm:w-auto"
              >
                <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
                Clear Cache & Reload
              </Button>
            </div>

            {swStatus && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{swStatus}</AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>About</CardTitle>
            <CardDescription>Application information and diagnostics</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Service Worker:</span>
                <span>
                  {"serviceWorker" in navigator
                    ? navigator.serviceWorker.controller
                      ? "Active"
                      : "Inactive"
                    : "Not Supported"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Online Status:</span>
                <span>{navigator.onLine ? "Online" : "Offline"}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <LogoutButton />
      </div>
    </div>
  );
}
