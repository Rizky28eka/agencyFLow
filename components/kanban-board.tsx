'use client';

import React, { useState } from 'react';
import { DndContext, closestCorners, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { TaskStatus } from '@/types/task';
import { updateTask, TaskWithRelations } from '@/app/(internal)/internal/tasks/actions';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { IconGripVertical } from '@tabler/icons-react';

interface KanbanTaskProps {
  task: TaskWithRelations;
}

function KanbanTask({ task }: KanbanTaskProps) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} className="bg-white p-3 rounded-md shadow-sm mb-3 border border-gray-200 flex items-center justify-between">
      <div>
        <h4 className="font-medium text-sm">{task.title}</h4>
        {task.dueDate && (
          <p className="text-xs text-gray-500">Due: {new Date(task.dueDate).toLocaleDateString()}</p>
        )}
        {task.assignee && (
          <p className="text-xs text-gray-500">Assignee: {task.assignee.name}</p>
        )}
        {task.project && (
          <p className="text-xs text-gray-500">Project: {task.project.name}</p>
        )}
      </div>
      <button className="p-1 -mr-2 opacity-70 hover:opacity-100" {...listeners}>
        <IconGripVertical className="w-4 h-4 text-gray-400" />
      </button>
    </div>
  );
}

interface KanbanColumnProps {
  id: TaskStatus;
  title: string;
  tasks: TaskWithRelations[];
}

function KanbanColumn({ id, title, tasks }: KanbanColumnProps) {
  return (
    <Card className="w-80 flex-shrink-0">
      <CardHeader className="pb-4">
        <CardTitle className="text-base font-semibold flex items-center justify-between">
          {title}
          <Badge variant="secondary" className="ml-2">{tasks.length}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="min-h-[100px]">
        <SortableContext id={id} items={tasks.map(task => task.id)} strategy={verticalListSortingStrategy}>
          {tasks.map(task => (
            <KanbanTask key={task.id} task={task} />
          ))}
        </SortableContext>
      </CardContent>
    </Card>
  );
}

interface KanbanBoardProps {
  initialTasks: TaskWithRelations[];
}

export function KanbanBoard({ initialTasks }: KanbanBoardProps) {
  const [tasks, setTasks] = useState<TaskWithRelations[]>(initialTasks);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor)
  );

  const columns = Object.values(TaskStatus).map(status => ({
    id: status,
    title: status.replace(/_/g, ' '),
    tasks: tasks.filter(task => task.status === status),
  }));

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;

    if (!over) return;

    const activeTaskId = String(active.id);
    const newStatus = over.id as TaskStatus;

    const taskToMove = tasks.find(task => task.id === activeTaskId);

    if (taskToMove && taskToMove.status !== newStatus) {
      const originalStatus = taskToMove.status;

      // Optimistic update
      setTasks(prevTasks =>
        prevTasks.map(task =>
          task.id === activeTaskId ? { ...task, status: newStatus } : task
        )
      );

      try {
        await updateTask(activeTaskId, taskToMove.projectId, { status: newStatus });
        toast.success(`Task "${taskToMove.title}" moved to ${newStatus.replace(/_/g, ' ')}.`);
      } catch (error) {
        console.error('Failed to update task status:', error);
        toast.error('Failed to update task status.');
        // Revert optimistic update on error
        setTasks(prevTasks =>
          prevTasks.map(task =>
            task.id === activeTaskId ? { ...task, status: originalStatus } : task
          )
        );
      }
    }
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCorners} onDragEnd={handleDragEnd}>
      <div className="flex space-x-4 overflow-x-auto p-4">
        {columns.map(column => (
          <KanbanColumn key={column.id} id={column.id} title={column.title} tasks={column.tasks} />
        ))}
      </div>
    </DndContext>
  );
}
