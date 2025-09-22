import { WifiOff } from "lucide-react";

export default function OfflinePage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-8">
      <div className="text-center max-w-md">
        <div className="mx-auto mb-6 w-24 h-24 bg-green-950 rounded-full flex items-center justify-center">
          <WifiOff className="w-12 h-12 text-green-100" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-3">You're Offline</h1>
        <p className="text-gray-600 mb-8">
          It looks like you've lost your internet connection. Some features may be unavailable until you're back online.
        </p>
      </div>
    </div>
  );
}
