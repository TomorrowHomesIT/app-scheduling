"use client";

import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";
import type { EJobTaskProgress, EJobTaskStatus, IJobTaskUrl } from "@/models/job.model";
import type { IJobTask } from "@/models";
import { DatePickerTrigger } from "@/components/modals/date-picker/date-picker-modal";
import { NotesTrigger } from "@/components/modals/notes/notes-modal";
import { EmailStatusTrigger } from "@/components/modals/send-email/send-email-modal";
import { ProgressTrigger } from "@/components/modals/progress/progress-modal";
import { SupplierTrigger } from "@/components/modals/supplier/supplier-modal";
import { FileLinkModalTrigger } from "@/components/modals/file-link/file-link-modal";
import { TaskDetailsTrigger } from "@/components/modals/task-details/task-details-modal";
import { CTaskProgressConfig } from "@/models/job.const";
import useJobTaskStore from "@/store/job/job-task-store";

interface JobTaskTableProps {
  tasks: IJobTask[];
}

export function JobTaskTable({ tasks }: JobTaskTableProps) {
  const { updateTask, sendTaskEmail } = useJobTaskStore();

  const handleDateChange = async (taskId: number, date: Date | undefined) => {
    await updateTask(taskId, { startDate: date ?? null });
  };

  const handleNotesChange = async (taskId: number, notes: string | undefined) => {
    await updateTask(taskId, { notes: notes ?? null });
  };

  const handleEmailStatusChange = async (taskId: number, status: EJobTaskStatus) => {
    // Update the task status in the store
    await sendTaskEmail(taskId, status);
  };

  const handleProgressChange = async (taskId: number, progress: EJobTaskProgress) => {
    await updateTask(taskId, { progress });
  };

  const handleSupplierChange = async (taskId: number, supplierId: number | undefined) => {
    await updateTask(taskId, { supplierId: supplierId ?? null });
  };

  const handlePOLinksChange = async (taskId: number, links: IJobTaskUrl[]) => {
    await updateTask(taskId, { purchaseOrderLinks: links });
  };

  const handlePlanLinksChange = async (taskId: number, links: IJobTaskUrl[]) => {
    await updateTask(taskId, { planLinks: links });
  };

  const handleTaskDetailsChange = async (taskId: number, updates: Partial<IJobTask>) => {
    // Convert docTags to null if empty array for consistency
    const processedUpdates = {
      ...updates,
      docTags: updates.docTags && updates.docTags.length === 0 ? null : updates.docTags,
    };
    await updateTask(taskId, processedUpdates);
  };

  return (
    <div className="overflow-x-auto -mx-4 px-4 lg:mx-0 lg:px-0">
      <Table className="min-w-[900px] lg:min-w-full">
        <TableBody>
          {tasks.map((task) => {
            return (
              <TableRow key={task.id}>
                <TableCell className="sticky left-0 z-15 bg-white w-4">
                  <div className={`w-1 h-8 rounded ${CTaskProgressConfig[task.progress].progressColor}`} />
                </TableCell>
                <TableCell
                  className="sticky left-4 z-15 bg-white w-32 lg:w-48 xl:w-64 font-medium truncate after:absolute after:right-0 after:top-0 after:bottom-0 after:w-px after:bg-gray-200"
                  title={task.name}
                >
                  <TaskDetailsTrigger task={task} onSave={handleTaskDetailsChange}>
                    <span className="block truncate max-w-[120px] lg:max-w-none">{task.name}</span>
                  </TaskDetailsTrigger>
                </TableCell>
                <TableCell className="w-28 lg:w-36 p-0">
                  <SupplierTrigger
                    value={task.supplierId ?? undefined}
                    onChange={(supplierId) => handleSupplierChange(task.id, supplierId)}
                  />
                </TableCell>
                <TableCell className="w-20 p-0">
                  <DatePickerTrigger value={task.startDate} onChange={(date) => handleDateChange(task.id, date)} />
                </TableCell>
                <TableCell className="w-32 lg:w-40 p-0">
                  <NotesTrigger
                    value={task.notes ?? undefined}
                    onChange={(notes) => handleNotesChange(task.id, notes)}
                  />
                </TableCell>
                <TableCell className="w-18 lg:w-20 p-0">
                  <FileLinkModalTrigger
                    links={task.purchaseOrderLinks || []}
                    onSave={(links) => handlePOLinksChange(task.id, links)}
                    title="Purchase Order Links"
                  />
                </TableCell>
                <TableCell className="w-18 lg:w-20 p-0">
                  <FileLinkModalTrigger
                    links={task.planLinks || []}
                    onSave={(links) => handlePlanLinksChange(task.id, links)}
                    title="Plan Links"
                  />
                </TableCell>
                <TableCell className="w-32 lg:w-32">
                  <EmailStatusTrigger
                    task={task}
                    value={task.status}
                    onSendEmail={(status) => handleEmailStatusChange(task.id, status)}
                  />
                </TableCell>
                <TableCell className="w-28 lg:w-32">
                  <ProgressTrigger value={task.progress} onChange={(p) => handleProgressChange(task.id, p)} />
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
