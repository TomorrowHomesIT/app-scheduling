import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ToastContainer } from "@/components/toast-container";
import { AppLayoutClient } from "./layout-client";
import { OfflineIndicator } from "@/components/offline-indicator";
import { PWAInstaller } from "@/components/pwa-installer";

import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "BASD Scheduling",
  description: "Construction project scheduling and management",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "BASD Scheduling",
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    title: "BASD Scheduling",
    description: "Construction project scheduling and management",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "BASD Scheduling",
    description: "Construction project scheduling and management",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <div className="flex flex-col h-screen">
          <OfflineIndicator />
          <div className="flex flex-1 overflow-hidden">
            <AppLayoutClient>{children}</AppLayoutClient>
          </div>
        </div>
        <PWAInstaller />
        <ToastContainer />
      </body>
    </html>
  );
}
