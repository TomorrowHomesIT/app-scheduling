"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { Check, Search } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { ISupplier } from "@/models/supplier.model";
import useSupplierStore from "@/store/supplier-store";
import { cn } from "@/lib/utils";

interface SupplierModalProps {
  value?: number; // supplier ID
  onChange: (supplierId: number | undefined) => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SupplierModal({ value, onChange, open, onOpenChange }: SupplierModalProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const { suppliers } = useSupplierStore();
  const suppliersListRef = useRef<HTMLDivElement>(null);
  const selectedSupplierRef = useRef<HTMLButtonElement>(null);

  // Filter suppliers based on search query
  const filteredSuppliers = useMemo(() => {
    if (!searchQuery.trim()) return suppliers;

    return suppliers.filter((supplier) => supplier.name.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [suppliers, searchQuery]);

  // Auto-scroll to selected supplier when modal opens
  useEffect(() => {
    if (open && value && selectedSupplierRef.current && suppliersListRef.current) {
      const listElement = suppliersListRef.current;
      const selectedElement = selectedSupplierRef.current;
      
      const listRect = listElement.getBoundingClientRect();
      const selectedRect = selectedElement.getBoundingClientRect();
      
      const scrollTop = selectedElement.offsetTop - listElement.offsetTop - (listRect.height / 2) + (selectedRect.height / 2);
      
      listElement.scrollTo({
        top: Math.max(0, scrollTop),
        behavior: 'smooth'
      });
    }
  }, [open, value]);

  const handleSupplierSelect = (supplier: ISupplier) => {
    onChange(supplier.id);
    onOpenChange(false);
    setSearchQuery(""); // Reset search when closing
  };

  const handleRemoveSupplier = () => {
    onChange(undefined);
    onOpenChange(false);
    setSearchQuery(""); // Reset search when closing
  };

  const handleClose = () => {
    onOpenChange(false);
    setSearchQuery(""); // Reset search when closing
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[400px] max-h-[600px] min-h-[600px] flex flex-col">
        <DialogHeader>
          <DialogTitle>Select Supplier</DialogTitle>
          <DialogDescription>Select a supplier to assign to the task</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 flex-1 flex flex-col min-h-0">
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search suppliers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8"
            />
          </div>
          
          {/* Suppliers List */}
          <div ref={suppliersListRef} className="flex-1 overflow-y-auto space-y-2 min-h-0">
            {filteredSuppliers.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                No suppliers found
              </div>
            ) : (
              filteredSuppliers.map((supplier) => (
                <Button
                  key={supplier.id}
                  ref={value === supplier.id ? selectedSupplierRef : undefined}
                  variant="outline"
                  className="w-full justify-between h-12 px-4"
                  onClick={() => handleSupplierSelect(supplier)}
                >
                  {supplier.name}
                  {value === supplier.id && <Check className="h-4 w-4" />}
                </Button>
              ))
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

interface SupplierTriggerProps {
  value?: number; // supplier ID
  onChange: (supplierId: number | undefined) => void;
  className?: string;
}

export function SupplierTrigger({ value, onChange, className }: SupplierTriggerProps) {
  const [open, setOpen] = useState(false);
  const { getSupplierById } = useSupplierStore();

  const supplier = value ? getSupplierById(value) : undefined;

  return (
    <>
      <Button variant="ghost" className={cn("h-auto p-0", className)} onClick={() => setOpen(true)}>
        {supplier ? (
          <Badge variant="secondary">{supplier.name}</Badge>
        ) : (
          <span className="text-sm text-muted-foreground">-</span>
        )}
      </Button>
      <SupplierModal value={value} onChange={onChange} open={open} onOpenChange={setOpen} />
    </>
  );
}
