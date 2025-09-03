"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { X } from "lucide-react";
import type { IJobTask } from "@/models/job.model";
import { DOC_TAGS } from "@/models/doc-tags.const";
import { cn } from "@/lib/utils";

interface TaskDetailsModalProps {
  task: IJobTask;
  onSave: (taskId: number, updates: Partial<IJobTask>) => Promise<void>;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TaskDetailsModal({ task, onSave, open, onOpenChange }: TaskDetailsModalProps) {
  const [localTask, setLocalTask] = useState<Partial<IJobTask>>({
    name: task.name,
    costCenter: task.costCenter,
    docTags: task.docTags || [],
  });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setLocalTask({
        name: task.name,
        costCenter: task.costCenter,
        docTags: task.docTags || [],
      });
    }
  }, [open, task]);

  const handleAddTag = (tag: string) => {
    if (tag && !localTask.docTags?.includes(tag)) {
      setLocalTask((prev) => ({
        ...prev,
        docTags: [...(prev.docTags || []), tag],
      }));
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setLocalTask((prev) => ({
      ...prev,
      docTags: prev.docTags?.filter((tag) => tag !== tagToRemove) || [],
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Only send fields that have changed
      const updates: Partial<IJobTask> = {
        name: localTask.name,
        docTags: localTask.docTags || null,
      };

      if (localTask.costCenter !== task.costCenter) {
        // Ensure cost center is sent as a number (float)
        updates.costCenter = localTask.costCenter ? parseFloat(localTask.costCenter.toString()) : null;
      }

      await onSave(task.id, updates);
      onOpenChange(false);
    } catch (error) {
      console.error("Failed to save task details:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setLocalTask({
      name: task.name,
      costCenter: task.costCenter,
      docTags: task.docTags || [],
    });
    onOpenChange(false);
  };

  // Get available tags (not already selected)
  const availableTags = DOC_TAGS.filter((tag) => !localTask.docTags?.includes(tag));

  return (
    <Dialog open={open} onOpenChange={handleCancel}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Task Details</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Task Name */}
          <div className="space-y-2">
            <Label htmlFor="task-name">Name</Label>
            <Input
              id="task-name"
              autoFocus={true}
              value={localTask.name || ""}
              onChange={(e) => setLocalTask((prev) => ({ ...prev, name: e.target.value }))}
              placeholder="Enter task name"
            />
          </div>

          {/* Cost Center */}
          <div className="space-y-2">
            <Label htmlFor="cost-center">Cost Center</Label>
            <Input
              id="cost-center"
              type="number"
              step="0.01"
              value={localTask.costCenter || ""}
              onChange={(e) =>
                setLocalTask((prev) => ({
                  ...prev,
                  costCenter: e.target.value ? parseFloat(e.target.value) : 0,
                }))
              }
              placeholder="0.00"
            />
          </div>

          {/* Document Tags */}
          <div className="space-y-2">
            <Label>Document Tags</Label>

            {/* Tag Selector */}
            <div className="flex gap-2">
              <Select value="" onValueChange={handleAddTag}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Select a tag to add" />
                </SelectTrigger>
                <SelectContent>
                  {availableTags.map((tag) => (
                    <SelectItem key={tag} value={tag}>
                      {tag}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Selected Tags */}
            <div className="flex flex-wrap gap-2 min-h-[2rem] p-2 border rounded-md">
              {localTask.docTags && localTask.docTags.length > 0 ? (
                localTask.docTags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="gap-1">
                    {tag}
                    <button onClick={() => handleRemoveTag(tag)} className="ml-1 hover:text-destructive" type="button">
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))
              ) : (
                <span className="text-sm text-muted-foreground">No tags selected</span>
              )}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving || !localTask.name}>
            {isSaving ? "Saving..." : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface TaskDetailsTriggerProps {
  task: IJobTask;
  onSave: (taskId: number, updates: Partial<IJobTask>) => Promise<void>;
  children: React.ReactNode;
  className?: string;
}

export function TaskDetailsTrigger({ task, onSave, children, className }: TaskDetailsTriggerProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        variant="ghost"
        onClick={() => setOpen(true)}
        className={cn("text-left hover:underline p-0 w-full justify-start", className)}
        type="button"
      >
        {children}
      </Button>
      <TaskDetailsModal task={task} onSave={onSave} open={open} onOpenChange={setOpen} />
    </>
  );
}
