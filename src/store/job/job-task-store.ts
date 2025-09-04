import { create } from "zustand";
import type { IJobTask } from "@/models/job.model";
import { EJobTaskStatus } from "@/models/job.model";
import type { IScheduleEmailRequest } from "@/models/email";
import { toast } from "@/store/toast-store";
import { getApiErrorMessage } from "@/lib/api/error";
import useJobStore from "./job-store";
import useSupplierStore from "@/store/supplier-store";

interface JobTaskStore {
  updateTask: (taskId: number, updates: Partial<IJobTask>) => Promise<void>;
  sendTaskEmail: (task: IJobTask, status: EJobTaskStatus) => Promise<void>;
}

const updateTaskApi = async (taskId: number, updates: Partial<IJobTask>): Promise<IJobTask | null> => {
  try {
    const response = await fetch(`/api/tasks/${taskId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(updates),
    });

    if (!response.ok) {
      throw new Error(await getApiErrorMessage(response, "Failed to update task"));
    }

    const updatedTask: IJobTask = await response.json();
    return updatedTask;
  } catch (error) {
    console.error("Error updating task:", error);
    throw error;
  }
};

const sendEmailApi = async (emailRequest: IScheduleEmailRequest): Promise<void> => {
  const response = await fetch("/api/email/schedule", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(emailRequest),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "Failed to send email");
  }

  return data;
};

const useJobTaskStore = create<JobTaskStore>(() => ({
  updateTask: async (taskId: number, updates: Partial<IJobTask>) => {
    const jobStore = useJobStore.getState();
    const { updateJobTask } = jobStore;

    // Find which job contains this task
    const task = jobStore.currentJob?.tasks.find((task) => task.id === taskId);
    if (!jobStore.currentJob || !task) {
      throw new Error("Task not found");
    }

    // Store the current tasks for rollback
    const previousTask = task;

    // Optimistically update the UI
    updateJobTask(jobStore.currentJob.id, taskId, updates);

    // Determine what's being updated for specific toast messages
    const getUpdateMessage = () => {
      if (updates.supplierId !== undefined) return "supplier";
      if (updates.progress !== undefined) return "progress";
      if (updates.startDate !== undefined) return "start date";
      if (updates.notes !== undefined) return "notes";
      if (updates.purchaseOrderLinks !== undefined) return "purchase orders";
      if (updates.planLinks !== undefined) return "plans";
      if (updates.status !== undefined) return "status";
      return "task";
    };

    const updateType = getUpdateMessage();

    try {
      await toast.while(updateTaskApi(taskId, updates), {
        loading: `Saving ${updateType}...`,
        success: `Updated ${updateType}`,
        error: (error) => {
          updateJobTask(previousTask.jobId, taskId, previousTask);
          return `${error}`;
        },
      });
    } catch {
      // handled internally
    }
  },

  sendTaskEmail: async (task: IJobTask, status: EJobTaskStatus) => {
    const jobStore = useJobStore.getState();
    const supplierStore = useSupplierStore.getState();
    const { currentJob, updateJobTask } = jobStore;

    if (!currentJob) {
      throw new Error("No current job selected");
    }

    const supplier = task.supplierId ? supplierStore.getSupplierById(task.supplierId) : undefined;
    if (!supplier) {
      throw new Error("Supplier is required to send email");
    }

    // Map status to email type
    const emailTypeMap: Record<EJobTaskStatus, IScheduleEmailRequest["emailType"]> = {
      [EJobTaskStatus.Scheduled]: "schedule",
      [EJobTaskStatus.ReScheduled]: "reschedule",
      [EJobTaskStatus.Cancelled]: "cancel",
      [EJobTaskStatus.None]: "cancel",
    };
    const emailType = emailTypeMap[status];

    const googleFileIds: string[] = [];
    task.purchaseOrderLinks?.forEach((link) => {
      if (link.googleDriveId) {
        googleFileIds.push(link.googleDriveId);
      }
    });

    task.planLinks?.forEach((link) => {
      if (link.googleDriveId) {
        googleFileIds.push(link.googleDriveId);
      }
    });

    const recipientEmails = [supplier.email, supplier.secondaryEmail].filter((email) => email !== null);

    const emailRequest: IScheduleEmailRequest = {
      jobTaskId: task.id,
      jobLotCode: currentJob.name || "",
      jobLocation: currentJob.location || "",
      taskTitle: task.name,
      taskStartDate: task.startDate ? new Date(task.startDate).toISOString() : "",
      taskNotes: task.notes || "",
      recipientName: supplier.name || "",
      recipientEmails,
      googleFileIds,
      emailType,
    };

    try {
      // Optimistically update the UI
      const previousStatus = task.status;
      updateJobTask(currentJob.id, task.id, { status });

      await toast.while(sendEmailApi(emailRequest), {
        loading: "Sending email...",
        success: "Email sent successfully",
        error: (error) => {
          updateJobTask(currentJob.id, task.id, { status: previousStatus });
          return `Failed to send email: ${getApiErrorMessage(error)}`;
        },
      });
    } catch (error) {
      // Error is already handled by toast
      console.error("Failed to send email:", error);
      throw error;
    }
  },
}));

export default useJobTaskStore;
