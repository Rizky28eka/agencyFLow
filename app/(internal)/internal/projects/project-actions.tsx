'use client'

import * as React from "react"
import { IconDots, IconEdit, IconTrash } from "@tabler/icons-react"
import { toast } from "sonner"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { deleteProject, ProjectWithCalculatedFields } from "./actions"
import { ProjectFormDialog } from "./page"; // Import ProjectFormDialog

export function ProjectActions({
  project,
  clients,
}: {
  project: ProjectWithCalculatedFields;
  clients: { id: string; name: string }[];
}) {
  const [, startTransition] = React.useTransition();

  const handleDelete = () => {
    startTransition(() => {
      deleteProject(project.id)
        .then(() => {
          toast.success("Project deleted");
          // Optionally revalidate path or update state
        })
        .catch((error: unknown) => {
          toast.error(error instanceof Error ? error.message : "An unknown error occurred.");
        });
    });
  };

  return (
    <AlertDialog>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0">
            <span className="sr-only">Open menu</span>
            <IconDots className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <ProjectFormDialog
            project={project}
            clients={clients}
            trigger={
              <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                <IconEdit className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
            }
          />
          <AlertDialogTrigger asChild>
            <DropdownMenuItem className="text-red-500">
              <IconTrash className="mr-2 h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </AlertDialogTrigger>
        </DropdownMenuContent>
      </DropdownMenu>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete this
            project.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            className="bg-red-500 hover:bg-red-600"
          >
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
