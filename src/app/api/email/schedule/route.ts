import { type NextRequest, NextResponse } from "next/server";
import type { IScheduleEmailRequest } from "@/models/email";
import { createClient } from "@/lib/supabase/server";
import { EJobTaskStatus } from "@/models/job.model";

export async function POST(request: NextRequest) {
  try {
    // Check authentication since our API is exposed to the public
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const serviceEmailUrl = process.env.BASD_SERVICE_URL;
    const serviceToken = process.env.BASD_SERVICE_TOKEN;

    if (!serviceEmailUrl || !serviceToken) {
      return errorHandler("evn not configured", "Failed to send email");
    }

    // Parse request body
    const body: IScheduleEmailRequest = await request.json();

    // Validate required fields
    const requiredFields: (keyof IScheduleEmailRequest)[] = [
      "jobTaskId",
      "jobLotCode",
      "jobLocation",
      "taskTitle",
      "taskStartDate",
      "recipientName",
      "recipientEmails",
      "emailType",
    ];

    const missingFields = requiredFields.filter((field) => !body[field]);

    if (missingFields.length > 0) {
      return NextResponse.json({ error: `Missing required fields: ${missingFields.join(", ")}` }, { status: 400 });
    } else if (!body.recipientEmails?.length) {
      return NextResponse.json({ error: "At least one recipient email is required" }, { status: 400 });
    }

    // Prepare the request for the email service
    const emailServiceRequest: IScheduleEmailRequest = {
      ...body,
      sentBy: user.email || user.id,
    };

    const endpoint = `${serviceEmailUrl}/THGScheduling/Automation/SchedulingEmail`;
    try {
      const emailResponse = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-App-Auth": serviceToken,
        },
        body: JSON.stringify(emailServiceRequest),
      });

      if (!emailResponse.ok) {
        const errorText = await emailResponse.text();
        return errorHandler(errorText, "Failed to send email");
      }
    } catch (emailError) {
      return errorHandler(emailError, "Failed to send email");
    }

    const statusMap: Record<IScheduleEmailRequest["emailType"], EJobTaskStatus> = {
      schedule: EJobTaskStatus.Scheduled,
      reschedule: EJobTaskStatus.ReScheduled,
      cancel: EJobTaskStatus.Cancelled,
    };
    try {
      const { data: updatedTask, error: updateError } = await supabase
        .from("cf_job_tasks")
        .update({ status: statusMap[body.emailType] })
        .eq("id", body.jobTaskId)
        .select()
        .single();

      if (updateError || !updatedTask) {
        return errorHandler(updateError, "Failed to update task status");
      }
    } catch (updateError) {
      return errorHandler(updateError, "Failed to update task status");
    }

    return NextResponse.json({ success: true, message: "Email sent successfully" });
  } catch (error) {
    return errorHandler(error, "Failed to send email");
  }
}

const errorHandler = (error: unknown, message: string) => {
  console.error(message, error);
  return NextResponse.json({ error: "Internal server error" }, { status: 500 });
};
