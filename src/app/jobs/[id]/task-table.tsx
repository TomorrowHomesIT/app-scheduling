"use client";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { EJobTaskProgress, EJobTaskStatus, IJobTaskUrl } from "@/models/job.model";
import type { IJobTask } from "@/models";
import { DatePickerTrigger } from "@/components/modals/date-picker/date-picker-modal";
import { NotesTrigger } from "@/components/modals/notes/notes-modal";
import { StatusTrigger } from "@/components/modals/send-email/send-email-modal";
import { ProgressTrigger } from "@/components/modals/progress/progress-modal";
import { SupplierTrigger } from "@/components/modals/supplier/supplier-modal";
import { FileLinkModalTrigger } from "@/components/modals/file-link/file-link-modal";
import { TaskDetailsTrigger } from "@/components/modals/task-details/task-details-modal";
import { CTaskProgressConfig } from "@/models/job.const";
import useAppStore from "@/store/job-store";

interface TaskTableProps {
  tasks: IJobTask[];
}

export function TaskTable({ tasks }: TaskTableProps) {
  const { updateTask } = useAppStore();

  const handleDateChange = async (taskId: number, date: Date | undefined) => {
    await updateTask(taskId, { startDate: date ?? null });
  };

  const handleNotesChange = async (taskId: number, notes: string | undefined) => {
    await updateTask(taskId, { notes: notes ?? null });
  };

  const handleStatusChange = async (taskId: number, status: EJobTaskStatus) => {
    // Update the task status in the store
    await updateTask(taskId, { status });

    // TODO: API call to trigger status-specific action
    // This is where you'll add the actual API request later
    // Example: await api.updatEJobTaskStatus(taskId, status);
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
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-4"></TableHead>
          <TableHead className="w-64 text-gray-600 text-xs">Name</TableHead>
          <TableHead className="w-48 text-gray-600 text-xs">Supplier</TableHead>
          <TableHead className="w-20 text-gray-600 text-xs">Start date</TableHead>
          <TableHead className="min-w-32 max-w-40 text-gray-600 text-xs">Notes</TableHead>
          <TableHead className="min-w-24 max-w-32 text-gray-600 text-xs">PO</TableHead>
          <TableHead className="min-w-24 max-w-32 text-gray-600 text-xs">Plans</TableHead>
          <TableHead className="min-w-32 max-w-40 text-gray-600 text-xs">Email Template</TableHead>
          <TableHead className="min-w-32 max-w-40 text-gray-600 text-xs">Progress</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {tasks.map((task) => {
          return (
            <TableRow key={task.id}>
              <TableCell className="w-4">
                <div className={`w-1 h-8 rounded ${CTaskProgressConfig[task.progress].progressColor}`} />
              </TableCell>
              <TableCell className="w-64 font-medium truncate" title={task.name}>
                <TaskDetailsTrigger task={task} onSave={handleTaskDetailsChange}>
                  {task.name}
                </TaskDetailsTrigger>
              </TableCell>
              <TableCell className="w-48 p-0">
                <SupplierTrigger
                  value={task.supplierId ?? undefined}
                  onChange={(supplierId) => handleSupplierChange(task.id, supplierId)}
                />
              </TableCell>
              <TableCell className="w-20 p-0">
                <DatePickerTrigger value={task.startDate} onChange={(date) => handleDateChange(task.id, date)} />
              </TableCell>
              <TableCell className="min-w-32 max-w-40 p-0">
                <NotesTrigger value={task.notes ?? undefined} onChange={(notes) => handleNotesChange(task.id, notes)} />
              </TableCell>
              <TableCell className="min-w-24 max-w-32">
                <FileLinkModalTrigger
                  links={task.purchaseOrderLinks || []}
                  onSave={(links) => handlePOLinksChange(task.id, links)}
                  title="Purchase Order Links"
                />
              </TableCell>
              <TableCell className="min-w-24 max-w-32">
                <FileLinkModalTrigger
                  links={task.planLinks || []}
                  onSave={(links) => handlePlanLinksChange(task.id, links)}
                  title="Plan Links"
                />
              </TableCell>
              <TableCell className="min-w-32 max-w-40">
                <StatusTrigger value={task.status} onChange={(status) => handleStatusChange(task.id, status)} />
              </TableCell>
              <TableCell className="min-w-32 max-w-40">
                <ProgressTrigger value={task.progress} onChange={(p) => handleProgressChange(task.id, p)} />
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
