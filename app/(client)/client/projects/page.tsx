import { getClientProjects } from "@/app/actions/client-data";
import ProjectsClientPage from "./projects-client-page";

export default async function ClientProjectsPage() {
  const projects = await getClientProjects();

  return <ProjectsClientPage projects={projects} />;
}
