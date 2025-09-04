import { EJobTaskStatus, EJobTaskProgress } from "./job.model";

export const CTaskStatusConfig = {
  [EJobTaskStatus.None]: {
    label: "-",
    className: "bg-transparent text-gray-500 hover:bg-gray-200 justify-start",
    textColor: "text-gray-500",
  },
  [EJobTaskStatus.Scheduled]: {
    label: "Schedule",
    className: "bg-blue-300 text-blue-800 hover:bg-blue-400",
    textColor: "text-blue-500",
  },
  [EJobTaskStatus.ReScheduled]: {
    label: "Re-schedule",
    className: "bg-gray-300 text-gray-800 hover:bg-gray-400",
    textColor: "text-gray-500",
  },
  [EJobTaskStatus.Cancelled]: {
    label: "Cancel",
    className: "bg-red-300 text-red-800 hover:bg-red-400",
    textColor: "text-red-500",
  },
} as const;

export const CTaskProgressConfig = {
  [EJobTaskProgress.None]: {
    label: "-",
    className: "bg-transparent text-gray-500 hover:bg-gray-200 justify-start",
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
    className: "bg-green-200 text-green-900 hover:bg-green-400",
    progressColor: "bg-green-500",
  },
  [EJobTaskProgress.NotRequired]: {
    label: "Not Required",
    className: "bg-orange-300 text-orange-900 hover:bg-orange-400",
    progressColor: "bg-orange-500",
  },
} as const;
