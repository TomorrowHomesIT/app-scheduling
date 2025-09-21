import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient();

  const { data, error } = await supabase.auth.getClaims();
  if (error || !data?.claims) {
    redirect("/auth/login");
  }

  return <>{children}</>;
}
