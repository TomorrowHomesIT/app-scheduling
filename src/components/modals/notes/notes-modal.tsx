import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { ModalTriggerButton } from "@/components/modal-trigger-button";

interface NotesModalProps {
  value?: string;
  onChange: (notes: string | undefined) => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  taskName?: string;
}

export function NotesModal({ value, onChange, open, onOpenChange, taskName }: NotesModalProps) {
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
          <DialogTitle>Notes</DialogTitle>
          <DialogDescription>{taskName || "Add a note for this task"}</DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add notes for this task..."
            className="min-h-[120px]"
          />
        </div>
        <DialogFooter className="flex">
          {value && (
            <Button variant="destructive" className="mr-auto" onClick={handleRemove} disabled={!value}>
              Remove
            </Button>
          )}
          <Button onClick={handleSave} disabled={!notes}>
            Save note
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface NotesTriggerProps {
  value?: string;
  onChange: (notes: string | undefined) => void;
  className?: string;
  taskName?: string;
}

export function NotesTrigger({ value, onChange, className, taskName }: NotesTriggerProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <ModalTriggerButton hasValue={!!value} className={className} setOpen={setOpen}>
        <span className="text-sm text-ellipsis overflow-hidden">{value}</span>
      </ModalTriggerButton>
      <NotesModal value={value} onChange={onChange} open={open} onOpenChange={setOpen} taskName={taskName} />
    </>
  );
}
