export interface ITask {
  id: number;
  name: string;
  costCenter: number;
  docTags: string[];
  order: number;
  taskStageId?: number;
}

export interface ITaskEditUpdates {
  name?: string;
  costCenter?: number | null;
  docTags?: string[] | null;
}