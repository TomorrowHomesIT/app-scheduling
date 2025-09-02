"use client";

import Link from "next/link";
import { jobs } from "@/lib/mock-data";
import { EJobTaskProgress } from "@/models/job.model";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default function JobsPage() {
  return (
    <div className="flex flex-col h-full">
      <div className="border-b bg-background">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-semibold">All Jobs</h1>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Job Name</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Total Tasks</TableHead>
              <TableHead>Completed Tasks</TableHead>
              <TableHead>Progress</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {jobs.map((job) => {
              const completedTasks = job.tasks.filter((task) => task.progress === EJobTaskProgress.Completed).length;
              const progressPercentage = Math.round((completedTasks / job.tasks.length) * 100);

              return (
                <TableRow key={job.id}>
                  <TableCell>
                    <Link href={`/jobs/${job.id}`} className="font-medium hover:underline">
                      {job.name}
                    </Link>
                  </TableCell>
                  <TableCell>
                    {completedTasks === job.tasks.length ? (
                      <Badge className="bg-green-500 text-white">Complete</Badge>
                    ) : (
                      <Badge className="bg-blue-500 text-white">In Progress</Badge>
                    )}
                  </TableCell>
                  <TableCell>{job.tasks.length}</TableCell>
                  <TableCell>{completedTasks}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-500" style={{ width: `${progressPercentage}%` }} />
                      </div>
                      <span className="text-sm text-muted-foreground">{progressPercentage}%</span>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
