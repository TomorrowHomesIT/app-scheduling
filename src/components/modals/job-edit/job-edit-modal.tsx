"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { IJob, IUpdateJobRequest } from "@/models/job.model";

interface JobEditModalProps {
  job: IJob;
  onSave: (jobId: number, updates: IUpdateJobRequest) => Promise<void>;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function JobEditModal({ job, onSave, open, onOpenChange }: JobEditModalProps) {
  const [localJob, setLocalJob] = useState<IUpdateJobRequest>({
    name: job.name,
    location: job.location || "",
  });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setLocalJob({
        name: job.name,
        location: job.location || "",
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
    setLocalJob({
      name: job.name,
      location: job.location || "",
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleCancel}>
      <DialogContent className="sm:max-w-[425px]">
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
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving || !localJob.name.trim()}>
            {isSaving ? "Saving..." : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
