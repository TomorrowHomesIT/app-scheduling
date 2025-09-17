"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
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

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

function SidebarContent({ onJobSelect }: { onJobSelect?: () => void }) {
  const pathname = usePathname();
  const { owners } = useOwnersStore();
  const { user } = useAuth();
  const [expandedOwners, setExpandedOwners] = useState<Set<number>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");
  const router = useRouter();

  // Expand only the current user's owner by default
  useEffect(() => {
    if (user?.id) {
      const userOwner = owners.find((owner) => owner.userId === user.id);
      if (userOwner) {
        setExpandedOwners(new Set([userOwner.id]));
      }
    }
  }, [owners, user?.id]);

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

  return (
    <>
      <button type="button" onClick={() => router.push("/")}>
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
                    href={`/jobs/${job.id}`}
                    onClick={onJobSelect}
                    className={cn(
                      "flex items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground",
                      pathname === `/jobs/${job.id}` && "bg-accent font-bold",
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

      <div className="border-t p-2">
        <UserProfileButton />
      </div>
    </>
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
