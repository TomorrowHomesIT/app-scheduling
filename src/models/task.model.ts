export interface ITask {
  id: number;
  name: string;
  costCenter: number;
  docTags: string[];
  order: number;
  stageId?: number;
}
