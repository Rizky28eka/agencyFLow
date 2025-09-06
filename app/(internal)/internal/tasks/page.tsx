import { getTasks } from "./actions";
import { KanbanBoard } from "@/components/kanban-board";

export default async function TasksPage() {
  const tasks = await getTasks();

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-6">All Tasks</h1>
      <KanbanBoard initialTasks={tasks} />
    </div>
  );
}
