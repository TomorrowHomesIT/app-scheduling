import { JobsLayoutClient } from "./layout-client";
import { ProtectedLayout } from "@/components/auth/protected-layout";

export default async function JobsLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ProtectedLayout>
      <JobsLayoutClient>{children}</JobsLayoutClient>
    </ProtectedLayout>
  );
}
