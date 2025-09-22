import { useState } from "react";
import { JobsTable } from "@/app/jobs/jobs-table";
import useOwnersStore from "@/store/owners-store";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHeader } from "@/components/page-header";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

export default function JobsPage() {
  const { owners } = useOwnersStore();
  const [activeTab, setActiveTab] = useState("current");
  const navigate = useNavigate();

  const goToCreateJob = () => {
    navigate("/jobs/create");
  };

  return (
    <div className="flex flex-col h-full bg-background">
      <div className="border-b bg-background">
        <PageHeader title="Jobs" backLink="/">
          <Button variant="default" size="default" onClick={() => goToCreateJob()}>
            <Plus className="h-4 w-4" /> New Job
          </Button>
        </PageHeader>
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
