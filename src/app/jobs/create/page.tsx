"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";
import useOwnersStore from "@/store/owners-store";
import useTaskTemplateStore from "@/store/task-store";
import type { ITask } from "@/models/task.model";
import type { ICreateJobRequest } from "@/models/job.model";
import { PageHeader } from "@/components/page-header";
import { Spinner } from "@/components/ui/spinner";
import { TaskTemplateEditTrigger } from "@/components/modals/task-edit/task-template-edit-trigger";
import { useRouter } from "next/navigation";
import { getApiErrorMessage } from "@/lib/api/error";
import { toast } from "@/store/toast-store";
import { cn } from "@/lib/utils";

interface TaskWithStage extends ITask {
  taskStageId: number;
  stageName: string;
  enabled: boolean;
}

function SortableTaskRow({
  task,
  onToggleEnabled,
}: {
  task: TaskWithStage;
  onToggleEnabled: (taskId: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: `${task.taskStageId}-${task.id}`,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <TableRow ref={setNodeRef} style={style}>
      <TableCell>
        <button {...attributes} {...listeners} className="cursor-move">
          <GripVertical className="h-4 w-4 text-gray-400" />
        </button>
      </TableCell>
      <TableCell className={cn(task.enabled ? "" : "opacity-50 line-through", "px-0")}>
        <TaskTemplateEditTrigger className="px-2" task={task}>{task.name}</TaskTemplateEditTrigger>
      </TableCell>
      <TableCell className={task.enabled ? "" : "opacity-50 line-through"}>{task.costCenter}</TableCell>
      <TableCell className={task.enabled ? "" : "opacity-50 line-through"}>{task.docTags?.join(", ") || "-"}</TableCell>
      <TableCell className="text-right pr-4" onClick={(e) => e.stopPropagation()}>
        <Checkbox checked={task.enabled} onCheckedChange={() => onToggleEnabled(`${task.taskStageId}-${task.id}`)} />
      </TableCell>
    </TableRow>
  );
}

export default function CreateJobPage() {
  const [jobName, setJobName] = useState("");
  const [selectedOwnerId, setSelectedOwnerId] = useState("");
  const [jobLocation, setJobLocation] = useState("");
  const [orderedTasks, setOrderedTasks] = useState<TaskWithStage[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const router = useRouter();

  const { owners } = useOwnersStore();
  const { tasks, taskStages, isLoading, loadTasks } = useTaskTemplateStore();

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  useEffect(() => {
    // When tasks and stages are loaded, organize them
    if (tasks.length > 0 && taskStages.length > 0) {
      const tasksWithStage: TaskWithStage[] = [];

      taskStages.forEach((stage) => {
        const stageTasks = tasks
          .filter((task) => task.taskStageId === stage.id)
          .sort((a, b) => a.order - b.order)
          .map((task) => ({
            ...task,
            taskStageId: stage.id,
            stageName: stage.name,
            enabled: true,
          }));
        tasksWithStage.push(...stageTasks);
      });

      setOrderedTasks(tasksWithStage);
    }
  }, [tasks, taskStages]);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (active.id !== over?.id) {
      setOrderedTasks((items) => {
        const oldIndex = items.findIndex((item) => `${item.taskStageId}-${item.id}` === active.id);
        const newIndex = items.findIndex((item) => `${item.taskStageId}-${item.id}` === over?.id);

        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const toggleTaskEnabled = (taskKey: string) => {
    setOrderedTasks((tasks) =>
      tasks.map((task) => (`${task.taskStageId}-${task.id}` === taskKey ? { ...task, enabled: !task.enabled } : task)),
    );
  };

  const handleSave = async () => {
    if (!jobName || !selectedOwnerId || !jobLocation) {
      alert("Please enter a job name, location and select a owner");
      return;
    }

    setIsSaving(true);
    try {
      // Prepare the tasks with updated order, only including enabled tasks
      const enabledTasks = orderedTasks.filter((task) => task.enabled);
      const jobTasks = enabledTasks.map((task, index) => ({
        taskId: task.id,
        name: task.name,
        taskStageId: task.taskStageId,
        docTags: task.docTags || [],
        order: index + 1,
        costCenter: task.costCenter,
      }));

      const body: ICreateJobRequest = {
        name: jobName,
        location: jobLocation,
        ownerId: parseInt(selectedOwnerId, 10),
        tasks: jobTasks,
      };

      const response = await fetch("/api/jobs", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        throw new Error("Failed to create job");
      }

      const data = await response.json();

      // Refresh owners to include the new job
      const { loadOwners } = useOwnersStore.getState();
      await loadOwners();

      router.push(`/jobs/${data.id}`);
    } catch (error) {
      const errorMessage = await getApiErrorMessage(error);
      toast.error(errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  // Group tasks by stage for display
  const tasksByStage = taskStages.map((stage) => ({
    stage,
    tasks: orderedTasks.filter((task) => task.taskStageId === stage.id),
  }));

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <Spinner variant="default" size="xl" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="border-b bg-background">
        <PageHeader title="Create" backLink="/" description="Stand up a new job">
          <Button onClick={handleSave} disabled={isSaving || isLoading}>
            {isSaving ? "Saving..." : "Create"}
          </Button>
        </PageHeader>
      </div>

      <div className="flex-1 overflow-auto p-4">
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="jobName">Name</Label>
              <Input
                id="jobName"
                value={jobName}
                onChange={(e) => setJobName(e.target.value)}
                placeholder="Enter job name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="jobName">Location</Label>
              <Input
                id="jobLocation"
                value={jobLocation}
                onChange={(e) => setJobLocation(e.target.value)}
                placeholder="Enter job location"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="folder">Owner</Label>
              <Select value={selectedOwnerId} onValueChange={setSelectedOwnerId}>
                <SelectTrigger id="folder">
                  <SelectValue placeholder="Select a owner" />
                </SelectTrigger>
                <SelectContent>
                  {owners.map((owner) => (
                    <SelectItem key={owner.id} value={owner.id.toString()}>
                      {owner.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <div className="space-y-6">
              {tasksByStage.map(({ stage, tasks: stageTasks }) => (
                <div key={stage.id} className="space-y-2">
                  <h3 className="text-lg font-semibold">{stage.name}</h3>
                  {stageTasks.length > 0 ? (
                    <div className="border rounded-lg">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-10"></TableHead>
                            <TableHead>Task Name</TableHead>
                            <TableHead>Cost Center</TableHead>
                            <TableHead>Doc Tags</TableHead>
                            <TableHead className="text-right pr-4">Include</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          <SortableContext
                            items={stageTasks.map((t) => `${t.taskStageId}-${t.id}`)}
                            strategy={verticalListSortingStrategy}
                          >
                            {stageTasks.map((task) => (
                              <SortableTaskRow
                                key={`${task.taskStageId}-${task.id}`}
                                task={task}
                                onToggleEnabled={toggleTaskEnabled}
                              />
                            ))}
                          </SortableContext>
                        </TableBody>
                      </Table>
                    </div>
                  ) : (
                    <div className="text-sm text-gray-500 p-4 border rounded-lg">No tasks in this stage</div>
                  )}
                </div>
              ))}
            </div>
          </DndContext>
        </div>
      </div>
    </div>
  );
}
