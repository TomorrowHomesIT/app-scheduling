import { useEffect, useState, Suspense } from "react";
import { useNavigate, Link } from "react-router";
import { EJobTaskProgress } from "@/models/job.model";
import { Accordion, AccordionContent, AccordionHeader, AccordionItem } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { JobTaskTable } from "@/components/job/job-task-table";
import { HardDrive } from "lucide-react";
import useJobStore from "@/store/job/job-store";
import useTaskStore from "@/store/task-store";
import { Spinner } from "@/components/ui/spinner";
import { PageHeader } from "@/components/page-header";
import { JobTaskStatus } from "@/components/job/job-task-status";
import { JobTaskTableHeader } from "@/components/job/job-task-table-header";
import { JobSyncStatus } from "@/components/job/job-sync-status";
import { JobRefreshButton } from "@/components/job/job-refresh-button";
import useLoadingStore from "@/store/loading-store";
import { useParams } from "react-router";

function JobDetailContent() {
  const navigate = useNavigate();
  const { id } = useParams();

  const { taskStages } = useTaskStore();
  const { currentJob, loadJob } = useJobStore();
  const jobLoadingState = useLoadingStore((state) => state.currentJob);

  const [error, setError] = useState<boolean>(false);

  // Redirect to jobs list if no jobId
  useEffect(() => {
    const parsedJobId = id ? parseInt(id, 10) : null;

    if (!parsedJobId || Number.isNaN(parsedJobId)) {
      navigate("/jobs");
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
      document.title = `${currentJob.name} | BASD Onsite`;
    }
  }, [id, currentJob, loadJob, navigate]);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <div className="text-center mt-3">
          <h2 className="text-2xl font-bold text-gray-900">Job not found</h2>
          <p className="text-gray-600 mt-2">The job you're looking for doesn't exist.</p>
          <Link to="/jobs" className="text-blue-600 hover:text-blue-800 mt-4 inline-block">
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
              to={`//drive.google.com/drive/folders/${currentJob.googleDriveDirId}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button variant="outline" size="icon">
                <HardDrive className="h-4 w-4" />
              </Button>
            </Link>
          )}
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
