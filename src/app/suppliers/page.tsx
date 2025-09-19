"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHeader } from "@/components/page-header";
import { SuppliersTable } from "./suppliers-table";
import useSupplierStore from "@/store/supplier-store";
import { Input } from "@/components/ui/input";
import type { ISupplier } from "@/models/supplier.model";

export default function JobsPage() {
  const { activeSuppliers, archivedSuppliers } = useSupplierStore();
  const [activeTab, setActiveTab] = useState("current");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredSuppliers = () => {
    if (activeTab === "current") {
      return activeSuppliers.filter((supplier) => isMatch(supplier));
    }

    return archivedSuppliers.filter((supplier) => isMatch(supplier));
  };

  const isMatch = (supplier: ISupplier) => {
    return supplier.name.toLowerCase().includes(searchQuery.toLowerCase());
  };

  return (
    <div className="flex flex-col h-full bg-background">
      <div className="border-b bg-background">
        <PageHeader title="Suppliers" backLink="/" description="Manage your contacts and suppliers" />
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
              <SuppliersTable suppliers={filteredSuppliers()} mode="current" />
            </TabsContent>

            <TabsContent value="archived" className="mt-6">
              <SuppliersTable suppliers={filteredSuppliers()} mode="archived" />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
