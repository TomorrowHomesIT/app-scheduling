import { Routes, Route } from "react-router-dom";
import { Suspense } from "react";
import { AppLayoutClient } from "./layout-client";
import { ToastContainer } from "@/components/toast-container";
import { OfflineIndicator } from "@/components/offline-indicator";
import { PWAInstaller } from "@/components/pwa-installer";

// Import all pages from existing app directory
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

// Fallback loading component
function LoadingFallback() {
  return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
}

function App() {
  return (
    <div className="flex flex-col basd-h-dvh">
      <OfflineIndicator />
      <div className="flex flex-1 overflow-hidden">
        <AppLayoutClient>
          <Suspense fallback={<LoadingFallback />}>
            <Routes>
              {/* Main routes */}
              <Route path="/" element={<HomePage />} />
              <Route path="/jobs" element={<JobsPage />} />
              <Route path="/jobs/create" element={<CreateJobPage />} />
              <Route path="/jobs/:id" element={<JobPage />} />
              <Route path="/suppliers" element={<SuppliersPage />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="/offline" element={<OfflinePage />} />

              {/* Auth routes */}
              <Route path="/auth/login" element={<LoginPage />} />
              <Route path="/auth/sign-up" element={<SignUpPage />} />
              <Route path="/auth/sign-up-success" element={<SignUpSuccessPage />} />
              <Route path="/auth/forgot-password" element={<ForgotPasswordPage />} />
              <Route path="/auth/update-password" element={<UpdatePasswordPage />} />
              <Route path="/auth/callback" element={<CallbackPage />} />
              <Route path="/auth/confirm" element={<ConfirmPage />} />
              <Route path="/auth/error" element={<ErrorPage />} />

              {/* 404 fallback */}
              <Route path="*" element={<HomePage />} />
            </Routes>
          </Suspense>
        </AppLayoutClient>
      </div>
      <PWAInstaller />
      <ToastContainer />
    </div>
  );
}

export default App;
