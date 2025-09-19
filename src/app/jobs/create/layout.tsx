import { ProtectedLayout } from "@/components/auth/protected-layout";

export default async function JobsCreateLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <ProtectedLayout>{children}</ProtectedLayout>;
}
