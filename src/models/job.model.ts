import type { ITask } from "./task.model";

export interface IJob {
  id: number;
  name: string;
  tasks: ITask[];
}
