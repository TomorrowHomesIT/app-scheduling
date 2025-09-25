import type React from "react";
import {
  Description,
  DialogBackdrop,
  Dialog as HeadlessDialog,
  DialogPanel,
  DialogTitle as HeadlessDialogTitle,
  CloseButton,
} from "@headlessui/react";
import { cn } from "@/lib/utils";
import { XIcon } from "lucide-react";

interface DialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children?: React.ReactNode;
}

function Dialog({ open = false, onOpenChange, children }: DialogProps) {
  return (
    <HeadlessDialog
      open={open}
      onClose={() => onOpenChange?.(false)}
      transition
      className="relative z-50 transition duration-300 ease-out data-[closed]:opacity-0"
      data-slot="dialog"
    >
      <DialogBackdrop className="fixed inset-0 bg-black/50" />
      {children}
    </HeadlessDialog>
  );
}

interface DialogContentProps extends React.ComponentProps<"div"> {
  showCloseButton?: boolean;
}

function DialogContent({ className, children, showCloseButton = true, ...props }: DialogContentProps) {
  return (
    /** Allows the dialog to be scrollable */
    <div className="fixed inset-0 overflow-y-auto">
      <div className="fixed inset-0 flex w-screen items-center justify-center p-4">
        <DialogPanel
          className={cn(
            "bg-background relative transform overflow-hidden rounded-lg text-left shadow-xl transition-all duration-300 ease-out data-[closed]:opacity-0 data-[closed]:scale-95 sm:my-8 sm:w-full sm:max-w-lg border p-6",
            className,
          )}
          data-slot="dialog-content"
          {...props}
        >
          <CloseButton data-slot="dialog-close">
            <XIcon />
            <span className="sr-only">Close</span>
          </CloseButton>
          {children}
        </DialogPanel>
      </div>
    </div>
  );
}

function DialogHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="dialog-header"
      className={cn("flex flex-col gap-2 text-center sm:text-left", className)}
      {...props}
    />
  );
}

function DialogFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="dialog-footer"
      className={cn("flex flex-col-reverse gap-2 sm:flex-row sm:justify-end", className)}
      {...props}
    />
  );
}

function DialogTitle({ className, children, ...props }: React.ComponentProps<"h3">) {
  return (
    <HeadlessDialogTitle
      as="h3"
      className={cn("text-lg leading-none font-semibold", className)}
      data-slot="dialog-title"
      {...props}
    >
      {children}
    </HeadlessDialogTitle>
  );
}

function DialogDescription({ className, children, ...props }: React.ComponentProps<"p">) {
  return (
    <Description
      as="p"
      className={cn("text-muted-foreground text-sm mb-2", className)}
      data-slot="dialog-description"
      {...props}
    >
      {children}
    </Description>
  );
}

export { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle };
