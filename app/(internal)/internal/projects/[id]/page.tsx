import { getProjectById } from "../actions";
import { getUsersByOrganization } from "@/app/(internal)/internal/users/actions";
import { notFound } from "next/navigation";
import { ProjectDetailView } from "./project-detail-view";
import { getTimeEntries } from "@/app/(internal)/internal/time-entries/actions";
import { getProjectFiles } from "@/app/(internal)/internal/files/actions";
import { getProjectActivities } from "@/app/(internal)/internal/activities/actions";

export default async function ProjectDetailPage({ params }: { params: { id: string } }) {
  const { id } = await params;

  const project = await getProjectById(id);
  const users = await getUsersByOrganization();
  const timeEntries = await getTimeEntries(id);
  const files = await getProjectFiles(id);
  const activities = await getProjectActivities(id);

  if (!project) {
    notFound();
  }

  // Convert Decimal properties to string for ProjectDetailView
  const processedProject = {
    ...project,
    budget: project.budget ? project.budget.toString() : null,
    expenses: project.expenses.map((expense) => ({
      ...expense,
      amount: expense.amount.toString(),
    })),
  };

    return <ProjectDetailView project={{ ...processedProject, files }} users={users} timeEntries={timeEntries} activities={activities} />;

}