import type { EJobTaskStatus } from "./job.model";

export interface IScheduleEmailRequest {
  jobTaskId: number;
  jobLotCode: string;
  jobLocation: string;

  taskTitle: string;
  taskStartDate: string | null;
  taskNotes: string | null;

  recipientName: string;
  recipientEmails: string[];

  googleFileIds: string[];
  status: EJobTaskStatus;
}

export type TEmailType = "schedule" | "reschedule" | "cancel";

export interface IScheduleEmailServiceRequest extends IScheduleEmailRequest {
  sentByName?: string;
  sentByEmail: string;
  emailType: TEmailType;
}
