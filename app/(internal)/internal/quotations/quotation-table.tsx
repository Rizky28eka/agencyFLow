'use client'

import { DataTable } from "@/components/data-table";
import { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { ArrowUpDown } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal } from "lucide-react";
import { QuotationStatus } from "@prisma/client";
import { toast } from "sonner";
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
} from "@/components/ui/alert-dialog";

import { Quotation, updateQuotationStatus, deleteQuotation } from "./actions";

const columns: ColumnDef<Quotation>[] = [
    {
        accessorKey: "quotationNumber",
        header: ({ column }) => {
            return (
                <Button
                    variant="ghost"
                    onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                >
                    Quotation #
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            );
        },
        cell: ({ row }) => {
            const quotation = row.original;
            return (
                <Link href={`/internal/quotations/${quotation.id}`} className="text-blue-600 hover:underline">
                    {quotation.quotationNumber}
                </Link>
            );
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
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            );
        },
        cell: ({ row }) => row.original.client.name,
    },
    {
        accessorKey: "issueDate",
        header: ({ column }) => {
            return (
                <Button
                    variant="ghost"
                    onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                >
                    Issue Date
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            );
        },
        cell: ({ row }) => format(new Date(row.getValue("issueDate")), "PPP"),
    },
    {
        accessorKey: "expiryDate",
        header: ({ column }) => {
            return (
                <Button
                    variant="ghost"
                    onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                >+
                    Expiry Date
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            );
        },
        cell: ({ row }) => row.getValue("expiryDate") ? format(new Date(row.getValue("expiryDate")), "PPP") : "N/A",
    },
    {
        accessorKey: "totalAmount",
        header: ({ column }) => {
            return (
                <Button
                    variant="ghost"
                    onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                >
                    Total Amount
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            );
        },
        cell: ({ row }) => {
            const amount = parseFloat(row.getValue("totalAmount"));
            const formatted = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: row.original.currency || "IDR",
            }).format(amount);
            return <div className="text-right font-medium">{formatted}</div>;
        },
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
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            );
        },
        cell: ({ row }) => {
            const status: QuotationStatus = row.getValue("status");
            let variant: "default" | "secondary" | "destructive" | "outline" = "default";
            switch (status) {
                case "APPROVED":
                    variant = "default";
                    break;
                case "SENT":
                    variant = "secondary";
                    break;
                case "VIEWED":
                    variant = "outline";
                    break;
                case "REJECTED":
                    variant = "destructive";
                    break;
                case "DRAFT":
                default:
                    variant = "secondary";
                    break;
            }
            return <Badge variant={variant}>{status}</Badge>;
        },
    },
    {
        id: "actions",
        enableHiding: false,
        cell: ({ row }) => {
            const quotation = row.original;

            const handleDelete = async () => {
                try {
                    await deleteQuotation(quotation.id);
                    toast.success("Quotation deleted successfully.");
                } catch (error) {
                    toast.error("Failed to delete quotation.");
                    console.error("Delete quotation error:", error);
                }
            };

            const handleConvert = async () => {
                try {
                    await updateQuotationStatus(quotation.id, "APPROVED"); // This will trigger project creation
                    toast.success("Quotation converted to project successfully.");
                } catch (error) {
                    toast.error("Failed to convert quotation to project.");
                    console.error("Convert quotation error:", error);
                }
            };

            return (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem asChild>
                            <Link href={`/internal/quotations/${quotation.id}`}>View Details</Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                            <Link href={`/internal/quotations/${quotation.id}/edit`}>Edit</Link>
                        </DropdownMenuItem>
                        {quotation.status === "APPROVED" && !quotation.projectId && (
                            <DropdownMenuItem onClick={handleConvert}>
                                Convert to Project
                            </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                    Delete
                                </DropdownMenuItem>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        This action cannot be undone. This will permanently delete your
                                        quotation and remove its data from our servers.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={handleDelete}>Continue</AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </DropdownMenuContent>
                </DropdownMenu>
            );
        },
    },
];

export function QuotationTable({ quotations }: { quotations: Quotation[] }) {
    return (
        <DataTable columns={columns} data={quotations} filterColumn="quotationNumber" />
    );
}
