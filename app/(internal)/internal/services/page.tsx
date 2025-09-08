'use client'

import * as React from "react"
import { ColumnDef } from "@tanstack/react-table"
import { IconDots } from "@tabler/icons-react"
import { toast } from "sonner"
import { Currency } from "@/types/db-models"

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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { getServices, addService, updateService, deleteService, ServiceWithRelations } from "./actions"

const currencyOptions = Object.values(Currency).map(currency => ({ value: currency, label: currency }));

export default function ServicesPage() {
  const [data, setData] = React.useState<ServiceWithRelations[]>([])
  const [, startTransition] = React.useTransition()

  React.useEffect(() => {
    startTransition(() => {
      getServices().then(data => setData(data))
    })
  }, [])

  const columns: ColumnDef<ServiceWithRelations>[] = [
    {
      accessorKey: "name",
      header: "Name",
    },
    {
      accessorKey: "description",
      header: "Description",
      cell: ({ row }) => row.original.description || "-",
    },
    {
      accessorKey: "defaultPrice",
      header: "Default Price",
      cell: ({ row }) => {
        const amount = parseFloat(row.getValue("defaultPrice"))
        const formatted = new Intl.NumberFormat("id-ID", {
          style: "currency",
          currency: row.original.currency || "IDR",
        }).format(amount)
        return <div className="text-right font-medium">{formatted}</div>
      },
    },
    {
      accessorKey: "currency",
      header: "Currency",
    },
    {
      id: "actions",
      enableHiding: false,
      cell: ({ row }) => {
        const service = row.original
        return (
          <ServiceActions service={service} setData={setData} />
        )
      },
    },
  ]

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Services</h1>
        <ServiceFormDialog />
      </div>
      <DataTable columns={columns} data={data} filterColumn="name" />
    </div>
  )
}

interface ServiceFormDialogProps {
  service?: ServiceWithRelations;
  trigger?: React.ReactElement;
}

function ServiceFormDialog({ service, trigger }: ServiceFormDialogProps) {
  const [open, setOpen] = React.useState(false);
  const [isPending, startTransition] = React.useTransition();

  const [form, setForm] = React.useState({
    name: service?.name || "",
    description: service?.description || null,
    defaultPrice: service?.defaultPrice?.toString() || "",
    currency: service?.currency || Currency.IDR,
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    setForm({ ...form, [id]: value });
  };

  const handleSelectChange = (id: string, value: string) => {
    setForm({ ...form, [id]: value });
  };

  async function handleSubmit() {
    startTransition(async () => {
      try {
        const dataToSubmit = {
          ...form,
          defaultPrice: parseFloat(form.defaultPrice),
        };
        if (service) {
          await updateService(service.id, dataToSubmit);
          toast.success("Service updated");
        } else {
          await addService(dataToSubmit);
          toast.success("Service added");
        }
        setOpen(false);
      } catch (error: unknown) {
        toast.error(error instanceof Error ? error.message : "An unknown error occurred.");
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger ? (
        <DialogTrigger asChild>{trigger}</DialogTrigger>
      ) : (
        <DialogTrigger asChild>
          <Button>Add Service</Button>
        </DialogTrigger>
      )}
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{service ? "Edit Service" : "Add Service"}</DialogTitle>
          <DialogDescription>
            {service ? "Update the service details." : "Fill in the service details to add a new service."}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="name">Name</Label>
            <Input id="name" value={form.name} onChange={handleChange} placeholder="e.g. Website Development" />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" value={form.description || ""} onChange={handleChange} placeholder="e.g. Full-stack website development service." />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="defaultPrice">Default Price</Label>
              <Input id="defaultPrice" type="number" value={form.defaultPrice} onChange={handleChange} placeholder="e.g. 1000000" step="0.01" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="currency">Currency</Label>
              <Select value={form.currency} onValueChange={(value) => handleSelectChange("currency", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select currency" />
                </SelectTrigger>
                <SelectContent>
                  {currencyOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleSubmit} disabled={isPending}>
            {isPending ? "Saving..." : service ? "Update Service" : "Add Service"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface ServiceActionsProps {
  service: ServiceWithRelations;
  setData: React.Dispatch<React.SetStateAction<ServiceWithRelations[]>>;
}

function ServiceActions({ service, setData }: ServiceActionsProps) {
  const [, startTransition] = React.useTransition();

  const handleDelete = () => {
    startTransition(async () => {
      try {
        await deleteService(service.id);
        toast.success("Service deleted");
        setData((prev) => prev.filter((s) => s.id !== service.id));
      } catch (error: unknown) {
        toast.error(error instanceof Error ? error.message : "An unknown error occurred.");
      }
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
          <ServiceFormDialog service={service} trigger={<DropdownMenuItem onSelect={(e) => e.preventDefault()}>Edit</DropdownMenuItem>} />
          <AlertDialogTrigger asChild>
            <DropdownMenuItem className="text-red-600" onSelect={(e) => e.preventDefault()}>Delete</DropdownMenuItem>
          </AlertDialogTrigger>
        </DropdownMenuContent>
      </DropdownMenu>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete this service.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleDelete} className="bg-red-500 hover:bg-red-600">
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
