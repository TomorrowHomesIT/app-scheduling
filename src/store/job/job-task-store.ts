import { create } from "zustand";
import { format } from "date-fns";
import type { IJobTask } from "@/models/job.model";
import type { EJobTaskStatus } from "@/models/job.model";
import type { IScheduleEmailRequest } from "@/models/email";
import { toast } from "@/store/toast-store";
import { isRetryableError } from "@/lib/api/error";
import useJobStore from "./job-store";
import useSupplierStore from "@/store/supplier-store";
import api from "@/lib/api/api";

interface JobTaskStore {
  updateTask: (taskId: number, updates: Partial<IJobTask>) => Promise<void>;
  sendTaskEmail: (taskId: number, status: EJobTaskStatus) => Promise<void>;
}

const updateTaskApi = async (taskId: number, updates: Partial<IJobTask>): Promise<IJobTask | null> => {
  try {
    const result = await api.patch(`/jobs/tasks/${taskId}`, updates);
    const updatedTask: IJobTask = result.data;
    return updatedTask;
  } catch (error) {
    if (isRetryableError(error)) {
      return null; // Request was queued for offline processing
    }

    console.error("Error updating task:", error);
    throw error;
  }
};

const sendEmailApi = async (emailRequest: IScheduleEmailRequest): Promise<boolean | null> => {
  try {
    await api.post("/email/schedule", emailRequest);
    return true;
  } catch (error) {
    if (isRetryableError(error)) {
      return null; // Request was queued for offline processing
    }

    console.error("Error sending email:", error);
    throw error;
  }
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
        success: (data) => {
          if (data === null) {
            return { message: `${updateType} will be saved when online`, type: "warning" };
          }

          return { message: `Updated ${updateType}`, type: "success" };
        },
        error: (error) => {
          updateJobTask(previousTask.jobId, taskId, previousTask);
          return `${error}`;
        },
      });
    } catch {
      // handled internally
    }
  },

  sendTaskEmail: async (taskId: number, status: EJobTaskStatus) => {
    const jobStore = useJobStore.getState();
    const supplierStore = useSupplierStore.getState();
    const { currentJob, updateJobTask } = jobStore;
    const task = currentJob?.tasks.find((task) => task.id === taskId);

    if (!currentJob || !task) {
      throw new Error("Task not found");
    }

    const supplier = task.supplierId ? supplierStore.getSupplierById(task.supplierId) : undefined;
    if (!supplier) {
      throw new Error("Supplier is required to send email");
    }

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
      jobLotCode: currentJob.name,
      jobLocation: currentJob.location,
      taskTitle: task.name,
      taskStartDate: task.startDate ? format(task.startDate, "yyyy-MM-dd") : null,
      taskNotes: task.notes,
      recipientName: supplier.name,
      recipientEmails,
      googleFileIds,
      status,
    };

    try {
      // Optimistically update the UI
      const previousStatus = task.status;
      updateJobTask(currentJob.id, task.id, { status });

      await toast.while(sendEmailApi(emailRequest), {
        loading: "Sending email...",
        success: (data) => {
          if (data === null) {
            return { message: "Email will be sent when online", type: "warning" };
          }

          return { message: "Email sent successfully", type: "success" };
        },
        error: (e) => {
          updateJobTask(currentJob.id, task.id, { status: previousStatus });
          return `Failed to send email: ${e instanceof Error ? e.message : "Unknown error"}`;
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
