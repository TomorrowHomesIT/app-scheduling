export interface IOwner {
  id: number;
  name: string;
  userId?: string;
  color?: string;
  jobs?: IOwnerJob[];
}

export interface IOwnerJob {
  ownerId: number;
  name: string;
  jobId: number;
}
