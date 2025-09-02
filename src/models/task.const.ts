import { ETaskStatus } from "./task.model";

export const CTaskStatusConfig = {
  [ETaskStatus.None]: {
    label: "-",
    className: "bg-transparent text-gray-400 hover:bg-gray-200",
  },
  [ETaskStatus.Scheduled]: {
    label: "Schedule",
    className: "bg-blue-300 text-blue-800 hover:bg-blue-400",
  },
  [ETaskStatus.ReScheduled]: {
    label: "Re-schedule",
    className: "bg-gray-300 text-gray-800 hover:bg-gray-400",
  },
  [ETaskStatus.Cancelled]: {
    label: "Cancel",
    className: "bg-red-300 text-red-800 hover:bg-red-400",
  },
} as const;
