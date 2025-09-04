import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();

  const { data, error } = await supabase.auth.getClaims();
  if (error || !data?.claims) {
    redirect("/auth/login");
  }

  return <>{children}</>;
}
