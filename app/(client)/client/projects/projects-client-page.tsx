'use client';

import { Project } from '@prisma/client';
import { DataTable } from '@/components/data-table';
import { ColumnDef } from '@tanstack/react-table';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

interface ProjectsClientPageProps {
  projects: Project[];
}

const columns: ColumnDef<Project>[] = [
  {
    accessorKey: 'name',
    header: 'Project Name',
  },
  {
    accessorKey: 'status',
    header: 'Status',
  },
  {
    accessorKey: 'startDate',
    header: 'Start Date',
    cell: ({ row }) => {
      const date = row.getValue('startDate');
      return date ? new Date(date as string).toLocaleDateString() : 'N/A';
    },
  },
  {
    accessorKey: 'endDate',
    header: 'Due Date',
    cell: ({ row }) => {
      const date = row.getValue('endDate');
      return date ? new Date(date as string).toLocaleDateString() : 'N/A';
    },
  },
  {
    id: 'actions',
    cell: ({ row }) => {
      const project = row.original;
      return (
        <Button asChild variant="outline" size="sm">
          <Link href={`/client/projects/${project.id}`}>View</Link>
        </Button>
      );
    },
  },
];

export default function ProjectsClientPage({ projects }: ProjectsClientPageProps) {
  return (
    <div className="p-4 md:p-6 lg:p-8">
      <h1 className="text-2xl md:text-3xl font-bold mb-6">My Projects</h1>
      <DataTable columns={columns} data={projects} filterColumn="name" />
    </div>
  );
}
