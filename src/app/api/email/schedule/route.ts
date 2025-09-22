import { type NextRequest, NextResponse } from "next/server";
import type { IScheduleEmailRequest, IScheduleEmailServiceRequest } from "@/models/email";
import { createClient } from "@/lib/supabase/server";
import { withAuth } from "@/lib/api/auth";
import { EJobTaskStatus } from "@/models/job.model";

export const POST = withAuth(async (request: NextRequest) => {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const serviceEmailUrl = process.env.BASD_SERVICE_URL;
    const serviceToken = process.env.BASD_SERVICE_TOKEN;

    if (!serviceEmailUrl || !serviceToken) {
      return errorHandler("evn not configured", "Failed to send email");
    }

    console.log("Email body", JSON.stringify(request.body));

    // Parse request body
    const body: IScheduleEmailRequest = await request.json();
    const requiredFields: (keyof IScheduleEmailRequest)[] = [
      "jobTaskId",
      "jobLotCode",
      "jobLocation",
      "taskTitle",
      "taskStartDate",
      "recipientName",
      "recipientEmails",
      "status",
    ];

    const missingFields = requiredFields.filter((field) => !body[field]);

    if (!user?.email) {
      return NextResponse.json({ error: "User is missing an email address" }, { status: 400 });
    } else if (missingFields.length > 0) {
      return NextResponse.json({ error: `Missing required fields: ${missingFields.join(", ")}` }, { status: 400 });
    } else if (!body.recipientEmails?.length) {
      return NextResponse.json({ error: "At least one recipient email is required" }, { status: 400 });
    }

    // Prepare the request for the email service
    const statusMap: Record<EJobTaskStatus, IScheduleEmailServiceRequest["emailType"]> = {
      [EJobTaskStatus.Scheduled]: "schedule",
      [EJobTaskStatus.ReScheduled]: "reschedule",
      [EJobTaskStatus.Cancelled]: "cancel",
      [EJobTaskStatus.None]: "cancel",
    };
    const emailServiceRequest: IScheduleEmailServiceRequest = {
      ...body,
      emailType: statusMap[body.status],
      sentByEmail: user.email,
      sentByName: user.user_metadata?.full_name || user.email,
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

    try {
      const { data: updatedTask, error: updateError } = await supabase
        .from("cf_job_tasks")
        .update({ status: body.status })
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
});

const errorHandler = (error: unknown, message: string) => {
  console.error(message, error);
  return NextResponse.json({ error: "Internal server error" }, { status: 500 });
};
