import { ETaskStatus, ETaskProgress } from "./task.model";

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

export const CTaskProgressConfig = {
  [ETaskProgress.None]: {
    label: "-",
    className: "bg-transparent text-gray-400 hover:bg-gray-200",
    progressColor: "bg-transparent",
  },
  [ETaskProgress.ToCall]: {
    label: "To Call",
    className: "bg-gray-300 text-gray-900 hover:bg-gray-400",
    progressColor: "bg-gray-500",
  },
  [ETaskProgress.Called]: {
    label: "Called",
    className: "bg-blue-300 text-blue-900 hover:bg-blue-400",
    progressColor: "bg-blue-500",
  },
  [ETaskProgress.Confirmed]: {
    label: "Confirmed",
    className: "bg-purple-300 text-purple-900 hover:bg-purple-400",
    progressColor: "bg-purple-500",
  },
  [ETaskProgress.Started]: {
    label: "Started",
    className: "bg-pink-300 text-pink-900 hover:bg-pink-400",
    progressColor: "bg-pink-500",
  },
  [ETaskProgress.Completed]: {
    label: "Done",
    className: "bg-green-300 text-green-900 hover:bg-green-400",
    progressColor: "bg-green-500",
  },
  [ETaskProgress.NotRequired]: {
    label: "Not Required",
    className: "bg-gray-300 text-gray-900 hover:bg-gray-400",
    progressColor: "bg-gray-400",
  },
} as const;
