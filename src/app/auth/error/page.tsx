import { Suspense, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { useAuth } from "@/components/auth/auth-context";

function ErrorContent() {
  const [searchParams] = useSearchParams();
  const error = searchParams.get("error");
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated) {
      navigate("/");
    }
  }, [isAuthenticated, navigate]);

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Sorry, something went wrong.</CardTitle>
        </CardHeader>
        <CardContent>
          {error ? (
            <p className="text-sm text-muted-foreground">Code error: {error}</p>
          ) : (
            <p className="text-sm text-muted-foreground">An unspecified error occurred.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function Page() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col items-center justify-center h-full">
          <Spinner variant="default" size="xl" />
        </div>
      }
    >
      <ErrorContent />
    </Suspense>
  );
}
