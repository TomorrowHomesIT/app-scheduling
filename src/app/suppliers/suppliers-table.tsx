"use client";

import { useRouter } from "next/navigation";
import type { IOwner } from "@/models/owner.model";
import { Folder, MapPin } from "lucide-react";
import { Button } from "../../components/ui/button";
import type { ISupplier } from "@/models/supplier.model";

interface SuppliersTableProps {
  suppliers: ISupplier[];
  mode: "current" | "archived";
}

export function SuppliersTable({ suppliers, mode }: SuppliersTableProps) {
  const handleSupplierClick = (supplierId: number) => {
    if (mode === "current") {
      //   router.push(`/suppliers/${supplierId}`);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      {suppliers.map((supplier) => (
        <Button
          disabled={mode === "archived"}
          key={supplier.id}
          size="lg"
          variant="outline"
          onClick={() => handleSupplierClick(supplier.id)}
          className="w-full justify-start font-normal"
        >
          <div className="flex items-center gap-4">
            <div className="font-medium">{supplier.name}</div>
          </div>
        </Button>
      ))}
    </div>
  );
}
