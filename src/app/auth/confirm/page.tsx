import { useEffect, Suspense, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { createClient } from "@/lib/supabase/client";
import type { EmailOtpType } from "@supabase/supabase-js";
import { Spinner } from "@/components/ui/spinner";

function ConfirmContent() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const hasProcessed = useRef(false);

  useEffect(() => {
    if (hasProcessed.current) {
      return;
    }

    const confirmAuth = async () => {
      const token_hash = searchParams.get("token_hash");
      const type = searchParams.get("type") as EmailOtpType | null;
      const next = searchParams.get("next") ?? "/";

      console.log("Auth via callback");

      if (token_hash && type) {
        const supabase = createClient();

        const { error } = await supabase.auth.verifyOtp({
          type,
          token_hash,
        });

        if (!error) {
          navigate(next);
        } else {
          navigate(`/auth/error?error=${encodeURIComponent(error.message)}`);
        }
      } else {
        navigate("/auth/error?error=No token hash or type");
      }
    };

    hasProcessed.current = true;
    confirmAuth();
  }, [navigate, searchParams]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
        <p className="mt-4 text-gray-600">Confirming your account...</p>
      </div>
    </div>
  );
}

export default function ConfirmPage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col items-center justify-center h-full">
          <Spinner variant="default" size="xl" />
        </div>
      }
    >
      <ConfirmContent />
    </Suspense>
  );
}
