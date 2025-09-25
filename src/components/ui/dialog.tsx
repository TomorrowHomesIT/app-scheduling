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
import { useEffect, useRef } from "react";

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
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!contentRef.current) return;

    const content = contentRef.current;

    // Auto-focus first input or element with data-autofocus
    // Use multiple attempts for PWA mode and iPad where timing can be different
    const focusAttempts = [50, 150, 300];
    focusAttempts.forEach(delay => {
      setTimeout(() => {
        const autoFocusElement = content.querySelector('[data-autofocus], input:not([type="hidden"]), textarea, select');
        if (autoFocusElement instanceof HTMLElement && document.activeElement !== autoFocusElement) {
          autoFocusElement.focus();
          // For iOS/iPad, sometimes we need to trigger additional events
          autoFocusElement.click();
          autoFocusElement.focus();
        }
      }, delay);
    });

    // Fix for iPad/touch devices - handle touch events properly
    let touchTarget: EventTarget | null = null;
    let touchStartX = 0;
    let touchStartY = 0;
    let touchStartTime = 0;

    const handleTouchStart = (e: TouchEvent) => {
      touchTarget = e.target;
      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
      touchStartTime = Date.now();
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (!touchTarget) return;

      // Calculate if this was a drag
      const touchEndX = e.changedTouches[0].clientX;
      const touchEndY = e.changedTouches[0].clientY;
      const touchDuration = Date.now() - touchStartTime;
      const distance = Math.sqrt((touchEndX - touchStartX) ** 2 + (touchEndY - touchStartY) ** 2);

      // If it was a drag (moved more than 10px or took longer than 200ms), don't trigger click
      const isDrag = distance > 10 || touchDuration > 200;

      // If touching outside of an input, blur the active element
      const activeElement = document.activeElement;
      if (
        activeElement instanceof HTMLElement &&
        (activeElement.tagName === "INPUT" ||
          activeElement.tagName === "TEXTAREA" ||
          activeElement.tagName === "SELECT") &&
        touchTarget &&
        !activeElement.contains(touchTarget as Node)
      ) {
        activeElement.blur();
      }

      // Handle button/link clicks for touch devices (only if not dragging)
      if (!isDrag && touchTarget === e.target && e.target instanceof HTMLElement) {
        const clickable = (e.target as HTMLElement).closest(
          'button, a, [role="button"], [role="menuitem"], [role="option"], input, select, textarea',
        );
        if (clickable && clickable instanceof HTMLElement) {
          // Dispatch a click event for touch devices
          setTimeout(() => clickable.click(), 0);
        }
      }

      touchTarget = null;
      touchStartX = 0;
      touchStartY = 0;
      touchStartTime = 0;
    };

    content.addEventListener("touchstart", handleTouchStart, { passive: true });
    content.addEventListener("touchend", handleTouchEnd, { passive: true });

    return () => {
      content.removeEventListener("touchstart", handleTouchStart);
      content.removeEventListener("touchend", handleTouchEnd);
    };
  }, []);

  return (
    /** Allows the dialog to be scrollable */
    <div className="fixed inset-0 overflow-y-auto" ref={contentRef}>
      <div className="fixed inset-0 flex w-screen items-center justify-center p-4">
        <DialogPanel
          className={cn(
            "bg-background relative transform overflow-hidden rounded-lg text-left shadow-xl transition-all duration-300 ease-out data-[closed]:opacity-0 data-[closed]:scale-95 sm:my-8 sm:w-full sm:max-w-lg border p-6",
            className,
          )}
          data-slot="dialog-content"
          {...props}
        >
          {showCloseButton && (
            <CloseButton
              className="ring-offset-background focus:ring-ring data-[state=open]:bg-accent data-[state=open]:text-muted-foreground absolute top-4 right-4 rounded-xs opacity-70 transition-opacity hover:opacity-100 focus:ring-2 focus:ring-offset-2 focus:outline-hidden disabled:pointer-events-none [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4"
              data-slot="dialog-close"
            >
              <XIcon />
              <span className="sr-only">Close</span>
            </CloseButton>
          )}
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
