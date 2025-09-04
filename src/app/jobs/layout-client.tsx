"use client";

import { Sidebar } from "@/components/sidebar/sidebar";
import { SidebarProvider, useSidebar } from "@/components/sidebar/sidebar-context";
import type { ReactNode } from "react";

/** Function is required so that useSidebar is used within the context */
function JobsLayoutContent({ children }: { children: ReactNode }) {
  const { isSidebarOpen, setIsSidebarOpen } = useSidebar();
  return (
    <>
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      <main className="flex-1 overflow-auto flex flex-col">{children}</main>
    </>
  );
}

export function JobsLayoutClient({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <SidebarProvider>
      <JobsLayoutContent>{children}</JobsLayoutContent>
    </SidebarProvider>
  );
}
