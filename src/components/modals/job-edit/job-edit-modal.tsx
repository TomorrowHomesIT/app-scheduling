"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { IJob, IUpdateJobRequest } from "@/models/job.model";
import useOwnersStore from "@/store/owners-store";
import { JobDriveSyncButton } from "@/components/job/job-drive-sync-button";

interface JobEditModalProps {
  job: IJob;
  onSave: (jobId: number, updates: IUpdateJobRequest) => Promise<void>;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function JobEditModal({ job, onSave, open, onOpenChange }: JobEditModalProps) {
  const owners = useOwnersStore((state) => state.owners);
  const [localJob, setLocalJob] = useState<IUpdateJobRequest>({
    name: job.name,
    location: job.location || "",
    ownerId: job.ownerId,
  });
  const [isSaving, setIsSaving] = useState(false);

  // Find the current owner
  const currentOwnerId = job.ownerId || owners.find((owner) => owner.jobs?.some((j) => j.id === job.id))?.id;

  useEffect(() => {
    if (open) {
      setLocalJob({
        name: job.name,
        location: job.location,
        ownerId: job.ownerId,
      });
    }
  }, [open, job]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave(job.id, localJob);
      onOpenChange(false);
    } catch (error) {
      console.error("Failed to save job:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setLocalJob({ name: job.name, location: job.location, ownerId: job.ownerId });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleCancel}>
      <DialogContent className="sm:max-w-[470px]">
        <DialogHeader>
          <DialogTitle>Edit Job</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Job Name */}
          <div className="space-y-2">
            <Label htmlFor="job-name">Name</Label>
            <Input
              id="job-name"
              autoFocus={true}
              value={localJob.name}
              onChange={(e) => setLocalJob((prev) => ({ ...prev, name: e.target.value }))}
              placeholder="Enter job name"
            />
          </div>

          {/* Location */}
          <div className="space-y-2">
            <Label htmlFor="job-location">Location</Label>
            <Input
              id="job-location"
              value={localJob.location}
              onChange={(e) => setLocalJob((prev) => ({ ...prev, location: e.target.value }))}
              placeholder="Enter job location"
            />
          </div>

          {/* Owner */}
          <div className="space-y-2">
            <Label htmlFor="job-owner">Owner</Label>
            <Select
              value={localJob.ownerId?.toString() || currentOwnerId?.toString() || ""}
              onValueChange={(value) => setLocalJob((prev) => ({ ...prev, ownerId: parseInt(value, 10) }))}
            >
              <SelectTrigger id="job-owner">
                <SelectValue placeholder="Select an owner" />
              </SelectTrigger>
              <SelectContent>
                {owners.map((owner) => (
                  <SelectItem key={owner.id} value={owner.id.toString()}>
                    {owner.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter className="flex justify-between w-full">
          <JobDriveSyncButton jobId={job.id} onCloseDialog={() => onOpenChange(false)} />
          <div className="flex gap-2 ml-auto">
            <Button variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isSaving || !localJob.name.trim()}>
              {isSaving ? "Saving..." : "Save"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
