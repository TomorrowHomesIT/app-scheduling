"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { SuppliersTable } from "./suppliers-table";
import { SupplierEditDialog } from "@/components/supplier-edit-dialog";
import useSupplierStore from "@/store/supplier-store";
import { Input } from "@/components/ui/input";
import type { ISupplier } from "@/models/supplier.model";
import { Plus } from "lucide-react";

export default function JobsPage() {
  const { activeSuppliers, archivedSuppliers } = useSupplierStore();
  const [activeTab, setActiveTab] = useState("current");
  const [searchQuery, setSearchQuery] = useState("");
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<ISupplier | null>(null);

  const filteredSuppliers = () => {
    if (activeTab === "current") {
      return activeSuppliers.filter((supplier) => isMatch(supplier));
    }

    return archivedSuppliers.filter((supplier) => isMatch(supplier));
  };

  const isMatch = (supplier: ISupplier) => {
    return supplier.name.toLowerCase().includes(searchQuery.toLowerCase());
  };

  const handleSupplierClick = (supplier: ISupplier) => {
    setSelectedSupplier(supplier);
    setEditDialogOpen(true);
  };

  const handleCreateSupplier = () => {
    setSelectedSupplier(null);
    setEditDialogOpen(true);
  };

  const handleDialogClose = () => {
    setEditDialogOpen(false);
    setSelectedSupplier(null);
  };

  return (
    <div className="flex flex-col h-full bg-background">
      <div className="border-b bg-background">
        <PageHeader title="Suppliers" backLink="/" description="Manage your contacts and suppliers">
          <Button onClick={handleCreateSupplier}>
            <Plus className="h-4 w-4" />
            New Supplier
          </Button>
        </PageHeader>
      </div>

      <div className="flex-1 overflow-auto p-4">
        <div className="max-w-6xl mx-auto">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <div className="flex  md:flex-row flex-col justify-between items-center gap-2 ">
              <Input
                className="w-full"
                placeholder="Search suppliers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />

              <TabsList className="grid w-full max-w-md grid-cols-2">
                <TabsTrigger value="current">Active</TabsTrigger>
                <TabsTrigger value="archived">Archived</TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="current" className="mt-6">
              <SuppliersTable suppliers={filteredSuppliers()} mode="current" onSupplierClick={handleSupplierClick} />
            </TabsContent>

            <TabsContent value="archived" className="mt-6">
              <SuppliersTable suppliers={filteredSuppliers()} mode="archived" onSupplierClick={handleSupplierClick} />
            </TabsContent>
          </Tabs>
        </div>
      </div>

      <SupplierEditDialog open={editDialogOpen} onOpenChange={handleDialogClose} supplier={selectedSupplier} />
    </div>
  );
}
