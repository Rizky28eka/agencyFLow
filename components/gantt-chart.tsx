"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { eachDayOfInterval, format, differenceInDays } from "date-fns";
import React, { useRef, useEffect, useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";

import { getProjectViewData } from "@/app/actions/project-views";
import { Project, Task } from "@prisma/client";

interface GanttTask extends Task {
  dependenciesOn: { dependsOnId: string }[];
  assignee: {
    id?: string;
    name: string | null;
  } | null;
}

interface GanttProject extends Project {
  tasks: GanttTask[];
}

interface GanttChartProps {
  projectId: string;
}

const DAY_WIDTH = 30;
const TASK_HEIGHT = 30;

export function GanttChart({ projectId }: GanttChartProps) {
  const [projectData, setProjectData] = useState<GanttProject | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const taskRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const [isDragging, setIsDragging] = useState(false);
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [initialX, setInitialX] = useState(0);
  const [initialTaskLeft, setInitialTaskLeft] = useState(0);
  const [initialTaskWidth, setInitialTaskWidth] = useState(0);

  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      setError(null);
      try {
        const data = await getProjectViewData(projectId);
        setProjectData(data);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "An unknown error occurred"
        );
        console.error("Error fetching project view data:", err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, [projectId]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging || !draggedTaskId) return;

      const dx = e.clientX - initialX;
      const newLeft = initialTaskLeft + dx;

      const draggedTaskElement = taskRefs.current[draggedTaskId];
      if (draggedTaskElement) {
        draggedTaskElement.style.left = `${newLeft}px`;
      }
    };

    const handleMouseUp = (e: MouseEvent) => {
      if (!isDragging || !draggedTaskId) return;

      setIsDragging(false);
      setDraggedTaskId(null);

      const dx = e.clientX - initialX;
      const daysMoved = Math.round(dx / DAY_WIDTH);

      const draggedTask = projectData?.tasks.find(
        (t) => t.id === draggedTaskId
      );

      if (draggedTask && projectData) {
        const newStartDate = new Date(draggedTask.startDate || new Date());
        newStartDate.setDate(newStartDate.getDate() + daysMoved);

        const newDueDate = new Date(draggedTask.dueDate || new Date());
        newDueDate.setDate(newDueDate.getDate() + daysMoved);

        console.log(
          `Task ${draggedTask.title} moved by ${daysMoved} days. New Start: ${newStartDate.toDateString()}, New Due: ${newDueDate.toDateString()}`
        );
      }
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [
    isDragging,
    draggedTaskId,
    initialX,
    initialTaskLeft,
    initialTaskWidth,
    projectData,
  ]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-1/3" />
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-48 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return <p className="text-red-500">{error}</p>;
  }

  if (!projectData) {
    return (
      <p className="text-center text-muted-foreground py-4">
        No project data found for Gantt chart.
      </p>
    );
  }

  const project = projectData;
  const tasks = project.tasks || [];

  let minDate = project.startDate || new Date();
  let maxDate = project.endDate || new Date();

  tasks.forEach((task) => {
    if (task.startDate && task.startDate < minDate) minDate = task.startDate;
    if (task.dueDate && task.dueDate > maxDate) maxDate = task.dueDate;
  });

  const totalDays = differenceInDays(maxDate, minDate) + 1;
  const chartWidth = totalDays * DAY_WIDTH;

  const days = eachDayOfInterval({ start: minDate, end: maxDate });

  const getTaskPosition = (taskId: string) => {
    const taskElement = taskRefs.current[taskId];
    const scrollElement = scrollAreaRef.current?.querySelector(
      "[data-radix-scroll-area-viewport]"
    ) as HTMLElement | null;

    if (!taskElement || !scrollElement) return null;

    const taskRect = taskElement.getBoundingClientRect();
    const scrollRect = scrollElement.getBoundingClientRect();

    const x = taskRect.left - scrollRect.left + scrollElement.scrollLeft;
    const y = taskRect.top - scrollRect.top + scrollElement.scrollTop;

    return {
      x,
      y,
      width: taskRect.width,
      height: taskRect.height,
    };
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Project Gantt Chart: {project.name}</CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[600px] w-full" ref={scrollAreaRef}>
          <div className="relative" style={{ width: chartWidth }}>
            {/* Timeline Header */}
            <div className="flex border-b border-gray-200">
              {days.map((day, index) => (
                <div
                  key={index}
                  className="flex-shrink-0 text-xs text-center border-r border-gray-200"
                  style={{ width: DAY_WIDTH }}
                >
                  {format(day, "MMM d")}
                </div>
              ))}
            </div>

            {/* Project + Tasks */}
            <div className="flex flex-col space-y-4 mt-4">
              <div
                key={project.id}
                className="relative border p-4 rounded-md mb-4"
              >
                <h3 className="font-semibold text-lg mb-2">{project.name}</h3>
                <div
                  className="relative"
                  style={{
                    height: tasks.length * TASK_HEIGHT + "px",
                  }}
                >
                  {tasks.map((task, taskIndex) => {
                    const taskStartOffset = differenceInDays(
                      task.startDate || minDate,
                      minDate
                    );
                    const taskDuration =
                      differenceInDays(
                        task.dueDate || maxDate,
                        task.startDate || minDate
                      ) + 1;
                    const taskLeft = taskStartOffset * DAY_WIDTH;
                    const taskWidth = taskDuration * DAY_WIDTH;
                    const taskTop = taskIndex * TASK_HEIGHT;

                    return (
                      <div
                        key={task.id}
                        ref={(el) => {
                          taskRefs.current[task.id] = el;
                        }}
                        className="absolute bg-blue-500 text-white p-1 text-xs rounded-sm overflow-hidden whitespace-nowrap cursor-grab"
                        style={{
                          left: taskLeft,
                          width: taskWidth,
                          top: taskTop,
                          height: TASK_HEIGHT,
                        }}
                        onMouseDown={(e) => {
                          setIsDragging(true);
                          setDraggedTaskId(task.id);
                          setInitialX(e.clientX);
                          setInitialTaskLeft(taskLeft);
                          setInitialTaskWidth(taskWidth);
                        }}
                      >
                        {task.title}
                        {task.assignee && (
                          <span className="ml-2 text-gray-200 text-xs">
                            ({task.assignee.name})
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Dependency Lines */}
            <svg className="absolute top-0 left-0 w-full h-full pointer-events-none">
              {tasks.map((task) =>
                task.dependenciesOn?.map((dep) => {
                  const dependentTaskPos = getTaskPosition(task.id);
                  const dependsOnTaskPos = getTaskPosition(dep.dependsOnId);

                  if (!dependentTaskPos || !dependsOnTaskPos) return null;

                  const x1 = dependsOnTaskPos.x + dependsOnTaskPos.width;
                  const y1 = dependsOnTaskPos.y + dependsOnTaskPos.height / 2;
                  const x2 = dependentTaskPos.x;
                  const y2 = dependentTaskPos.y + dependentTaskPos.height / 2;

                  return (
                    <line
                      key={`${dep.dependsOnId}-${task.id}`}
                      x1={x1}
                      y1={y1}
                      x2={x2}
                      y2={y2}
                      stroke="black"
                      strokeWidth="2"
                      markerEnd="url(#arrowhead)"
                    />
                  );
                })
              )}
              <defs>
                <marker
                  id="arrowhead"
                  markerWidth="10"
                  markerHeight="7"
                  refX="0"
                  refY="3.5"
                  orient="auto"
                >
                  <polygon points="0 0, 10 3.5, 0 7" fill="black" />
                </marker>
              </defs>
            </svg>
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
