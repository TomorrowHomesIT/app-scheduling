import { Button } from "../button";
import { cn } from "@/lib/utils";
import { Plus, Minus } from "lucide-react";

interface ModalTriggerButtonProps {
  hasValue: boolean;
  className?: string;
  setOpen: (open: boolean) => void;
  children: React.ReactNode;
}

export function ModalTriggerButton({ hasValue, className, setOpen, children }: ModalTriggerButtonProps) {
  return (
    <Button
      variant="ghost"
      className={cn("px-2 py-1 hover:bg-accent font-normal justify-start text-left w-full group", className)}
      onClick={() => setOpen(true)}
    >
      {hasValue ? (
        children
      ) : (
        <span className="text-sm text-muted-foreground flex items-center gap-1 relative">
          <Minus className="h-3 max-w-3 transition-opacity duration-200 group-hover:opacity-0" />
          <Plus className="h-3 max-w-3 absolute transition-opacity duration-200 opacity-0 group-hover:opacity-100" />
        </span>
      )}
    </Button>
  );
}
