import { getProjectById } from "../actions";
import { getUsersForProjectView } from "../../users/actions";
import { getTimeEntries } from "../../time-entries/actions";
import { getProjectActivities } from "../../activities/actions";
import { getProjectFiles } from "@/app/actions/files";
import { ProjectDetailView } from "./project-detail-view";
import type { ProjectDetailProps, UserListProps, TimeEntryWithRelations, ActivityWithUser } from "./project-detail-view";
import { notFound } from "next/navigation";

export default async function Page({ params }: { params: { id: string } }) {
  const { id } = params;

  // Parallel data fetching
  const [project, users, timeEntries, activities, files] = await Promise.all([
    getProjectById(id),
    getUsersForProjectView(),
    getTimeEntries(id),
    getProjectActivities(id),
    getProjectFiles(id),
  ]);

  if (!project) {
    notFound();
  }

  // Add files to the project object
  const projectWithFiles = {
    ...project,
    files: files,
  };

  return (
    <ProjectDetailView
      project={projectWithFiles as ProjectDetailProps}
      users={users as UserListProps}
      timeEntries={timeEntries as TimeEntryWithRelations[]}
      activities={activities as ActivityWithUser[]}
    />
  );
}