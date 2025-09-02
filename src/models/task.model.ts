export interface ITask {
  id: number;
  jobId: number;
  name: string;
  supplierId: number;
  costCenterId: string;
  progress: ETaskProgress;
  status: ETaskStatus;
  stageId: number;

  notes: string;
  startDate: Date;
  purchaseOrderLinks: string[];
  planLinks: string[];
  order: number;
}

export enum ETaskProgress {
  None = 0,
  ToCall = 1,
  Called = 2,
  Confirmed = 3,
  Started = 4,
  Completed = 5,
  NotRequired = 6,
}

export enum ETaskStatus {
  None = 0,
  Scheduled = 1,
  ReScheduled = 2,
  Cancelled = 3,
}

export interface ITaskStage {
  id: number;
  name: string;
  order: number;
}
