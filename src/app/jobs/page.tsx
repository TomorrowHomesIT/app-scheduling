"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
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
import useTaskTemplateStore from "@/store/task-template-store";
import type { ITask } from "@/models/task.model";
import type { ICreateJobRequest } from "@/models/job.model";

interface TaskWithStage extends ITask {
  stageId: number;
  stageName: string;
}

function SortableTaskRow({ task }: { task: TaskWithStage }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: `${task.stageId}-${task.id}`,
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
      <TableCell>{task.name}</TableCell>
      <TableCell>{task.costCenter}</TableCell>
      <TableCell>{task.docTags?.join(", ") || "-"}</TableCell>
    </TableRow>
  );
}

export default function CreateJobPage() {
  const [jobName, setJobName] = useState("");
  const [selectedOwnerId, setSelectedOwnerId] = useState("");
  const [orderedTasks, setOrderedTasks] = useState<TaskWithStage[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  const { owners } = useOwnersStore();
  const { tasks, stages, isLoading, loadTasksAndStages } = useTaskTemplateStore();

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  useEffect(() => {
    loadTasksAndStages();
  }, [loadTasksAndStages]);

  useEffect(() => {
    // When tasks and stages are loaded, organize them
    if (tasks.length > 0 && stages.length > 0) {
      const tasksWithStage: TaskWithStage[] = [];

      stages.forEach((stage) => {
        const stageTasks = tasks
          .filter((task) => task.taskStageId === stage.id)
          .sort((a, b) => a.order - b.order)
          .map((task) => ({
            ...task,
            stageId: stage.id,
            stageName: stage.name,
          }));
        tasksWithStage.push(...stageTasks);
      });

      setOrderedTasks(tasksWithStage);
    }
  }, [tasks, stages]);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (active.id !== over?.id) {
      setOrderedTasks((items) => {
        const oldIndex = items.findIndex((item) => `${item.stageId}-${item.id}` === active.id);
        const newIndex = items.findIndex((item) => `${item.stageId}-${item.id}` === over?.id);

        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const handleSave = async () => {
    if (!jobName || !selectedOwnerId) {
      alert("Please enter a job name and select a folder");
      return;
    }

    setIsSaving(true);
    try {
      // Prepare the tasks with updated order
      const jobTasks = orderedTasks.map((task, index) => ({
        taskId: task.id,
        name: task.name,
        taskStageId: task.stageId,
        docTags: task.docTags || [],
        order: index + 1,
        costCenter: task.costCenter,
      }));

      const body: ICreateJobRequest = {
        name: jobName,
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

      // Redirect to the new job page or show success message
      window.location.href = `/jobs/${data.id}`;
    } catch (error) {
      console.error("Error saving job:", error);
      alert("Failed to create job. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  // Group tasks by stage for display
  const tasksByStage = stages.map((stage) => ({
    stage,
    tasks: orderedTasks.filter((task) => task.stageId === stage.id),
  }));

  return (
    <div className="flex flex-col h-full">
      <div className="border-b bg-background">
        <div className="flex items-center justify-between p-4">
          <h1 className="text-2xl font-semibold">{jobName || "New Job"}</h1>
          <Button onClick={handleSave} disabled={isSaving || isLoading || !jobName || !selectedOwnerId}>
            {isSaving ? "Saving..." : "Create Job"}
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4">
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="folder">Folder</Label>
              <Select value={selectedOwnerId} onValueChange={setSelectedOwnerId}>
                <SelectTrigger id="folder">
                  <SelectValue placeholder="Select a folder" />
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

            <div className="space-y-2">
              <Label htmlFor="jobName">Job Name</Label>
              <Input
                id="jobName"
                value={jobName}
                onChange={(e) => setJobName(e.target.value)}
                placeholder="Enter job name"
              />
            </div>
          </div>

          {isLoading ? (
            <div className="text-center py-8">Loading tasks...</div>
          ) : (
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
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            <SortableContext
                              items={stageTasks.map((t) => `${t.stageId}-${t.id}`)}
                              strategy={verticalListSortingStrategy}
                            >
                              {stageTasks.map((task) => (
                                <SortableTaskRow key={`${task.stageId}-${task.id}`} task={task} />
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
          )}
        </div>
      </div>
    </div>
  );
}
