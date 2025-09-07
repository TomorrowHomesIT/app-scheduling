import { useMemo } from "react";
import { Badge } from "../ui/badge";
import { cn } from "@/lib/utils";

interface JobTaskStatusBadgeProps {
  occuranceIndex: number;
  name: string;
}

const TaskBadgeColors = ["bg-green-100", "bg-green-200", "bg-green-300", "bg-green-400"];

export function JobTaskStatusBadge({ occuranceIndex, name }: JobTaskStatusBadgeProps) {
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
