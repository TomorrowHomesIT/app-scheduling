import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router";

export default function NotFoundPage() {
  const navigate = useNavigate();

  const goToHome = () => {
    navigate("/");
  };

  return (
    <div className="flex flex-col h-full items-center justify-center bg-background">
      <p className="text-base font-semibold text-muted-foreground">404</p>
      <h1 className="mt-4 text-5xl font-semibold tracking-tight text-balance text-primary sm:text-7xl">Not found</h1>
      <p className="mt-6 text-lg font-medium text-pretty text-muted-foreground sm:text-xl/8">
        Sorry, we couldn’t find the data you’re looking for.
      </p>
      <div className="mt-10 flex items-center justify-center gap-x-6">
        <Button variant="default" size="lg" onClick={() => goToHome()}>
          Go to home
        </Button>
      </div>
    </div>
  );
}
