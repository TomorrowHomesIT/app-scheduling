export interface IOwner {
  id: number;
  name: string;
  userId?: string;
  color?: string;
  jobs?: IOwnerJob[];
}

export interface IOwnerJob {
  id: number;
  ownerId: number;
  name: string;
  location?: string;
}
