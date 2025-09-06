import { ProtectedLayout } from "@/components/auth/protected-layout";

export default async function SuppliersLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <ProtectedLayout>{children}</ProtectedLayout>;
}
