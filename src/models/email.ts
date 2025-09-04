export interface IScheduleEmailRequest {
  jobTaskId: number;
  jobLotCode: string;
  jobLocation: string;

  taskTitle: string;
  taskStartDate: string;
  taskNotes: string;

  recipientName: string;
  recipientEmails: string[];

  sentByEmail: string;
  googleFileIds: string[];
  emailType: "schedule" | "reschedule" | "cancel";
}
