import { getProjectById, getUsers } from "../actions";
import { notFound } from "next/navigation";
import { ProjectDetailView } from "./project-detail-view";

export default async function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const project = await getProjectById(id);
  const users = await getUsers();

  if (!project) {
    notFound();
  }

  return <ProjectDetailView project={project} users={users} />;
}
