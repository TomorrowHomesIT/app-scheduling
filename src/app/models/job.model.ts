import type { Task } from "./task.model";

export interface Job {
  id: number;
  name: string;
  tasks: Task[];
}
