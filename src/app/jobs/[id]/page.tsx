"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { EJobTaskProgress, type IUpdateJobRequest } from "@/models/job.model";
import { Accordion, AccordionContent, AccordionHeader, AccordionItem } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { JobTaskTable } from "@/components/job/job-task-table";
import { JobEditModal } from "@/components/modals/job-edit/job-edit-modal";
import { Settings, HardDrive } from "lucide-react";
import useJobStore from "@/store/job/job-store";
import useTaskStore from "@/store/task-store";
import { Spinner } from "@/components/ui/spinner";
import { PageHeader } from "@/components/page-header";
import { JobTaskStatus } from "@/components/job/job-task-status";
import { JobTaskTableHeader } from "@/components/job/job-task-table-header";
import { JobSyncStatus } from "@/components/job/job-sync-status";
import { JobRefreshButton } from "@/components/job/job-refresh-button";

interface JobDetailPageProps {
  params: Promise<{ id: string }>;
}

export default function JobDetailPage({ params }: JobDetailPageProps) {
  const { id } = use(params);
  const { taskStages } = useTaskStore();
  const { currentJob, currentJobSyncStatus, isLoadingJobs, loadJob, updateJob, refreshJob } = useJobStore();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const [error, setError] = useState<boolean>(false);

  useEffect(() => {
    if (!currentJob || currentJob.id !== parseInt(id, 10)) {
      try {
        loadJob(parseInt(id, 10));
      } catch (error) {
        setError(true);
        console.error(error);
      }
    }

    if (currentJob) document.title = `${currentJob.name} | BASD Scheduling`;
  }, [id, loadJob, currentJob]);

  if (error || Number.isNaN(Number(id))) {
    return notFound();
  } else if (!currentJob || currentJob.id !== Number(id)) {
    return (
      <div className="flex items-center justify-center h-full">
        <Spinner variant="default" size="xl" />
      </div>
    );
  }

  const tasksByStage = taskStages.map((stage) => ({
    ...stage,
    tasks: currentJob.tasks.filter((task) => task.taskStageId === stage.id),
  }));

  const totalTasks = currentJob.tasks.length;
  const completedTasks = currentJob.tasks.filter((task) => task.progress === EJobTaskProgress.Completed).length;

  const handleUpdateJob = async (jobId: number, updates: IUpdateJobRequest) => {
    await updateJob(jobId, updates);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="border-b bg-background">
        <PageHeader
          title={currentJob.name}
          description={currentJob.location}
          backLink="/jobs"
          badge={`${completedTasks}/${totalTasks}`}
        >
          {currentJobSyncStatus && (
            <div className="flex items-center gap-2">
              <JobSyncStatus
                lastUpdated={currentJobSyncStatus.lastUpdated}
                lastSynced={currentJobSyncStatus.lastSynced}
                hasPendingUpdates={currentJobSyncStatus.hasPendingUpdates}
              />
              <JobRefreshButton
                jobId={currentJob.id}
                hasPendingUpdates={currentJobSyncStatus.hasPendingUpdates}
                isLoading={isLoadingJobs}
                onRefresh={refreshJob}
              />
            </div>
          )}
          {currentJob.googleDriveDirId && (
            <Link
              href={`//drive.google.com/drive/folders/${currentJob.googleDriveDirId}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button variant="outline" size="icon">
                <HardDrive className="h-4 w-4" />
              </Button>
            </Link>
          )}
          <Button variant="outline" size="icon" className="flex" onClick={() => setIsEditModalOpen(true)}>
            <Settings className="h-4 w-4" />
          </Button>
        </PageHeader>
      </div>

      <div className="flex-1 overflow-auto px-4 pb-4">
        <Accordion type="multiple" defaultValue={taskStages.map((s) => s.id.toString())}>
          {tasksByStage.map((stage, index) => {
            return (
              <AccordionItem key={stage.id} value={stage.id.toString()} className="relative">
                <AccordionHeader
                  className="sticky top-0 bg-white z-30 flex flex-col w-full"
                  triggerClassName=""
                  triggerChildren={<JobTaskStatus stage={stage} index={index} />}
                >
                  <JobTaskTableHeader />
                </AccordionHeader>
                <AccordionContent>
                  <JobTaskTable tasks={stage.tasks} />
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>
      </div>

      <JobEditModal
        job={currentJob}
        onSave={handleUpdateJob}
        open={isEditModalOpen}
        onOpenChange={setIsEditModalOpen}
      />
    </div>
  );
}
