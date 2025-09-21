"use client";

import { useRouter } from "next/navigation";
import type { IOwner } from "@/models/owner.model";
import { Folder, MapPin } from "lucide-react";
import { Button } from "../../components/ui/button";

interface JobsTableProps {
  owners: IOwner[];
  mode: "current" | "archived";
}

export function JobsTable({ owners, mode }: JobsTableProps) {
  const router = useRouter();

  const handleJobClick = (jobId: number) => {
    if (mode === "current") {
      router.push(`/job?jobId=${jobId}`);
    }
  };

  const filteredOwners = owners.filter((owner) => owner.jobs && owner.jobs.length > 0);

  return (
    <div className="space-y-2">
      {filteredOwners.map((owner) => {
        return (
          <div key={owner.id} className="bg-white flex flex-col mb-8 gap-2">
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-3">
                <Folder className="h-4 w-4" style={{ color: owner.color || "#0A120A" }} />
                <h3 className="font-semibold text-gray-900">{owner.name}</h3>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              {owner.jobs?.map((job) => (
                <Button
                  disabled={mode === "archived"}
                  key={job.id}
                  size="lg"
                  variant="outline"
                  onClick={() => handleJobClick(job.id)}
                  className="w-full justify-start font-normal"
                >
                  <div className="flex items-center gap-4">
                    <div className="font-medium">{job.name}</div>
                    {job.location && (
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <MapPin className="h-3 w-3" />
                        <span>{job.location}</span>
                      </div>
                    )}
                  </div>
                </Button>
              ))}
            </div>
          </div>
        );
      })}

      {filteredOwners.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          No {mode === "current" ? "current" : "archived"} jobs found
        </div>
      )}
    </div>
  );
}
