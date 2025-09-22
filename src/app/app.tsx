import { createBrowserRouter, Outlet, RouterProvider } from "react-router";
import { AppLayoutClient } from "./layout-client";
import { ToastContainer } from "@/components/toast-container";
import { OfflineIndicator } from "@/components/offline-indicator";
import { PWAInstaller } from "@/components/pwa-installer";

// Import all your pages (hard loaded, not lazy)
import HomePage from "./page";
import JobsPage from "./jobs/page";
import JobPage from "./job/page";
import CreateJobPage from "./jobs/create/page";
import SuppliersPage from "./suppliers/page";
import SettingsPage from "./settings/page";
import OfflinePage from "./offline/page";

// Auth pages
import LoginPage from "./auth/login/page";
import SignUpPage from "./auth/sign-up/page";
import SignUpSuccessPage from "./auth/sign-up-success/page";
import ForgotPasswordPage from "./auth/forgot-password/page";
import UpdatePasswordPage from "./auth/update-password/page";
import CallbackPage from "./auth/callback/page";
import ConfirmPage from "./auth/confirm/page";
import ErrorPage from "./auth/error/page";

const router = createBrowserRouter([
  {
    path: "/",
    element: <AppLayout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: "jobs", element: <JobsPage /> },
      { path: "jobs/create", element: <CreateJobPage /> },
      { path: "jobs/:id", element: <JobPage /> },
      { path: "suppliers", element: <SuppliersPage /> },
      { path: "settings", element: <SettingsPage /> },
      { path: "offline", element: <OfflinePage /> },

      // Auth routes
      { path: "auth/login", element: <LoginPage /> },
      { path: "auth/sign-up", element: <SignUpPage /> },
      { path: "auth/sign-up-success", element: <SignUpSuccessPage /> },
      { path: "auth/forgot-password", element: <ForgotPasswordPage /> },
      { path: "auth/update-password", element: <UpdatePasswordPage /> },
      { path: "auth/callback", element: <CallbackPage /> },
      { path: "auth/confirm", element: <ConfirmPage /> },
      { path: "auth/error", element: <ErrorPage /> },

      // 404 fallback
      { path: "*", element: <HomePage /> },
    ],
  },
]);

function AppLayout() {
  return (
    <div className="flex flex-col basd-h-dvh">
      <OfflineIndicator />
      <div className="flex flex-1 overflow-hidden">
        <AppLayoutClient>
          <Outlet />
        </AppLayoutClient>
      </div>
      <PWAInstaller />
      <ToastContainer />
    </div>
  );
}

export function App() {
  return <RouterProvider router={router} />;
}
