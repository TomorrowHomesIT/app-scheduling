import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface ConfirmationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "default" | "destructive";
  onConfirm: () => void;
  onCancel?: () => void;
}

function ConfirmationModal({
  open,
  onOpenChange,
  title = "Are you sure?",
  description,
  confirmText = "Confirm",
  cancelText = "Cancel",
  variant = "default",
  onConfirm,
  onCancel,
}: ConfirmationModalProps) {
  const handleConfirm = () => {
    onConfirm();
    onOpenChange(false);
  };

  const handleCancel = () => {
    onCancel?.();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton={false} className="w-80">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <div className="flex justify-between mt-4 w-full gap-2">
            <Button className="flex-1" variant="outline" onClick={handleCancel}>
              {cancelText}
            </Button>
            <Button className="flex-1" variant={variant} onClick={handleConfirm}>
              {confirmText}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Hook for easier usage
function useConfirmationDialog() {
  const [isOpen, setIsOpen] = useState(false);
  const [config, setConfig] = useState<{
    title?: string;
    description: string;
    confirmText?: string;
    cancelText?: string;
    variant?: "default" | "destructive";
    onConfirm: () => void;
    onCancel?: () => void;
  } | null>(null);

  const confirm = (options: {
    title?: string;
    description: string;
    confirmText?: string;
    cancelText?: string;
    variant?: "default" | "destructive";
  }): Promise<boolean> => {
    return new Promise((resolve) => {
      setConfig({
        ...options,
        onConfirm: () => resolve(true),
        onCancel: () => resolve(false),
      });
      setIsOpen(true);
    });
  };

  const dialog = config ? (
    <ConfirmationModal
      open={isOpen}
      onOpenChange={setIsOpen}
      title={config.title}
      description={config.description}
      confirmText={config.confirmText}
      cancelText={config.cancelText}
      variant={config.variant}
      onConfirm={config.onConfirm}
      onCancel={config.onCancel}
    />
  ) : null;

  return { confirm, dialog };
}

export { ConfirmationModal, useConfirmationDialog };
