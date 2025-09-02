"use client";

import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useEffect } from "react";
import type { EJobTaskProgress, EJobTaskStatus } from "@/models/job.model";
import type { IJobTask } from "@/models";
import { DatePickerTrigger } from "@/components/modals/date-picker/date-picker-modal";
import { NotesTrigger } from "@/components/modals/notes/notes-modal";
import { StatusTrigger } from "@/components/modals/send-email/send-email-modal";
import { ProgressTrigger } from "@/components/modals/progress/progress-modal";
import { SupplierTrigger } from "@/components/modals/supplier/supplier-modal";
import { CTaskProgressConfig } from "@/models/job.const";
import useAppStore from "@/store/job-store";
import useSupplierStore from "@/store/supplier-store";

interface TaskTableProps {
  tasks: IJobTask[];
}

export function TaskTable({ tasks }: TaskTableProps) {
  const { updateTask } = useAppStore();

  const handleDateChange = async (taskId: number, date: Date | undefined) => {
    if (date) {
      await updateTask(taskId, { startDate: date });
    }
  };

  const handleNotesChange = async (taskId: number, notes: string | undefined) => {
    await updateTask(taskId, { notes });
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
    await updateTask(taskId, { supplierId });
  };

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-8"></TableHead>
          <TableHead>Name</TableHead>
          <TableHead>Supplier</TableHead>
          <TableHead>Start date</TableHead>
          <TableHead>Notes</TableHead>
          <TableHead>PO</TableHead>
          <TableHead>Plans</TableHead>
          <TableHead>Email Template</TableHead>
          <TableHead>Progress</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {tasks.map((task) => {
          return (
            <TableRow key={task.id}>
              <TableCell>
                <div className={`w-1 h-8 rounded ${CTaskProgressConfig[task.progress].progressColor}`} />
              </TableCell>
              <TableCell className="font-medium">{task.name}</TableCell>
              <TableCell className="p-0">
                <SupplierTrigger
                  value={task.supplierId}
                  onChange={(supplierId) => handleSupplierChange(task.id, supplierId)}
                />
              </TableCell>
              <TableCell className="p-0">
                <DatePickerTrigger value={task.startDate} onChange={(date) => handleDateChange(task.id, date)} />
              </TableCell>
              <TableCell className="p-0 max-w-24">
                <NotesTrigger value={task.notes} onChange={(notes) => handleNotesChange(task.id, notes)} />
              </TableCell>
              <TableCell>
                <div className="flex gap-1">
                  {task.purchaseOrderLinks && task.purchaseOrderLinks.length > 0 ? (
                    task.purchaseOrderLinks.map((link) => (
                      <Badge key={link} variant="outline" className="text-xs">
                        PDF
                      </Badge>
                    ))
                  ) : (
                    <span className="text-sm text-muted-foreground">-</span>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <div className="flex gap-1">
                  {task.planLinks && task.planLinks.length > 0 ? (
                    task.planLinks.map((link) => (
                      <Badge key={link} variant="outline" className="text-xs">
                        PDF
                      </Badge>
                    ))
                  ) : (
                    <span className="text-sm text-muted-foreground">-</span>
                  )}
                </div>
              </TableCell>
              <TableCell className="p-0">
                <StatusTrigger value={task.status} onChange={(status) => handleStatusChange(task.id, status)} />
              </TableCell>
              <TableCell className="p-0">
                <ProgressTrigger
                  value={task.progress}
                  onChange={(progress) => handleProgressChange(task.id, progress)}
                />
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
