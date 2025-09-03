export interface IJob {
  id: number;
  name: string;
  tasks: IJobTask[];
}

export interface IJobTaskUrl {
  name: string;
  url?: string;
  googleDriveId?: string;
}

export interface IJobTask {
  id: number;
  jobId: number;
  name: string;
  supplierId: number;
  costCenter: number | null;
  progress: EJobTaskProgress;
  status: EJobTaskStatus;
  taskStageId: number;
  docTags: string[] | null;

  notes: string;
  startDate: Date | null;
  purchaseOrderLinks: IJobTaskUrl[];
  planLinks: IJobTaskUrl[];
  order: number;
}

export enum EJobTaskProgress {
  None = "none",
  ToCall = "to_call",
  Called = "called",
  Confirmed = "confirmed",
  Started = "started",
  Completed = "completed",
  NotRequired = "not_required",
}

export enum EJobTaskStatus {
  None = "none",
  Scheduled = "scheduled",
  ReScheduled = "re_scheduled",
  Cancelled = "cancelled",
}

export interface IJobTaskStage {
  id: number;
  name: string;
  order: number;
}

export interface ICreateJobRequest {
  name: string;
  ownerId: number;
  tasks: {
    taskId: number;
    name: string;
    taskStageId: number;
    docTags: string[];
    order: number;
    costCenter: number;
  }[];
}
