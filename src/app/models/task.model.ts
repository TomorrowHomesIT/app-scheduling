export interface Task {
  id: number;
  name: string;
  supplierId: number;
  costCenterId: string;
  progress: TaskProgress;
  stageId: number;

  notes: string;
  dueDate: Date;
  purchaseOrderLinks: string[];
  planLinks: string[];
  order: number;
}

export interface Supplier {
  id: number;
  name: string;
}

export enum TaskProgress {
  ToCall = 1,
  Called = 2,
  Confirmed = 3,
  Started = 4,
  Completed = 5,
  NotRequired = 6,
}

export enum TaskStatus {
  Scheduled = 1,
  ReScheduled = 2,
  Cancelled = 3,
}

export interface TaskStage {
  id: number;
  name: string;
  order: number;
}
