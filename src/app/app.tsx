import { createBrowserRouter, Outlet, RouterProvider } from "react-router";
import { AppLayout } from "./layout";
import { ToastContainer } from "@/components/toast-container";
import { StatusIndicator } from "@/components/status-indicator";
import logger from "@/lib/logger";

// Import all your pages (hard loaded, not lazy)
import HomePage from "./page";
import JobsPage from "./jobs/page";
import JobPage from "./job/page";
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
import NotFoundPage from "./404/page";

// Protected layout
import { ProtectedLayout } from "@/components/auth/protected-layout";

const router = createBrowserRouter([
  {
    path: "/",
    element: <Root />,
    children: [
      { index: true, element: <HomePage /> },
      { path: "offline", element: <OfflinePage /> },

      // Protected routes
      {
        path: "/",
        element: <ProtectedLayout />,
        children: [
          { path: "jobs", element: <JobsPage /> },
          { path: "jobs/:id", element: <JobPage /> },
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

      { path: "404", element: <NotFoundPage /> },
      { path: "*", element: <NotFoundPage /> },
    ],
  },
]);

function Root() {
  /** Initilize Mixpanel */
  logger.init();

  return (
    <div className="flex flex-col basd-h-dvh">
      <StatusIndicator />
      <div className="flex flex-1 overflow-hidden">
        <AppLayout>
          <Outlet />
        </AppLayout>
      </div>
      <ToastContainer />
    </div>
  );
}

export function App() {
  return <RouterProvider router={router} />;
}
