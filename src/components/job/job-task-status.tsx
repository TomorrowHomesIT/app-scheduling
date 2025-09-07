import { useMemo } from "react";
import { Badge } from "../ui/badge";
import { cn } from "@/lib/utils";
import { EJobTaskProgress, type IJobTask } from "@/models/job.model";

interface JobTaskStatusBadgeProps {
  occuranceIndex: number;
  name: string;
}

interface JobTaskStatusProps {
  stage: {
    name: string;
    tasks: IJobTask[];
  };
  index: number;
}

const TaskBadgeColors = ["bg-green-100", "bg-green-200", "bg-green-300", "bg-green-400"];

function JobTaskStatusBadge({ occuranceIndex, name }: JobTaskStatusBadgeProps) {
  const getIndexStyles = useMemo(() => {
    return TaskBadgeColors[occuranceIndex % TaskBadgeColors.length];
  }, [occuranceIndex]);

  return (
    <Badge variant="custom" className={cn(" text-green-900 border-green-900", getIndexStyles)}>
      <span className="font-medium text-base">
        {occuranceIndex + 1}. {name}
      </span>
    </Badge>
  );
}

export function JobTaskStatus({ stage, index }: JobTaskStatusProps) {
  const stageCompleted = stage.tasks.filter((t) => t.progress === EJobTaskProgress.Completed).length;
  const stageTotal = stage.tasks.length;

  return (
    <div className="flex items-center justify-between w-full pr-4">
      <div className="flex items-center gap-2">
        <JobTaskStatusBadge occuranceIndex={index} name={stage.name} />
        <span className="text-sm text-muted-foreground">{stageTotal} tasks</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">
          {stageCompleted}/{stageTotal}
        </span>
      </div>
    </div>
  );
}
