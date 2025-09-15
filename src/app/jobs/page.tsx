"use client";

import { useState } from "react";
import { JobsTable } from "@/app/jobs/jobs-table";
import useOwnersStore from "@/store/owners-store";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Spinner } from "@/components/ui/spinner";
import { PageHeader } from "@/components/page-header";
import useLoadingStore from "@/store/loading-store";

export default function JobsPage() {
  const { owners } = useOwnersStore();
  const { isLoading } = useLoadingStore();
  const [activeTab, setActiveTab] = useState("current");

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Spinner variant="default" size="xl" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-background">
      <div className="border-b bg-background">
        <PageHeader title="Jobs" backLink="/" />
      </div>

      <div className="flex-1 overflow-auto p-4">
        <div className="max-w-6xl mx-auto">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full max-w-md grid-cols-2">
              <TabsTrigger value="current">Current Jobs</TabsTrigger>
              <TabsTrigger value="archived">Completed</TabsTrigger>
            </TabsList>

            <TabsContent value="current" className="mt-6">
              <JobsTable owners={owners} mode="current" />
            </TabsContent>

            <TabsContent value="archived" className="mt-6">
              <JobsTable owners={owners} mode="archived" />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
