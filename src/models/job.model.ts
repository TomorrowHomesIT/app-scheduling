export interface IJob {
  id: number;
  name: string;
  location: string;
  googleDriveDirId: string | null;
  ownerId: number;
  tasks: IJobTask[];

  // Optional sync status properties - only present when loaded from local DB
  lastUpdated?: number;
  lastSynced?: number;
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
  supplierId: number | null;
  costCenter: number | null;
  progress: EJobTaskProgress;
  status: EJobTaskStatus;
  taskStageId: number;
  docTags: string[] | null;

  notes: string | null;
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
  ReScheduled = "rescheduled",
  Cancelled = "cancelled",
}

export interface IJobTaskStage {
  id: number;
  name: string;
  order: number;
}

export interface ICreateJobRequest {
  name: string;
  location: string;
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

export interface IUpdateJobRequest {
  name: string;
  location?: string;
  ownerId: number;
}
