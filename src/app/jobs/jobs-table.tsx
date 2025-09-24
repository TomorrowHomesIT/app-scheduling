import { useNavigate } from "react-router";
import type { IOwner } from "@/models/owner.model";
import { Folder, MapPin } from "lucide-react";
import { Button } from "../../components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface JobsTableProps {
  owners: IOwner[];
  mode: "current" | "archived";
}

export function JobsTable({ owners, mode }: JobsTableProps) {
  const navigate = useNavigate();

  const handleJobClick = (jobId: number) => {
    if (mode === "current") {
      navigate(`/jobs/${jobId}`);
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
                <Folder className="h-4 w-4 text-muted-foreground" />
                <h3 className="font-semibold">{owner.name}</h3>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              {owner.jobs?.map((job) => (
                <button
                  disabled={mode === "archived"}
                  key={job.id}
                  type="button"
                  onClick={() => handleJobClick(job.id)}
                  className="w-full text-left"
                >
                  <Card className="hover:bg-accent hover:cursor-pointer">
                    <div className="flex items-center w-full">
                      <div className="flex items-center justify-center ml-6">
                        <MapPin className="h-6 w-6 text-muted-foreground" />
                      </div>

                      <CardHeader className="w-full">
                        <CardTitle>{job.name}</CardTitle>
                        <CardDescription>{job.location ?? "No location set"}</CardDescription>
                      </CardHeader>
                    </div>
                  </Card>
                </button>
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
