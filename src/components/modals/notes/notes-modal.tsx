"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

interface NotesModalProps {
  value?: string;
  onChange: (notes: string | undefined) => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function NotesModal({ value, onChange, open, onOpenChange }: NotesModalProps) {
  const [notes, setNotes] = useState(value || "");

  useEffect(() => {
    if (open) {
      setNotes(value || "");
    }
  }, [open, value]);

  const handleSave = () => {
    onChange(notes.trim() || undefined);
    onOpenChange(false);
  };

  const handleRemove = () => {
    onChange(undefined);
    onOpenChange(false);
  };

  const handleCancel = () => {
    setNotes(value || "");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleCancel}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Notes</DialogTitle>
        </DialogHeader>
        <div className="py-4">
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add notes for this task..."
            className="min-h-[160px]"
          />
        </div>
        <DialogFooter className="flex">
          {value && <Button variant="destructive" className="mr-auto" onClick={handleRemove} disabled={!value}>
            Remove
          </Button>}
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
            <Button onClick={handleSave}>Save</Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface NotesTriggerProps {
  value?: string;
  onChange: (notes: string | undefined) => void;
  className?: string;
}

export function NotesTrigger({ value, onChange, className }: NotesTriggerProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        variant="ghost"
        className={cn("h-auto px-2 py-1 hover:bg-accent font-normal justify-start text-left w-full", className)}
        onClick={() => setOpen(true)}
      >
        {value ? (
          <span className="text-sm text-ellipsis overflow-hidden">{value}</span>
        ) : (
          <span className="text-sm text-muted-foreground flex items-center gap-1">-</span>
        )}
      </Button>
      <NotesModal value={value} onChange={onChange} open={open} onOpenChange={setOpen} />
    </>
  );
}
