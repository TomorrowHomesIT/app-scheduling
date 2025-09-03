"use client";

import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";
import type { IToast, TToastType } from "@/store/toast-store";
import { AlertCircle, CheckCircle, Loader2, X, XCircle } from "lucide-react";

interface IToastProps extends ComponentProps<"div"> {
  toast: IToast;
  onClose?: () => void;
}

const iconMap: Record<TToastType, typeof CheckCircle> = {
  success: CheckCircle,
  error: XCircle,
  warning: AlertCircle,
  loading: Loader2,
};

const styleMap: Record<TToastType, string> = {
  success: "bg-primary-foreground text-primary border-primary",
  error: "bg-red-100 text-red-900 border-red-300",
  warning: "bg-yellow-100 text-yellow-900 border-yellow-300",
  loading: "bg-gray-100 text-gray-900 border-gray-300",
};

const iconStyleMap: Record<TToastType, string> = {
  success: "text-primary",
  error: "text-red-600",
  warning: "text-yellow-600",
  loading: "text-gray-600",
};

export function Toast({ toast, onClose, className, ...props }: IToastProps) {
  const Icon = iconMap[toast.type];

  return (
    <div
      className={cn(
        "flex items-center gap-3 px-4 py-3 pr-8 rounded-lg border shadow-lg",
        "min-w-[300px] max-w-[500px]",
        "transform transition-all duration-300 ease-in-out",
        toast.isRemoving ? "translate-x-[-120%] opacity-0 scale-95" : "translate-x-0 opacity-100 scale-100",
        styleMap[toast.type],
        className,
      )}
      {...props}
    >
      <Icon
        className={cn("w-5 h-5 flex-shrink-0", toast.type === "loading" && "animate-spin", iconStyleMap[toast.type])}
      />
      <p className="text-sm font-medium flex-1">{toast.message}</p>
      {onClose && toast.type !== "loading" && (
        <button
          type="button"
          onClick={onClose}
          className={cn(
            "absolute top-3 right-2 p-0.5 rounded-md",
            "hover:bg-black/5 transition-colors",
            "focus:outline-none focus:ring-2 focus:ring-offset-1",
            toast.type === "success" && "focus:ring-primary-foreground",
            toast.type === "error" && "focus:ring-red-500",
            toast.type === "warning" && "focus:ring-yellow-500",
          )}
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
