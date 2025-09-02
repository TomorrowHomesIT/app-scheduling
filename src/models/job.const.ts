import { EJobTaskStatus, EJobTaskProgress } from "./job.model";

export const CTaskStatusConfig = {
  [EJobTaskStatus.None]: {
    label: "-",
    className: "bg-transparent text-gray-500 hover:bg-gray-200",
  },
  [EJobTaskStatus.Scheduled]: {
    label: "Schedule",
    className: "bg-blue-300 text-blue-800 hover:bg-blue-400",
  },
  [EJobTaskStatus.ReScheduled]: {
    label: "Re-schedule",
    className: "bg-gray-300 text-gray-800 hover:bg-gray-400",
  },
  [EJobTaskStatus.Cancelled]: {
    label: "Cancel",
    className: "bg-red-300 text-red-800 hover:bg-red-400",
  },
} as const;

export const CTaskProgressConfig = {
  [EJobTaskProgress.None]: {
    label: "-",
    className: "bg-transparent text-gray-500 hover:bg-gray-200",
    progressColor: "bg-transparent",
  },
  [EJobTaskProgress.ToCall]: {
    label: "To Call",
    className: "bg-gray-300 text-gray-900 hover:bg-gray-400",
    progressColor: "bg-gray-500",
  },
  [EJobTaskProgress.Called]: {
    label: "Called",
    className: "bg-blue-300 text-blue-900 hover:bg-blue-400",
    progressColor: "bg-blue-500",
  },
  [EJobTaskProgress.Confirmed]: {
    label: "Confirmed",
    className: "bg-purple-300 text-purple-900 hover:bg-purple-400",
    progressColor: "bg-purple-500",
  },
  [EJobTaskProgress.Started]: {
    label: "Started",
    className: "bg-pink-300 text-pink-900 hover:bg-pink-400",
    progressColor: "bg-pink-500",
  },
  [EJobTaskProgress.Completed]: {
    label: "Done",
    className: "bg-green-300 text-green-900 hover:bg-green-400",
    progressColor: "bg-green-500",
  },
  [EJobTaskProgress.NotRequired]: {
    label: "Not Required",
    className: "bg-gray-300 text-gray-900 hover:bg-gray-400",
    progressColor: "bg-gray-400",
  },
} as const;
