import { create } from "zustand";
import { format } from "date-fns";
import type { IJobTask } from "@/models/job.model";
import type { EJobTaskStatus } from "@/models/job.model";
import type { IScheduleEmailRequest } from "@/models/email";
import { toast } from "@/store/toast-store";
import { getApiErrorMessage } from "@/lib/api/error";
import { offlineQueue } from "@/lib/offline-queue";
import useJobStore from "./job-store";
import useSupplierStore from "@/store/supplier-store";

interface JobTaskStore {
  updateTask: (taskId: number, updates: Partial<IJobTask>) => Promise<void>;
  sendTaskEmail: (taskId: number, status: EJobTaskStatus) => Promise<void>;
}

const updateTaskApi = async (taskId: number, updates: Partial<IJobTask>): Promise<IJobTask | null> => {
  try {
    const result = await offlineQueue.queueRequest(`/api/tasks/${taskId}`, "PATCH", updates, {
      "Content-Type": "application/json",
    });

    if (result.success && result.response) {
      if (!result.response.ok) {
        throw new Error(await getApiErrorMessage(result.response, "Failed to update task"));
      }
      const updatedTask: IJobTask = await result.response.json();
      return updatedTask;
    } else if (result.queued) {
      // Request was queued for offline processing - return null to indicate no immediate response
      return null;
    } else {
      throw new Error("Failed to update task");
    }
  } catch (error) {
    console.error("Error updating task:", error);
    throw error;
  }
};

const sendEmailApi = async (emailRequest: IScheduleEmailRequest): Promise<{ success: boolean; queued: boolean }> => {
  const result = await offlineQueue.queueRequest("/api/email/schedule", "POST", emailRequest, {
    "Content-Type": "application/json",
  });

  if (result.success && result.response) {
    const data = await result.response.json();
    if (!result.response.ok) {
      throw new Error(data.error || "Failed to send email");
    }
    return { success: true, queued: false };
  } else if (result.queued) {
    return { success: true, queued: true };
  } else {
    throw new Error("Failed to send email");
  }
};

const useJobTaskStore = create<JobTaskStore>(() => ({
  updateTask: async (taskId: number, updates: Partial<IJobTask>) => {
    const jobStore = useJobStore.getState();
    const { updateJobTask, updateJobLastSynced } = jobStore;

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

          // Mark the job as synced if it goes through the API
          updateJobLastSynced(previousTask.jobId);
          return { message: `Updated ${updateType}`, type: "success" };
        },
        error: (error) => {
          updateJobTask(previousTask.jobId, taskId, previousTask);
          updateJobLastSynced(previousTask.jobId);
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
    const { currentJob, updateJobTask, updateJobLastSynced } = jobStore;
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

          // Mark the job as synced if it goes through the API
          updateJobLastSynced(currentJob.id);
          return { message: "Email sent successfully", type: "success" };
        },
        error: (e) => {
          updateJobTask(currentJob.id, task.id, { status: previousStatus });
          updateJobLastSynced(currentJob.id);
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
