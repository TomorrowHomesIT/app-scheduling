"use client";

import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Calendar } from "lucide-react";
import { ETaskProgress, ETaskStatus } from "@/models/task.model";
import type { ITask, ISupplier } from "@/models";

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

const getStatusBadge = (status: ETaskStatus) => {
  if (status === ETaskStatus.None) return null;

  const statusConfig = {
    [ETaskStatus.Scheduled]: {
      label: "Scheduled",
      className: "bg-blue-100 text-blue-800 hover:bg-blue-200",
    },
    [ETaskStatus.ReScheduled]: {
      label: "Re-scheduled",
      className: "bg-orange-100 text-orange-800 hover:bg-orange-200",
    },
    [ETaskStatus.Cancelled]: {
      label: "Cancelled",
      className: "bg-red-100 text-red-800 hover:bg-red-200",
    },
    [ETaskStatus.None]: {
      label: "",
      className: "",
    },
  } as const;

  const config = statusConfig[status];
  return (
    <Badge className={`cursor-pointer ${config.className}`}>
      <span className={`w-2 h-2 rounded-full ${getStatusColor(status)}`} />
      {config.label}
    </Badge>
  );
};

const getStatusColor = (status: ETaskStatus) => {
  const colors = {
    [ETaskStatus.None]: "bg-transparent",
    [ETaskStatus.Scheduled]: "bg-blue-500",
    [ETaskStatus.ReScheduled]: "bg-orange-500",
    [ETaskStatus.Cancelled]: "bg-red-500",
  };
  return colors[status];
};

const formatDate = (date: Date) => {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(date);
};

export function TaskTable({ tasks, suppliers }: TaskTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-8"></TableHead>
          <TableHead>Name</TableHead>
          <TableHead>Supplier</TableHead>
          <TableHead>Due date</TableHead>
          <TableHead>Notes</TableHead>
          <TableHead>PO</TableHead>
          <TableHead>Plans</TableHead>
          <TableHead>Status</TableHead>
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
                  <Badge variant="custom" color={supplier.color}>
                    {supplier.name}
                  </Badge>
                ) : (
                  <span className="text-sm text-muted-foreground">-</span>
                )}
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-1">
                  <Calendar className="h-3 w-3 text-muted-foreground" />
                  <span className="text-sm">{formatDate(task.dueDate)}</span>
                </div>
              </TableCell>
              <TableCell>
                <span className="text-sm text-muted-foreground">{task.notes || "-"}</span>
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
              <TableCell>{getStatusBadge(task.status)}</TableCell>
              <TableCell>{getProgressBadge(task.progress)}</TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
