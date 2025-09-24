import { useState, useEffect, Suspense } from "react";
import { Link } from "react-router";
import { useLocation, useNavigate } from "react-router";
import { ChevronDown, ChevronRight, Search, Folder, ListChecks, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import useOwnersStore from "@/store/owners-store";
import { UserProfileButton } from "@/components/user-profile-button";
import { Logo } from "../ui/logo";
import { useAuth } from "@/components/auth/auth-context";
import { SyncStatus } from "@/components/sync-status";

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

function SidebarContentInner({ onJobSelect }: { onJobSelect?: () => void }) {
  const location = useLocation();
  const pathname = location.pathname;
  const id = location.pathname.match(/\/jobs\/(\d+)/)?.[1];
  const { owners } = useOwnersStore();
  const { user } = useAuth();
  const [expandedOwners, setExpandedOwners] = useState<Set<number>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();

  // Expand the current user's owner and the owner containing the current job (only on init)
  useEffect(() => {
    const ownersToExpand = new Set<number>();

    // Always expand current user's owner
    if (user?.id) {
      const userOwner = owners.find((owner) => owner.userId === user.id);
      if (userOwner) {
        ownersToExpand.add(userOwner.id);
      }
    }

    // Also check if we're on a job page and expand that owner
    if (pathname.includes("/jobs/") && id) {
      const jobId = parseInt(id, 10);
      const jobOwner = owners.find((owner) => owner.jobs?.some((job) => job.id === jobId));
      if (jobOwner) {
        ownersToExpand.add(jobOwner.id);
      }
    }

    if (ownersToExpand.size > 0) {
      setExpandedOwners(ownersToExpand);
    }
  }, [owners, user?.id, pathname, id]);

  const isJobSelected = (jobId: number) => {
    return pathname.includes("/jobs/") && id === jobId.toString();
  };

  const toggleOwner = (ownerId: number) => {
    const newExpanded = new Set(expandedOwners);
    if (newExpanded.has(ownerId)) {
      newExpanded.delete(ownerId);
    } else {
      newExpanded.add(ownerId);
    }
    setExpandedOwners(newExpanded);
  };

  const filteredOwners = owners
    .map((owner) => {
      if (!searchQuery) return owner;

      const matchesOwner = owner.name.toLowerCase().includes(searchQuery.toLowerCase());
      const filteredJobs = owner.jobs?.filter((job) => job.name.toLowerCase().includes(searchQuery.toLowerCase()));

      // Show owner if it matches or has matching jobs
      if (matchesOwner || (filteredJobs && filteredJobs.length > 0)) {
        return {
          ...owner,
          jobs: searchQuery ? filteredJobs : owner.jobs,
        };
      }
      return null;
    })
    .filter((owner): owner is NonNullable<typeof owner> => owner !== null)
    .filter((owner) => (owner.jobs?.length || 0) > 0) // Hide owners with no jobs
    .sort((a, b) => {
      // Put current user's owner first
      if (a.userId === user?.id && b.userId !== user?.id) return -1;
      if (b.userId === user?.id && a.userId !== user?.id) return 1;
      // Then sort alphabetically by name
      return a.name.localeCompare(b.name);
    });

  return (
    <>
      <button type="button" onClick={() => navigate("/")}>
        <Logo className="border-b p-4" />
      </button>

      <div className="p-4">
        <div className="relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8 h-9"
          />
        </div>
      </div>

      <div className="flex-1 px-2 overflow-y-auto">
        <div className="space-y-1 p-2">
          <div className="text-xs font-semibold text-muted-foreground mb-2">Owners</div>
          {filteredOwners.map((owner) => (
            <Collapsible key={owner.id} open={expandedOwners.has(owner.id)} onOpenChange={() => toggleOwner(owner.id)}>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" className="w-full justify-start p-2 h-auto font-normal group">
                  <span className="mr-1 relative inline-flex h-4 w-4 items-center justify-center">
                    {expandedOwners.has(owner.id) ? (
                      <ChevronDown className="absolute h-4 w-4 opacity-0 transition-opacity group-hover:opacity-100" />
                    ) : (
                      <ChevronRight className="absolute h-4 w-4 opacity-0 transition-opacity group-hover:opacity-100" />
                    )}
                    {owner.userId === user?.id ? (
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
                {owner.jobs?.map((job) => (
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
          ))}
        </div>
      </div>

      <div>
        <div className="p-2">
          <SyncStatus />
        </div>
        <div className="border-t p-2 space-y-2">
          <UserProfileButton />
        </div>
      </div>
    </>
  );
}

function SidebarContent({ onJobSelect }: { onJobSelect?: () => void }) {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col h-full">
          <div className="border-b p-4">
            <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
          </div>
          <div className="flex-1 p-4">
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
            </div>
          </div>
        </div>
      }
    >
      <SidebarContentInner onJobSelect={onJobSelect} />
    </Suspense>
  );
}

export function Sidebar({ isOpen = false, onClose }: SidebarProps) {
  return (
    <>
      {/* Desktop sidebar - always visible */}
      <div className="hidden lg:flex h-full w-42 xl:w-58 flex-col border-r bg-background">
        <SidebarContent />
      </div>

      {/* Mobile sidebar - Sheet component */}
      <Sheet open={isOpen} onOpenChange={onClose ? () => onClose() : undefined}>
        <SheetContent side="left" className="w-58 p-0 flex flex-col gap-0">
          <SidebarContent onJobSelect={onClose} />
        </SheetContent>
      </Sheet>
    </>
  );
}
