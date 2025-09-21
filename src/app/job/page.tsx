"use client";

import { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
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
import useLoadingStore from "@/store/loading-store";

function JobDetailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const jobId = searchParams.get("jobId");

  const { taskStages } = useTaskStore();
  const { currentJob, currentJobSyncStatus, loadJob, updateJob, loadJobSyncStatus } = useJobStore();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [lastKnownSyncStatus, setLastKnownSyncStatus] = useState<typeof currentJobSyncStatus>(null);
  const jobLoadingState = useLoadingStore((state) => state.currentJob);

  const [error, setError] = useState<boolean>(false);

  // Redirect to jobs list if no jobId
  useEffect(() => {
    const parsedJobId = jobId ? parseInt(jobId, 10) : null;

    if (!parsedJobId || Number.isNaN(parsedJobId)) {
      router.push("/jobs");
      return;
    }

    const loadCurrentJob = async (id: number) => {
      try {
        await loadJob(id);
      } catch (error) {
        setError(true);
        console.error(error);
      }
    };

    if (!currentJob || currentJob.id !== parsedJobId) {
      loadCurrentJob(parsedJobId);
    }

    if (currentJob) {
      document.title = `${currentJob.name} | BASD Scheduling`;
    }
  }, [jobId, currentJob, loadJob, router]);

  // Monitor sync status changes to detect service worker updates
  useEffect(() => {
    if (!currentJobSyncStatus) return;

    // If we have a previous sync status, check if it changed
    if (lastKnownSyncStatus) {
      const syncStatusChanged =
        lastKnownSyncStatus.lastSynced !== currentJobSyncStatus.lastSynced ||
        lastKnownSyncStatus.hasPendingUpdates !== currentJobSyncStatus.hasPendingUpdates;

      if (syncStatusChanged && jobId) {
        loadJob(parseInt(jobId, 10));
      }
    }

    // Update our known sync status
    setLastKnownSyncStatus(currentJobSyncStatus);
  }, [currentJobSyncStatus, lastKnownSyncStatus, loadJob, jobId]);

  // Periodically check for sync status updates (every 30 seconds)
  useEffect(() => {
    if (!currentJob || !currentJobSyncStatus || !jobId) return;

    const interval = setInterval(async () => {
      try {
        await loadJobSyncStatus(parseInt(jobId, 10));
      } catch (error) {
        console.error("Failed to check sync status:", error);
      }
    }, 30000); // Check every 30 seconds

    return () => clearInterval(interval);
  }, [currentJob, currentJobSyncStatus, jobId, loadJobSyncStatus]);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <div className="text-center mt-3">
          <h2 className="text-2xl font-bold text-gray-900">Job not found</h2>
          <p className="text-gray-600 mt-2">The job you're looking for doesn't exist.</p>
          <Link href="/jobs" className="text-blue-600 hover:text-blue-800 mt-4 inline-block">
            ← Back to Jobs
          </Link>
        </div>
      </div>
    );
  } else if (!currentJob || jobLoadingState.isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <Spinner variant="default" size="xl" />
        <div className="text-center mt-3">
          <p className="text-xs text-gray-600">{jobLoadingState.message}</p>
        </div>
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
          <div className="flex items-center gap-2">
            <JobSyncStatus />
            <JobRefreshButton jobId={currentJob.id} />
          </div>
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

// Loading fallback component
function JobDetailLoading() {
  return (
    <div className="flex flex-col items-center justify-center h-full">
      <Spinner variant="default" size="xl" />
    </div>
  );
}

// Main export with Suspense boundary
export default function JobDetailPage() {
  return (
    <Suspense fallback={<JobDetailLoading />}>
      <JobDetailContent />
    </Suspense>
  );
}
