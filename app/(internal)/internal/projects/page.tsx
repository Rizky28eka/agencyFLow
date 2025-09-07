"use client"

import * as React from "react"
import { IconDots } from "@tabler/icons-react"
import { ColumnDef } from "@tanstack/react-table"
import { format } from "date-fns"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { DataTable } from "@/components/data-table"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { ProjectStatus } from "@prisma/client"
import {
  addProject,
  getProjects,
  updateProject,
  ProjectWithCalculatedFields,
} from "./actions"
import { getClientsForSelection } from "../clients/actions"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { ProjectActions } from "./project-actions" // Import ProjectActions
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

type ProjectWithClient = ProjectWithCalculatedFields; // Use the new type

const statuses = Object.values(ProjectStatus).map((status) => ({
  value: status,
  label: status.replace("_", " "),
}))

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

export function ProjectFormDialog({
  project,
  clients,
  trigger,
}: {
  project?: ProjectWithClient
  clients: { id: string; name: string }[]
  trigger?: React.ReactElement
}) {
  const [open, setOpen] = React.useState(false)
  const [isPending, startTransition] = React.useTransition()

  const [form, setForm] = React.useState({
    name: project?.name || "",
    description: project?.description || "",
    status: project?.status || ProjectStatus.PLANNING,
    clientId: project?.clientId || "",
    budget: project?.budget?.toString() || "", // Convert number back to string for input
    startDate: project?.startDate ? format(new Date(project.startDate), "yyyy-MM-dd") : "",
    endDate: project?.endDate ? format(new Date(project.endDate), "yyyy-MM-dd") : "",
  })

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { id, value } = e.target
    setForm({ ...form, [id]: value })
  }

  const handleSelectChange = (id: string, value: string) => {
    setForm({ ...form, [id]: value })
  }

  async function handleSubmit() {
    startTransition(async () => {
      const dataToSubmit = {
        ...form,
        startDate: form.startDate ? new Date(form.startDate) : null,
        endDate: form.endDate ? new Date(form.endDate) : null,
      }
      try {
        if (project) {
          await updateProject(project.id, dataToSubmit)
          toast.success("Project updated")
        } else {
          await addProject(dataToSubmit)
          toast.success("Project added")
        }
        setOpen(false)
      } catch (error: unknown) { // Changed from any to unknown
        toast.error(error instanceof Error ? error.message : "An unknown error occurred.")
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger ? (
        <DialogTrigger asChild>{trigger}</DialogTrigger>
      ) : (
        <DialogTrigger asChild>
          <Button>Add Project</Button>
        </DialogTrigger>
      )}
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{project ? "Edit Project" : "Add Project"}</DialogTitle>
          <DialogDescription>
            {project
              ? "Update the project details."
              : "Add a new project to your list."}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="name">Project Name</Label>
            <Input
              id="name"
              value={form.name}
              onChange={handleChange}
              placeholder="e.g. Website Redesign"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={form.description}
              onChange={handleChange}
              placeholder="e.g. Redesign the company website to improve user experience."
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="status">Status</Label>
            <Select
              value={form.status}
              onValueChange={(value) => handleSelectChange("status", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a status" />
              </SelectTrigger>
              <SelectContent>
                {statuses.map((s) => (
                  <SelectItem key={s.value} value={s.value}>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="clientId">Client</Label>
            <Select
              value={form.clientId}
              onValueChange={(value) => handleSelectChange("clientId", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a client" />
              </SelectTrigger>
              <SelectContent>
                {clients.map((client) => (
                  <SelectItem key={client.id} value={client.id}>
                    {client.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="budget">Budget</Label>
            <Input
              id="budget"
              type="number"
              value={form.budget}
              onChange={handleChange}
              placeholder="e.g. 5000.00"
              step="0.01"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="startDate">Start Date</Label>
              <Input
                id="startDate"
                type="date"
                value={form.startDate}
                onChange={handleChange}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="endDate">End Date</Label>
              <Input
                id="endDate"
                type="date"
                value={form.endDate}
                onChange={handleChange}
              />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleSubmit} disabled={isPending}>
            {isPending ? "Saving..." : project ? "Update Project" : "Add Project"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}