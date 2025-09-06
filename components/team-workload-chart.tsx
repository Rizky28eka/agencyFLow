"use client";

import { TeamWorkloadData } from "@/app/(internal)/internal/resource-management/actions";
import { ScrollArea } from "@/components/ui/scroll-area";
import { eachDayOfInterval, format, differenceInDays, startOfMonth, endOfMonth } from "date-fns";
import React from "react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface TeamWorkloadChartProps {
  data: TeamWorkloadData;
  month?: Date;
}

const DAY_WIDTH = 35;
const USER_ROW_HEIGHT = 50;
const TASK_HEIGHT = 28;

export function TeamWorkloadChart({ data, month = new Date() }: TeamWorkloadChartProps) {
  const startDate = startOfMonth(month);
  const endDate = endOfMonth(month);

  const days = eachDayOfInterval({ start: startDate, end: endDate });
  const totalDays = days.length;
  const chartWidth = totalDays * DAY_WIDTH;

  return (
    <TooltipProvider>
      <ScrollArea className="h-[650px] w-full border rounded-md p-2">
        <div className="relative" style={{ width: chartWidth }}>
          {/* Timeline Header */}
          <div className="sticky top-0 z-10 flex bg-white dark:bg-gray-900 border-b pb-2 mb-2">
            {days.map((day, index) => (
              <div
                key={index}
                className="flex-shrink-0 text-center"
                style={{ width: DAY_WIDTH }}
              >
                <div className="text-xs text-gray-500">{format(day, "E")}</div>
                <div className="text-sm font-semibold">{format(day, "d")}</div>
              </div>
            ))}
          </div>

          {/* Grid Lines */}
          <div className="absolute top-0 left-0 w-full h-full -z-10">
            {days.map((_day, index) => (
              <div
                key={index}
                className="absolute h-full border-r border-gray-100 dark:border-gray-800"
                style={{ left: index * DAY_WIDTH, width: DAY_WIDTH }}
              ></div>
            ))}
          </div>

          {/* User Rows and Tasks */}
          <div className="relative space-y-1">
            {data.map((user, userIndex) => {
              const userRowTop = userIndex * USER_ROW_HEIGHT;

              return (
                <div
                  key={user.id}
                  className="relative flex items-center"
                  style={{ height: USER_ROW_HEIGHT }}
                >
                  {/* User Label (Sticky) */}
                  <div className="sticky left-0 z-10 w-32 pr-4 font-semibold text-sm bg-white dark:bg-gray-900 truncate">
                    {user.name || user.email}
                  </div>

                  {/* Task Bars */}
                  <div className="absolute w-full" style={{ left: 0, top: (USER_ROW_HEIGHT - TASK_HEIGHT) / 2 }}>
                    {user.assignedTasks.map((task) => {
                      const taskStart = new Date(task.startDate!);
                      const taskEnd = new Date(task.dueDate!);

                      // Clamp tasks to the visible month range
                      const effectiveStartDate = taskStart < startDate ? startDate : taskStart;
                      const effectiveEndDate = taskEnd > endDate ? endDate : taskEnd;

                      const startOffset = differenceInDays(effectiveStartDate, startDate);
                      const duration = differenceInDays(effectiveEndDate, effectiveStartDate) + 1;

                      if (duration <= 0) return null; // Don't render tasks outside the view

                      const taskLeft = startOffset * DAY_WIDTH;
                      const taskWidth = duration * DAY_WIDTH - 4; // a little padding

                      return (
                        <Tooltip key={task.id}>
                          <TooltipTrigger asChild>
                            <div
                              className="absolute bg-blue-600 text-white p-1 text-xs rounded-md overflow-hidden whitespace-nowrap hover:bg-blue-700 cursor-pointer"
                              style={{
                                left: taskLeft,
                                width: taskWidth,
                                height: TASK_HEIGHT,
                              }}
                            >
                              {task.title}
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="font-bold">{task.title}</p>
                            <p>Project: {task.project.name}</p>
                            <p>Duration: {format(taskStart, 'MMM d')} - {format(taskEnd, 'MMM d')}</p>
                          </TooltipContent>
                        </Tooltip>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </ScrollArea>
    </TooltipProvider>
  );
}
