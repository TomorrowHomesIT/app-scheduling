import { Button } from "@/components/ui/button";
import { Paperclip, Plus } from "lucide-react";
import type { IJobTaskUrl } from "@/models/job.model";
import { cn } from "@/lib/utils";

interface LinkBadgeProps {
  links: IJobTaskUrl[];
  onClick: () => void;
  className?: string;
}

export function LinkBadge({ links, onClick, className }: LinkBadgeProps) {
  const count = links.length;

  if (count === 0) {
    return (
      <Button variant="ghost" size="sm" onClick={onClick} className={cn("w-full justify-start", className)}>
        <Plus className="h-3 w-3 text-muted-foreground" />
      </Button>
    );
  }

  return (
    <Button variant="ghost" size="sm" onClick={onClick} className={cn("pl-0 gap-1 w-full justify-start", className)}>
      <Paperclip className="h-3 w-3" />
      <span className="text-xs">{count}</span>
    </Button>
  );
}
