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

// Auth layout and pages
import AuthLayout from "./auth/layout";
import LoginPage from "./auth/login/page";
import SignUpPage from "./auth/sign-up/page";
import SignUpSuccessPage from "./auth/sign-up-success/page";
import ForgotPasswordPage from "./auth/forgot-password/page";
import UpdatePasswordPage from "./auth/update-password/page";
import CallbackPage from "./auth/callback/page";
import ConfirmPage from "./auth/confirm/page";
import ErrorPage from "./auth/error/page";

// Protected layout
import { ProtectedLayout } from "@/components/auth/protected-layout";

const router = createBrowserRouter([
  {
    path: "/",
    element: <AppLayout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: "offline", element: <OfflinePage /> },

      // Protected routes
      {
        path: "/",
        element: <ProtectedLayout />,
        children: [
          { path: "jobs", element: <JobsPage /> },
          { path: "jobs/create", element: <CreateJobPage /> },
          { path: "jobs/:id", element: <JobPage /> },
          { path: "suppliers", element: <SuppliersPage /> },
          { path: "settings", element: <SettingsPage /> },
        ],
      },

      // Auth routes with nested layout
      {
        path: "auth",
        element: <AuthLayout />,
        children: [
          { path: "login", element: <LoginPage /> },
          { path: "sign-up", element: <SignUpPage /> },
          { path: "sign-up-success", element: <SignUpSuccessPage /> },
          { path: "forgot-password", element: <ForgotPasswordPage /> },
          { path: "update-password", element: <UpdatePasswordPage /> },
          { path: "callback", element: <CallbackPage /> },
          { path: "confirm", element: <ConfirmPage /> },
          { path: "error", element: <ErrorPage /> },
        ],
      },

      // 404 fallback
      { path: "*", element: <HomePage /> },
    ],
  },
]);

function AppLayout() {
  return (
    <div className="flex flex-col min-h-dvh">
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
