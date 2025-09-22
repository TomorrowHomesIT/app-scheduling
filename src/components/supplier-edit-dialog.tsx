import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import type { ISupplier } from "@/models/supplier.model";
import { toast } from "@/store/toast-store";
import useSupplierStore from "@/store/supplier-store";
import { getApiErrorMessage } from "@/lib/api/error";
import { Archive } from "lucide-react";
import { createSupplier, updateSupplier } from "@/lib/supabase/suppliers";

interface SupplierEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  supplier: ISupplier | null;
}

interface SupplierFormData {
  name: string;
  email: string;
  secondaryEmail: string;
}

export function SupplierEditDialog({ open, onOpenChange, supplier }: SupplierEditDialogProps) {
  const { loadSuppliers } = useSupplierStore();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<SupplierFormData>({
    name: "",
    email: "",
    secondaryEmail: "",
  });

  const isEditing = Boolean(supplier);
  const title = isEditing ? "Edit Supplier" : "Create Supplier";

  useEffect(() => {
    setFormData({
      name: supplier?.name || "",
      email: supplier?.email || "",
      secondaryEmail: supplier?.secondaryEmail || "",
    });
  }, [supplier]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error("Name is required");
      return;
    }

    if (!formData.email.trim()) {
      toast.error("Email is required");
      return;
    }

    if (supplier?.id) {
      await handleUpdateSupplier(supplier.active);
    } else {
      await handleCreateSupplier();
    }
  };

  const handleUpdateSupplier = async (isActive = true) => {
    setLoading(true);

    if (!supplier?.id) {
      return;
    }

    try {
      await updateSupplier({
        supplierId: supplier?.id,
        active: isActive,
        name: formData.name.trim(),
        email: formData.email.trim(),
        secondaryEmail: formData.secondaryEmail?.trim(),
      });

      toast.success(`Supplier updated successfully`);
      onOpenChange(false);
      await loadSuppliers();
    } catch (error) {
      toast.error(await getApiErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSupplier = async () => {
    setLoading(true);

    try {
      await createSupplier({
        name: formData.name.trim(),
        email: formData.email.trim(),
        secondaryEmail: formData.secondaryEmail?.trim(),
      });

      toast.success(`Supplier created successfully`);
      onOpenChange(false);
      await loadSuppliers();
    } catch (error) {
      toast.error(await getApiErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    onOpenChange(false);
  };

  const handleArchiveSupplier = async () => {
    await handleUpdateSupplier(!supplier?.active);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
              placeholder="Enter supplier name"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email *</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
              placeholder="Enter email address"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="secondaryEmail">Secondary Email</Label>
            <Input
              id="secondaryEmail"
              type="email"
              value={formData.secondaryEmail}
              onChange={(e) => setFormData((prev) => ({ ...prev, secondaryEmail: e.target.value }))}
              placeholder="Enter secondary email address"
            />
          </div>
        </form>
        <DialogFooter className="flex justify-between">
          {supplier?.id && (
            <Button
              variant={supplier.active ? "destructive" : "outline"}
              size="default"
              onClick={handleArchiveSupplier}
              disabled={loading}
              title="Archive Supplier"
            >
              <Archive className="h-4 w-4" />
              {supplier.active ? "Archive" : "Unarchive"}
            </Button>
          )}
          <div className="flex gap-2 ml-auto">
            <Button type="button" variant="outline" disabled={loading} onClick={handleCancel} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" disabled={loading} onClick={handleSubmit} className="flex-1">
              {loading ? "Saving..." : isEditing ? "Update" : "Create"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
