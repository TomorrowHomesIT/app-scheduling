import { useEffect, Suspense, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { createClient } from "@/lib/supabase/client";
import { Spinner } from "@/components/ui/spinner";

function CallbackContent() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const hasProcessed = useRef(false);

  useEffect(() => {
    // Prevent multiple executions
    if (hasProcessed.current) {
      return;
    }

    const handleCallback = async () => {
      const code = searchParams.get("code");
      const next = searchParams.get("next") ?? "/";

      console.log("Auth via callback");

      if (code) {
        const supabase = createClient();
        const { error } = await supabase.auth.exchangeCodeForSession(code);

        if (!error) {
          navigate(next);
        } else {
          navigate("/auth/error");
        }
      } else {
        navigate("/auth/error");
      }
    };

    hasProcessed.current = true;
    handleCallback();
  }, [searchParams, navigate]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
        <p className="mt-4 text-gray-600">Processing authentication...</p>
      </div>
    </div>
  );
}

export default function CallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col items-center justify-center h-full">
          <Spinner variant="default" size="xl" />
        </div>
      }
    >
      <CallbackContent />
    </Suspense>
  );
}
