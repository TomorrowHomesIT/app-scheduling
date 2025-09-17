"use client";

import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { useState } from "react";
import { ConfirmationModal } from "../modals/confirm/confirm-modal";
import { useAuth } from "./auth-context";
import { cn } from "@/lib/utils";

export function LogoutButton({ className }: { className?: string }) {
  const { logout } = useAuth();
  const router = useRouter();
  const [showDialog, setShowDialog] = useState(false);

  const onLogout = async () => {
    await logout();
    router.push("/auth/login");
  };

  return (
    <>
      <Button onClick={() => setShowDialog(true)} className={cn("justify-between", className)} variant="destructive">
        Logout
        <LogOut className="h-4 w-4" />
      </Button>

      <ConfirmationModal
        open={showDialog}
        onOpenChange={setShowDialog}
        description="Are you sure you want to logout?"
        confirmText="Logout"
        onConfirm={onLogout}
      />
    </>
  );
}
