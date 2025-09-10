"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { X, Share } from "lucide-react";

export function PWAInstaller() {
  const [showIOSPrompt, setShowIOSPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsInstalled(true);
      return;
    }

    // Check if it's iOS
    const userAgent = navigator.userAgent;
    const isIOSDevice = /iPad|iPhone|iPod/.test(userAgent);

    if (isIOSDevice) {
      setIsIOS(true);

      // Check if user has dismissed this before
      const dismissed = localStorage.getItem("ios-install-dismissed");
      if (!dismissed) {
        // Show prompt after a short delay
        setTimeout(() => setShowIOSPrompt(true), 2000);
      }
    }

    // For non-iOS devices, let the browser handle it natively
    // The beforeinstallprompt event will be handled by the browser
  }, []);

  const dismissPrompt = () => {
    localStorage.setItem("ios-install-dismissed", "true");
    setShowIOSPrompt(false);
  };

  // Only show for iOS devices that haven't installed and haven't dismissed
  if (!isIOS || isInstalled || !showIOSPrompt) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 bg-white border border-gray-200 rounded-lg shadow-lg p-4 z-50">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900 mb-1">Install App</h3>
          <p className="text-sm text-gray-600">
            Add BASD Scheduling to your home screen for quick access and offline use
          </p>
        </div>
        <button type="button" onClick={dismissPrompt} className="text-gray-400 hover:text-gray-600 ml-2">
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-md p-3 mb-3">
        <div className="flex items-start gap-2">
          <Share className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-blue-900">
            <p className="font-medium mb-1">To install on Apple:</p>
            <ol className="space-y-1 text-xs">
              <li>
                1. Tap the Share button <Share className="w-3 h-3 inline" /> at the bottom
              </li>
              <li>2. Scroll down and tap "Add to Home Screen"</li>
              <li>3. Tap "Add" to confirm</li>
            </ol>
          </div>
        </div>
      </div>

      <Button variant="outline" onClick={dismissPrompt} className="w-full">
        Got it, thanks!
      </Button>
    </div>
  );
}
