"use client";

import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ETaskProgress, type ETaskStatus } from "@/models/task.model";
import type { ITask, ISupplier } from "@/models";
import { DatePickerTrigger } from "@/components/modals/date-picker/date-picker-modal";
import { NotesTrigger } from "@/components/modals/notes/notes-modal";
import { StatusTrigger } from "@/components/modals/send-email/send-email-modal";
import useAppStore from "@/store/store";

interface TaskTableProps {
  tasks: ITask[];
  suppliers: ISupplier[];
}

const getProgressBadge = (progress: ETaskProgress) => {
  const progressConfig = {
    [ETaskProgress.ToCall]: {
      label: "To Call",
      className: "bg-gray-100 text-gray-800 hover:bg-gray-200",
    },
    [ETaskProgress.Called]: {
      label: "Called",
      className: "bg-blue-100 text-blue-800 hover:bg-blue-200",
    },
    [ETaskProgress.Confirmed]: {
      label: "Confirmed",
      className: "bg-purple-100 text-blue-800 hover:bg-blue-200",
    },
    [ETaskProgress.Started]: {
      label: "Started",
      className: "bg-pink-100 text-pink-800 hover:bg-pink-200",
    },
    [ETaskProgress.Completed]: {
      label: "DONE",
      className: "bg-green-500 text-white hover:bg-green-600",
    },
    [ETaskProgress.NotRequired]: {
      label: "Not Required",
      className: "bg-gray-100 text-gray-600 hover:bg-gray-200",
    },
  };

  const config = progressConfig[progress];
  return <Badge className={`cursor-pointer ${config.className}`}>{config.label}</Badge>;
};

const getProgressColor = (progress: ETaskProgress) => {
  const colors = {
    [ETaskProgress.ToCall]: "bg-gray-500",
    [ETaskProgress.Called]: "bg-blue-500",
    [ETaskProgress.Confirmed]: "bg-purple-500",
    [ETaskProgress.Started]: "bg-pink-500",
    [ETaskProgress.Completed]: "bg-green-500",
    [ETaskProgress.NotRequired]: "bg-gray-400",
  };
  return colors[progress];
};

export function TaskTable({ tasks, suppliers }: TaskTableProps) {
  const { updateTask } = useAppStore();

  const handleDateChange = async (taskId: number, date: Date | undefined) => {
    if (date) {
      await updateTask(taskId, { startDate: date });
    }
  };

  const handleNotesChange = async (taskId: number, notes: string | undefined) => {
    await updateTask(taskId, { notes });
  };

  const handleStatusChange = async (taskId: number, status: ETaskStatus) => {
    // Update the task status in the store
    await updateTask(taskId, { status });

    // TODO: API call to trigger status-specific action
    // This is where you'll add the actual API request later
    // Example: await api.updateTaskStatus(taskId, status);
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
          const supplier = suppliers.find((s) => s.id === task.supplierId);
          return (
            <TableRow key={task.id}>
              <TableCell>
                <div className={`w-1 h-8 rounded ${getProgressColor(task.progress)}`} />
              </TableCell>
              <TableCell className="font-medium">{task.name}</TableCell>
              <TableCell>
                {supplier ? (
                  <Badge variant="custom">{supplier.name}</Badge>
                ) : (
                  <span className="text-sm text-muted-foreground">-</span>
                )}
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
              <TableCell>{getProgressBadge(task.progress)}</TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
