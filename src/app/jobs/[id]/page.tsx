"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { EJobTaskProgress } from "@/models/job.model";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { TaskTable } from "@/app/jobs/[id]/task-table";
import { ChevronLeft } from "lucide-react";
import useJobStore from "@/store/job-store";
import useSupplierStore from "@/store/supplier-store";
import useTaskStore from "@/store/task-store";

interface JobDetailPageProps {
  params: Promise<{ id: string }>;
}

export default function JobDetailPage({ params }: JobDetailPageProps) {
  const { id } = use(params);
  const { taskStages, loadTaskStages } = useTaskStore();
  const { currentJob, loadJob } = useJobStore();
  const { loadSuppliers } = useSupplierStore();

  // Load suppliers when component mounts
  useEffect(() => {
    loadSuppliers();
    loadTaskStages();
  }, [loadSuppliers, loadTaskStages]);
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

    if (currentJob) document.title = currentJob.name;
  }, [id, loadJob, currentJob]);

  if (error || Number.isNaN(Number(id))) {
    return notFound();
  } else if (!currentJob || currentJob.id !== Number(id)) {
    return <div className="flex items-center justify-center h-full">Loading...</div>;
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
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-4">
            <Link href="/jobs">
              <Button variant="ghost" size="icon">
                <ChevronLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-semibold">{currentJob.name}</h1>
              <p className="text-sm text-muted-foreground">
                {completedTasks} of {totalTasks} tasks completed
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4">
        <Accordion type="multiple" defaultValue={taskStages.map((s) => s.id.toString())}>
          {tasksByStage.map((stage, index) => {
            const stageCompleted = stage.tasks.filter((t) => t.progress === EJobTaskProgress.Completed).length;
            const stageTotal = stage.tasks.length;

            return (
              <AccordionItem key={stage.id} value={stage.id.toString()}>
                <AccordionTrigger className="hover:no-underline">
                  <div className="flex items-center justify-between w-full pr-4">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-base">
                        {index + 1}. {stage.name}
                      </span>
                      <span className="text-sm text-muted-foreground">{stageTotal} tasks</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">
                        {stageCompleted}/{stageTotal}
                      </span>
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <TaskTable tasks={stage.tasks} />
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>
      </div>
    </div>
  );
}
