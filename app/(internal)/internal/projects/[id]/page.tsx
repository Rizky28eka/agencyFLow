import { getProjectById } from "../actions";
import { getUsersByOrganization } from "@/app/(internal)/internal/users/actions";
import { notFound } from "next/navigation";
import { ProjectDetailView } from "./project-detail-view";
import { getTimeEntries } from "@/app/(internal)/internal/time-entries/actions";
import { getProjectFiles } from "@/app/(internal)/internal/files/actions";
import { getProjectActivities } from "@/app/(internal)/internal/activities/actions";

export default async function ProjectDetailPage({ params }: { params: { id: string } }) {
  const { id } = params;

  const project = await getProjectById(id);
  const users = await getUsersByOrganization();
  const timeEntries = await getTimeEntries(id);
  const files = await getProjectFiles(id);
  const activities = await getProjectActivities(id);

  if (!project) {
    notFound();
  }

  // Convert string properties back to numbers for ProjectDetailView
  const processedProject = {
    ...project,
    budget: Number(project.budget),
    totalExpenses: Number(project.totalExpenses),
    profitability: Number(project.profitability),
  };

    return <ProjectDetailView project={{ ...processedProject, files }} users={users} timeEntries={timeEntries} activities={activities} />;

}