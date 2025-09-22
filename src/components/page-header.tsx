import { ChevronLeft, Menu } from "lucide-react";
import type { ComponentProps } from "react";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Link } from "react-router";
import { useSidebar } from "./sidebar/sidebar-context";

interface PageHaderProps extends ComponentProps<"div"> {
  title: string;
  description?: string;
  backLink?: string;
  badge?: string;
}

export function PageHeader({ title, description, backLink, badge, children }: PageHaderProps) {
  const { setIsSidebarOpen } = useSidebar();

  return (
    <div className="flex items-center justify-between p-4">
      <div className="flex items-center gap-2 lg:gap-4">
        {backLink && (
          <Link to={backLink}>
            <Button variant="ghost" size="icon">
              <ChevronLeft className="h-4 w-4" />
            </Button>
          </Link>
        )}
        <div className="flex-1">
          <div className="flex items-end gap-2">
            <h1 className="text-xl lg:text-2xl font-semibold">{title}</h1>
            {badge && (
              <Badge variant="outline" className="mb-0.5 lg:mb-1">
                {badge}
              </Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {children}
        {/* Mobile menu button */}
        <Button variant="outline" size="default" className="lg:hidden" onClick={() => setIsSidebarOpen(true)}>
          <Menu className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
