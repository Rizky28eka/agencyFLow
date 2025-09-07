"use client"

import * as React from "react"
import { IconDots } from "@tabler/icons-react"
import { ColumnDef } from "@tanstack/react-table"


import { Button } from "@/components/ui/button"
import { DataTable } from "@/components/data-table"

import { ProjectStatus } from "@prisma/client"
import {
  getProjects,
  ProjectWithCalculatedFields,
} from "./actions"
import { getClientsForSelection } from "../clients/actions"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { ProjectActions } from "./project-actions" // Import ProjectActions
import { ProjectFormDialog } from "@/components/project-form-dialog";


type ProjectWithClient = ProjectWithCalculatedFields; // Use the new type



const columns: ColumnDef<ProjectWithClient>[] = [
  { 
    accessorKey: "name",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Project Name
          <IconDots className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => {
      const project = row.original
      return (
        <Link
          href={`/internal/projects/${project.id}`}
          className="text-blue-600 hover:underline"
        >
          {project.name}
        </Link>
      )
    },
  },
  {
    accessorKey: "client.name",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Client
          <IconDots className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => row.original.client.name,
  },
  {
    accessorKey: "status",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Status
          <IconDots className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => {
      const status: ProjectStatus = row.getValue("status")
      let variant: "default" | "secondary" | "destructive" | "outline" = "default"
      switch (status) {
        case "ON_GOING":
          variant = "default"
          break
        case "COMPLETED":
          variant = "secondary"
          break
        case "ON_HOLD":
          variant = "outline"
          break
        case "CANCELLED":
          variant = "destructive"
          break
        case "PLANNING":
        default:
          variant = "secondary"
          break
      }
      return <Badge variant={variant}>{status}</Badge>
    },
  },
  {
    accessorKey: "budget",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Budget
          <IconDots className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => {
      const amount = parseFloat(row.getValue("budget"))
      const formatted = new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: row.original.budgetCurrency || "IDR", // Use budgetCurrency
      }).format(amount)
      return <div className="text-right font-medium">{formatted}</div>
    },
  },
  {
    accessorKey: "totalExpenses",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Total Expenses
          <IconDots className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => {
      const amount = parseFloat(row.getValue("totalExpenses"))
      const formatted = new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: row.original.budgetCurrency || "IDR", // Use budgetCurrency
      }).format(amount)
      return <div className="text-right font-medium">{formatted}</div>
    },
  },
  {
    accessorKey: "profitability",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Profitability
          <IconDots className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => {
      const amount = parseFloat(row.getValue("profitability"))
      const formatted = new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: row.original.budgetCurrency || "IDR", // Use budgetCurrency
      }).format(amount)
      return <div className="text-right font-medium">{formatted}</div>
    },
  },
  {
    id: "actions",
    enableHiding: false,
    cell: ({ row }) => {
      const project = row.original;
      // Clients are now passed from the parent component
      return <ProjectActions project={project} clients={[]} />; // Pass clients from parent
    },
  },
]

export default function ProjectsPage() {
  const [data, setData] = React.useState<ProjectWithClient[]>([])
  const [clients, setClients] = React.useState<{ id: string; name: string }[]>([]
  )
  const [, startTransition] = React.useTransition()

  React.useEffect(() => {
    startTransition(() => {
      getProjects().then((data) => setData(data))
      getClientsForSelection().then(setClients)
    })
  }, [])

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Projects</h1>
        <ProjectFormDialog clients={clients} />
      </div>
      <DataTable columns={columns} data={data} filterColumn="name" />
    </div>
  )
}

