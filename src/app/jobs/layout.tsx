import { Sidebar } from "@/components/sidebar";

export default function JobsLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <Sidebar />
      <main className="flex-1 overflow-auto">{children}</main>
    </>
  );
}
