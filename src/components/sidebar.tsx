"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown, ChevronRight, Search, Plus, Folder, ListChecks } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import useAppStore from "@/lib/store";

export function Sidebar() {
  const pathname = usePathname();
  const { folders, currentJob, loadFolders } = useAppStore();
  const [expandedFolders, setExpandedFolders] = useState<Set<number>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");

  // Load folders on mount
  useEffect(() => {
    loadFolders();
  }, [loadFolders]);

  // Auto-expand folder when current job changes
  useEffect(() => {
    if (currentJob) {
      // Find which folder contains this job
      for (const folder of folders) {
        if (folder.jobs?.some((job) => job.jobId === currentJob.id)) {
          setExpandedFolders((prev) => new Set(prev).add(folder.id));
          break;
        }
      }
    }
  }, [currentJob, folders]);

  const toggleFolder = (folderId: number) => {
    const newExpanded = new Set(expandedFolders);
    if (newExpanded.has(folderId)) {
      newExpanded.delete(folderId);
    } else {
      newExpanded.add(folderId);
    }
    setExpandedFolders(newExpanded);
  };

  const filteredFolders = folders
    .map((folder) => {
      if (!searchQuery) return folder;

      const matchesFolder = folder.name.toLowerCase().includes(searchQuery.toLowerCase());
      const filteredJobs = folder.jobs?.filter((job) => job.name.toLowerCase().includes(searchQuery.toLowerCase()));

      // Show folder if it matches or has matching jobs
      if (matchesFolder || (filteredJobs && filteredJobs.length > 0)) {
        return {
          ...folder,
          jobs: searchQuery ? filteredJobs : folder.jobs,
        };
      }
      return null;
    })
    .filter((folder): folder is NonNullable<typeof folder> => folder !== null);

  return (
    <div className="flex h-full w-64 flex-col border-r bg-background">
      <div className="p-4 border-b">
        <h2 className="text-lg font-semibold">BASD - Scheduling</h2>
      </div>

      <div className="px-4 py-2">
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
          <div className="text-xs font-semibold text-muted-foreground mb-2">Folders</div>
          {filteredFolders.map((folder) => (
            <Collapsible
              key={folder.id}
              open={expandedFolders.has(folder.id)}
              onOpenChange={() => toggleFolder(folder.id)}
            >
              <CollapsibleTrigger asChild>
                <Button variant="ghost" className="w-full justify-start p-2 h-auto font-normal group">
                  <span className="mr-2 relative inline-flex h-4 w-4 items-center justify-center">
                    {expandedFolders.has(folder.id) ? (
                      <ChevronDown className="absolute h-4 w-4 opacity-0 transition-opacity group-hover:opacity-100" />
                    ) : (
                      <ChevronRight className="absolute h-4 w-4 opacity-0 transition-opacity group-hover:opacity-100" />
                    )}
                    <Folder
                      className="absolute h-4 w-4 transition-opacity group-hover:opacity-0"
                      style={{ color: folder.color || "#6b7280" }}
                    />
                  </span>
                  <span className="flex-1 text-left">{folder.name}</span>
                  <span className="text-xs text-muted-foreground">{folder.jobs?.length || 0}</span>
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="ml-4">
                {folder.jobs?.map((job) => (
                  <Link
                    key={job.jobId}
                    href={`/jobs/${job.jobId}`}
                    className={cn(
                      "flex items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground",
                      pathname === `/jobs/${job.jobId}` && "bg-accent font-bold",
                    )}
                  >
                    <ListChecks className="h-4 w-4 flex-shrink-0" style={{ color: folder.color || "#6b7280" }} />
                    <span className="truncate">{job.name}</span>
                  </Link>
                ))}
              </CollapsibleContent>
            </Collapsible>
          ))}
        </div>
      </div>

      <div className="border-t p-4">
        <Button variant="ghost" className="w-full justify-start" size="sm">
          <Plus className="mr-2 h-4 w-4" />
          Create Job
        </Button>
      </div>
    </div>
  );
}
