"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useEffect } from "react";

export function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    const checkClaims = async () => {
      // TODO - FIX THIS ASPA IT MAKES A CALL TO THE SERVER USER EVERY TIME
      const { data, error } = await supabase.auth.getClaims();
      if (error || !data?.claims) {
        router.push("/auth/login");
      }
    };

    checkClaims();
  }, [supabase.auth.getClaims, router]);

  return <>{children}</>;
}
