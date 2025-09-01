export interface IFolder {
  id: number;
  name: string;
  userId?: string;
  color?: string;
  jobs?: IFolderJob[];
}

export interface IFolderJob {
  folderId: number;
  name: string;
  jobId: number;
}
