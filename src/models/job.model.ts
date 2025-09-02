export interface IJob {
  id: number;
  name: string;
  tasks: IJobTask[];
}

export interface IJobTask {
  id: number;
  jobId: number;
  name: string;
  supplierId: number;
  costCenterId: string;
  progress: EJobTaskProgress;
  status: EJobTaskStatus;
  stageId: number;

  notes: string;
  startDate: Date;
  purchaseOrderLinks: string[];
  planLinks: string[];
  order: number;
}

export enum EJobTaskProgress {
  None = 0,
  ToCall = 1,
  Called = 2,
  Confirmed = 3,
  Started = 4,
  Completed = 5,
  NotRequired = 6,
}

export enum EJobTaskStatus {
  None = 0,
  Scheduled = 1,
  ReScheduled = 2,
  Cancelled = 3,
}

export interface IJobTaskStage {
  id: number;
  name: string;
  order: number;
}
