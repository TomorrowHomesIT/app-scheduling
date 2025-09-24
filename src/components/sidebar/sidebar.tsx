import { useState, useEffect, Suspense } from "react";
import { useLocation, useNavigate } from "react-router";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import useOwnersStore from "@/store/owners-store";
import { UserProfileButton } from "@/components/user-profile-button";
import { Logo } from "../ui/logo";
import { useAuth } from "@/components/auth/auth-context";
import { SyncStatus } from "@/components/sync-status";
import { SidebarOwnerJob } from "./sidebar-owner-job";
import { cn } from "@/lib/utils";

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

  // Find the current user's owner
  const currentUserOwner = owners.find((owner) => owner.userId === user?.id);

  // Expand the current user's owner and the owner containing the current job (only on init)
  useEffect(() => {
    const ownersToExpand = new Set<number>();

    // Always expand current user's owner
    if (currentUserOwner) {
      ownersToExpand.add(currentUserOwner.id);
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
      // Merge with existing expanded owners to preserve currently open ones
      setExpandedOwners(prev => new Set([...prev, ...ownersToExpand]));
    }
  }, [owners, currentUserOwner, pathname, id]);

  const isJobSelected = (jobId: number) => {
    return pathname.includes("/jobs/") && id === jobId.toString();
  };

  const toggleOwner = (ownerId: number) => {
    if (filteredOwners.length === 1) {
      return;
    }

    const newExpanded = new Set(expandedOwners);
    if (newExpanded.has(ownerId)) {
      newExpanded.delete(ownerId);
    } else {
      newExpanded.add(ownerId);
    }
    setExpandedOwners(newExpanded);
  };

  // Only show the current user's owner, with optional search filtering
  const filteredOwners = () => {
    const list = currentUserOwner ? [currentUserOwner] : owners;

    return list
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
  };

  return (
    <>
      <button type="button" onClick={() => navigate("/")}>
        <Logo text="Onsite" className="border-b p-4" />
      </button>

      <div className="p-4">
        <div className="relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search jobs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8 h-9"
          />
        </div>
      </div>

      <div className="flex-1 px-2 overflow-y-auto">
        <div className={cn("space-y-1 p-2", currentUserOwner ? "p-0" : "p-2")}>
          <div
            className={cn("text-xs font-semibold text-muted-foreground mb-2", currentUserOwner ? "hidden" : "block")}
          >
            Owners
          </div>
          {filteredOwners().map((owner) => (
            <SidebarOwnerJob
              key={owner.id}
              owner={owner}
              isExpanded={expandedOwners.has(owner.id)}
              onToggle={() => toggleOwner(owner.id)}
              isJobSelected={isJobSelected}
              onJobSelect={onJobSelect}
              currentUserId={user?.id}
            />
          ))}
        </div>
      </div>

      <div>
        {currentUserOwner && (
          <div className="p-2">
            <SyncStatus />
          </div>
        )}
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
