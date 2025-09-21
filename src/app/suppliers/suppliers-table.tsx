"use client";

import { Button } from "../../components/ui/button";
import type { ISupplier } from "@/models/supplier.model";
import { Archive, Mail } from "lucide-react";

interface SuppliersTableProps {
  suppliers: ISupplier[];
  mode: "current" | "archived";
  onSupplierClick: (supplier: ISupplier) => void;
}

export function SuppliersTable({ suppliers, mode, onSupplierClick }: SuppliersTableProps) {
  return (
    <div className="flex flex-col gap-2">
      {suppliers.map((supplier) => (
        <Button
          key={supplier.id}
          size="lg"
          variant="outline"
          onClick={() => onSupplierClick(supplier)}
          className="w-full justify-start font-normal"
        >
          <div className="flex justify-between gap-2 w-full">
            <div className="font-medium text-left flex items-center gap-2">
              {!supplier.active && <Archive className="h-4 w-4" />}
              {supplier.name}
            </div>
            <div className="flex gap-2 text-sm text-muted-foreground">
              {supplier.secondaryEmail && (
                <div className="flex items-center gap-2">
                  <span className="text-xs bg-muted px-1 rounded">Secondary</span>
                  <span className="truncate">{supplier.secondaryEmail}</span>
                </div>
              )}
              {supplier.email && (
                <div className="flex items-center gap-2">
                  <Mail className="h-3 w-3" />
                  <span className="truncate">{supplier.email}</span>
                </div>
              )}
            </div>
          </div>
        </Button>
      ))}
    </div>
  );
}
