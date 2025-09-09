"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { TaskList, Task } from "@/components/tasks/TaskList";

interface ClientTaskViewProps {
  projectId: string;
}

export function ClientTaskView({ projectId }: ClientTaskViewProps) {
  const { data: session } = useSession();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<string>("dueDate");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [filter, setFilter] = useState<string>("");

  const userId = session?.user?.id;

  const fetchClientTasks = useCallback(async () => {
    if (!projectId) return;

    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      params.append("sortBy", sortBy);
      params.append("sortOrder", sortOrder);
      if (filter) {
        params.append("filter", filter);
      }

      const response = await fetch(
        `/api/projects/${projectId}/tasks?${params.toString()}`
      );
      if (!response.ok) {
        throw new Error("Could not fetch project tasks.");
      }
      const data = await response.json();
      setTasks(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "An unknown error occurred"
      );
    } finally {
      setIsLoading(false);
    }
  }, [projectId, sortBy, sortOrder, filter]);

  useEffect(() => {
    fetchClientTasks();
  }, [fetchClientTasks]);

  if (error) {
    return <p className="text-red-500">{error}</p>;
  }

  if (!userId) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Loading User Data...</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-10 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <TaskList
      projectId={projectId}
      tasks={tasks}
      isLoading={isLoading}
      onUpdate={fetchClientTasks}
      userId={userId}
      sortBy={sortBy}
      setSortBy={setSortBy}
      sortOrder={sortOrder}
      setSortOrder={setSortOrder}
      filter={filter}
      setFilter={setFilter}
    />
  );
}
