import { ChevronDown, ChevronRight, Folder, ListChecks, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Link } from "react-router";
import type { IOwner, IOwnerJob } from "@/models/owner.model";

interface SidebarOwnerJobProps {
  owner: IOwner;
  isExpanded: boolean;
  onToggle: () => void;
  isJobSelected: (jobId: number) => boolean;
  onJobSelect?: () => void;
  currentUserId?: string;
}

export function SidebarOwnerJob({
  owner,
  isExpanded,
  onToggle,
  isJobSelected,
  onJobSelect,
  currentUserId,
}: SidebarOwnerJobProps) {
  const isCurrentUser = owner.userId === currentUserId;

  return (
    <Collapsible open={isExpanded} onOpenChange={onToggle}>
      <CollapsibleTrigger asChild>
        <Button variant="ghost" className="w-full justify-start p-2 h-auto font-normal group">
          <span className="mr-1 relative inline-flex h-4 w-4 items-center justify-center">
            {isExpanded ? (
              <ChevronDown className="absolute h-4 w-4 opacity-0 transition-opacity group-hover:opacity-100" />
            ) : (
              <ChevronRight className="absolute h-4 w-4 opacity-0 transition-opacity group-hover:opacity-100" />
            )}
            {isCurrentUser ? (
              <User
                className="absolute h-4 w-4 transition-opacity group-hover:opacity-0"
                style={{ color: owner.color || "#0A120A" }}
              />
            ) : (
              <Folder
                className="absolute h-4 w-4 transition-opacity group-hover:opacity-0"
                style={{ color: owner.color || "#0A120A" }}
              />
            )}
          </span>
          <span className="flex-1 text-left">{owner.name}</span>
          <span className="text-xs text-muted-foreground">{owner.jobs?.length || 0}</span>
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent className="ml-2">
        {owner.jobs?.map((job: IOwnerJob) => (
          <Link
            key={job.id}
            to={`/jobs/${job.id}`}
            onClick={onJobSelect}
            className={cn(
              "flex items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground",
              isJobSelected(job.id) && "bg-accent font-bold",
            )}
          >
            <ListChecks className="h-4 w-4 flex-shrink-0" style={{ color: owner.color || "#0A120A" }} />
            <span className="truncate">{job.name}</span>
          </Link>
        ))}
      </CollapsibleContent>
    </Collapsible>
  );
}
