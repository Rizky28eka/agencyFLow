import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { eachDayOfInterval, format, differenceInDays } from "date-fns";
import React, { useRef, useEffect } from "react"; // Import React, useRef, useEffect

interface Task {
  id: string;
  title: string;
  startDate: Date;
  dueDate: Date;
  dependencies?: string[];
}

interface Project {
  id: string;
  name: string;
  startDate: Date;
  endDate: Date;
  tasks: Task[];
}

interface GanttChartProps {
  projects: Project[];
}

const DAY_WIDTH = 30; // Pixels per day
const TASK_HEIGHT = 30; // Height of each task bar

export function GanttChart({ projects }: GanttChartProps) {
  const taskRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  // Calculate overall date range
  let minDate = projects[0]?.startDate || new Date();
  let maxDate = projects[0]?.endDate || new Date();

  projects.forEach(project => {
    if (project.startDate < minDate) minDate = project.startDate;
    if (project.endDate > maxDate) maxDate = project.endDate;
    project.tasks.forEach(task => {
      if (task.startDate < minDate) minDate = task.startDate;
      if (task.dueDate > maxDate) maxDate = task.dueDate;
    });
  });

  const totalDays = differenceInDays(maxDate, minDate) + 1;
  const chartWidth = totalDays * DAY_WIDTH;

  const days = eachDayOfInterval({ start: minDate, end: maxDate });

  // Function to get task position
  const getTaskPosition = (taskId: string) => {
    const taskElement = taskRefs.current[taskId];
    if (!taskElement) return null;

    const rect = taskElement.getBoundingClientRect();
    const parentRect = taskElement.parentElement?.parentElement?.getBoundingClientRect(); // Project div
    const scrollAreaRect = taskElement.closest('.h-\[600px\]')?.getBoundingClientRect(); // ScrollArea

    if (!parentRect || !scrollAreaRect) return null;

    // Calculate position relative to the chart's scrollable area
    const x = rect.left - scrollAreaRect.left;
    const y = rect.top - scrollAreaRect.top;

    return {
      x: x,
      y: y,
      width: rect.width,
      height: rect.height,
    };
  };

  useEffect(() => {
    // This effect will run after tasks are rendered, allowing us to get their positions
    // We can then draw dependencies here or trigger a re-render to draw them.
    // For now, just log to see if positions are available.
    // console.log("Task positions updated:", taskRefs.current);
  }, [projects]); // Re-run if projects change

  return (
    <Card>
      <CardHeader>
        <CardTitle>Project Gantt Chart</CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[600px] w-full">
          <div className="relative" style={{ width: chartWidth }}>
            {/* Timeline Header */}
            <div className="flex border-b border-gray-200">
              {days.map((day, index) => (
                <div
                  key={index}
                  className="flex-shrink-0 text-xs text-center border-r border-gray-200"
                  style={{ width: DAY_WIDTH }}
                >
                  {format(day, 'MMM d')}
                </div>
              ))}
            </div>

            {/* Projects and Tasks */}
            <div className="flex flex-col space-y-4 mt-4">
              {projects.map((project) => (
                <div key={project.id} className="relative border p-4 rounded-md mb-4">
                  <h3 className="font-semibold text-lg mb-2">{project.name}</h3>
                  <div className="relative" style={{ height: project.tasks.length * TASK_HEIGHT + 'px' }}>
                    {project.tasks.map((task, taskIndex) => {
                      const taskStartOffset = differenceInDays(task.startDate, minDate);
                      const taskDuration = differenceInDays(task.dueDate, task.startDate) + 1;
                      const taskLeft = taskStartOffset * DAY_WIDTH;
                      const taskWidth = taskDuration * DAY_WIDTH;
                      const taskTop = taskIndex * TASK_HEIGHT;

                      return (
                        <div
                          key={task.id}
                          ref={(el) => { taskRefs.current[task.id] = el; }} // Assign ref to task element
                          className="absolute bg-blue-500 text-white p-1 text-xs rounded-sm overflow-hidden whitespace-nowrap"
                          style={{ left: taskLeft, width: taskWidth, top: taskTop, height: TASK_HEIGHT }}
                        >
                          {task.title}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            {/* Dependency Lines SVG */}
            <svg className="absolute top-0 left-0 w-full h-full pointer-events-none">
              {projects.map(project =>
                project.tasks.map(task =>
                  task.dependencies?.map(depId => {
                    const dependentTaskPos = getTaskPosition(task.id);
                    const dependsOnTaskPos = getTaskPosition(depId);

                    if (!dependentTaskPos || !dependsOnTaskPos) return null;

                    // Draw line from dependsOnTask (right-middle) to dependentTask (left-middle)
                    const x1 = dependsOnTaskPos.x + dependsOnTaskPos.width;
                    const y1 = dependsOnTaskPos.y + dependsOnTaskPos.height / 2;
                    const x2 = dependentTaskPos.x;
                    const y2 = dependentTaskPos.y + dependentTaskPos.height / 2;

                    return (
                      <line
                        key={`${depId}-${task.id}`}
                        x1={x1}
                        y1={y1}
                        x2={x2}
                        y2={y2}
                        stroke="black"
                        strokeWidth="2"
                        markerEnd="url(#arrowhead)" // Add arrowhead
                      />
                    );
                  })
                )
              )}
              {/* Define arrowhead marker */}
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

