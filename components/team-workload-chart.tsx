"use client";

import { TeamWorkloadData } from "@/app/(internal)/internal/resource-management/actions";
import { ScrollArea } from "@/components/ui/scroll-area";
import { eachDayOfInterval, format, differenceInDays, startOfMonth, endOfMonth, isWithinInterval, addDays } from "date-fns";
import React from "react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils"; // Import cn for conditional classnames

interface TeamWorkloadChartProps {
  data: TeamWorkloadData;
  month?: Date;
}

const DAY_WIDTH = 35;
const USER_ROW_HEIGHT = 50;
const DEFAULT_DAILY_CAPACITY = 8; // Default if user.dailyCapacityHours is null

export function TeamWorkloadChart({ data, month = new Date() }: TeamWorkloadChartProps) {
  const startDate = startOfMonth(month);
  const endDate = endOfMonth(month);

  const days = eachDayOfInterval({ start: startDate, end: endDate });
  const totalDays = days.length;
  const chartWidth = totalDays * DAY_WIDTH;

  // Pre-calculate daily allocated hours and capacity for each user
  const processedData = data.map(user => {
    const dailyAllocations: { [key: string]: number } = {}; // Date string -> allocated hours
    const dailyCapacity = user.dailyCapacityHours ? user.dailyCapacityHours.toNumber() : DEFAULT_DAILY_CAPACITY;

    days.forEach(day => {
      let allocatedHoursForDay = 0;
      user.assignedTasks.forEach(task => {
        const taskStart = task.startDate ? new Date(task.startDate) : startDate;
        const taskEnd = task.dueDate ? new Date(task.dueDate) : endDate;
        const estimatedHours = task.estimatedHours ? task.estimatedHours.toNumber() : 0;

        // Check if the task spans this specific day
        if (isWithinInterval(day, { start: taskStart, end: taskEnd })) {
          const taskDuration = differenceInDays(taskEnd, taskStart) + 1;
          // Distribute estimated hours evenly across task duration
          allocatedHoursForDay += estimatedHours / (taskDuration > 0 ? taskDuration : 1);
        }
      });
      dailyAllocations[format(day, 'yyyy-MM-dd')] = parseFloat(allocatedHoursForDay.toFixed(2)); // Round to 2 decimal places
    });

    return {
      ...user,
      dailyAllocations,
      dailyCapacity,
    };
  });

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

          {/* User Rows and Daily Workload Cells */}
          <div className="relative space-y-1">
            {processedData.map((user) => {
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

                  {/* Daily Workload Cells */}
                  <div className="absolute w-full flex" style={{ left: 0 }}>
                    {days.map((day, dayIndex) => {
                      const dateString = format(day, 'yyyy-MM-dd');
                      const allocated = user.dailyAllocations[dateString] || 0;
                      const capacity = user.dailyCapacity;
                      const remaining = capacity - allocated;

                      let bgColor = 'bg-gray-100'; // Default
                      let textColor = 'text-gray-800';
                      if (allocated > capacity) {
                        bgColor = 'bg-red-200';
                        textColor = 'text-red-800';
                      } else if (allocated > 0) {
                        bgColor = 'bg-green-200';
                        textColor = 'text-green-800';
                      }

                      return (
                        <Tooltip key={dayIndex}>
                          <TooltipTrigger asChild>
                            <div
                              className={cn(
                                "flex-shrink-0 flex items-center justify-center text-xs font-medium border-r border-gray-200 dark:border-gray-700",
                                bgColor, textColor
                              )}
                              style={{ width: DAY_WIDTH, height: USER_ROW_HEIGHT }}
                            >
                              {allocated > 0 ? allocated : '-'}
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="font-bold">{format(day, 'MMM d, yyyy')}</p>
                            <p>Allocated: {allocated} hours</p>
                            <p>Capacity: {capacity} hours</p>
                            <p>Remaining: {remaining.toFixed(2)} hours</p>
                            {allocated > capacity && <p className="text-red-500">Over-allocated!</p>}
                          </TooltipContent>
                        </Tooltip>
                      );
                    })}
                  </div>

                  {/* Task Bars (Overlayed for context) */}
                  <div className="absolute w-full" style={{ left: 0, top: (USER_ROW_HEIGHT - 20) / 2 }}>
                    {user.assignedTasks.map((task) => {
                      const taskStart = task.startDate ? new Date(task.startDate) : startDate;
                      const taskEnd = task.dueDate ? new Date(task.dueDate) : endDate;

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
                              className="absolute bg-blue-600 text-white p-1 text-xs rounded-md overflow-hidden whitespace-nowrap hover:bg-blue-700 cursor-pointer opacity-70"
                              style={{
                                left: taskLeft,
                                width: taskWidth,
                                height: 20,
                              }}
                            >
                              {task.title} ({task.estimatedHours?.toNumber() || 0}h)
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="font-bold">{task.title}</p>
                            <p>Project: {task.project.name}</p>
                            <p>Estimated: {task.estimatedHours?.toNumber() || 0} hours</p>
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
