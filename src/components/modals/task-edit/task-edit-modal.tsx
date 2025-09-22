import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { X, CloudDownload } from "lucide-react";
import { toast } from "@/store/toast-store";
import { DOC_TAGS } from "@/models/doc-tags.const";

export interface ITaskEditData {
  id: number;
  name: string;
  costCenter?: number | null;
  docTags?: string[] | null;
  jobId?: number;
}

export interface ITaskEditUpdates {
  name?: string;
  costCenter?: number | null;
  docTags?: string[] | null;
}

interface TaskEditModalProps {
  task: ITaskEditData;
  onSave: (taskId: number, updates: ITaskEditUpdates) => Promise<void>;
  onSync?: (jobId: number) => Promise<void>;
  onOpenChange: (open: boolean) => void;
  open: boolean;
  showSyncButton?: boolean;
}

export function TaskEditModal({ task, onSave, onSync, onOpenChange, open, showSyncButton = true }: TaskEditModalProps) {
  const [localTask, setLocalTask] = useState<ITaskEditUpdates>({
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
      await onSaveChanges();
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

  const syncRequest = async () => {
    const endpoint = `/api/jobs/tasks/${task.id}/sync-drive`;
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(response.statusText);
    }

    return await response.json();
  };

  const handleSync = async () => {
    if (!onSync || !task.jobId) {
      toast.error("Sync functionality not available");
      return;
    }

    setIsSaving(true);
    try {
      // Save the current changes first
      await onSaveChanges();

      // Sync with Google Drive using the saved data
      await toast.while(syncRequest(), {
        loading: "Syncing with Google Drive",
        success: (data) => {
          if (data?.updated) {
            // Only close and reload the job if it was updated
            onOpenChange(false);
            // biome-ignore lint/style/noNonNullAssertion: this is checked above
            onSync(task.jobId!);

            return { message: "Task synced with Google Drive", type: "success" };
          } else {
            return { message: "Task is already up to date", type: "warning" };
          }
        },
        error: "Failed to sync with Google Drive",
      });
    } catch (error) {
      console.error("Error saving and syncing task:", error);
      toast.error(error instanceof Error ? error.message : "Failed to save and sync task");
    } finally {
      setIsSaving(false);
    }
  };

  const onSaveChanges = async () => {
    const costCenter = localTask.costCenter;
    if (costCenter && Number.isNaN(parseFloat(costCenter.toString()))) {
      toast.error("Cost center must be a number");
      return;
    }

    const updates: ITaskEditUpdates = {
      name: localTask.name,
      docTags: localTask.docTags || null,
      costCenter: localTask.costCenter || null,
    };

    await onSave(task.id, updates);
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
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveTag(tag)}
                      className="ml-1 h-auto w-auto p-0 hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </Badge>
                ))
              ) : (
                <span className="text-sm text-muted-foreground">No tags selected</span>
              )}
            </div>
          </div>
        </div>

        <DialogFooter className="flex justify-between sm:justify-between">
          {showSyncButton && (
            <Button
              variant="outline"
              size="default"
              onClick={handleSync}
              disabled={isSaving || !localTask.costCenter || !onSync}
              title="Sync with Drive"
            >
              <CloudDownload className="h-4 w-4" />
              {!localTask.costCenter ? "Cost center required" : "Sync Drive"}
            </Button>
          )}
          <div className="flex gap-2 ml-auto">
            <Button variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isSaving || !localTask.name}>
              {isSaving ? "Saving..." : "Save"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
