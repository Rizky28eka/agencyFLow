'use client'

import { getQuotationById, updateQuotationStatus, deleteQuotation, Quotation } from "../actions";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { toast } from "sonner";
import { useRouter, useParams } from "next/navigation";
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
import { useEffect, useState } from "react";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default function QuotationDetailsPage() {
    const params = useParams();
    const router = useRouter();
    const [quotation, setQuotation] = useState<Quotation | null>(null); 
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchQuotation = async () => {
            try {
                if (typeof params.id === 'string') {
                    const fetchedQuotation = await getQuotationById(params.id);
                    setQuotation(fetchedQuotation);
                }
            } catch (error) {
                toast.error("Failed to load quotation.");
                console.error("Fetch quotation error:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchQuotation();
    }, [params.id]);

    const handleDelete = async () => {
        try {
            await deleteQuotation(quotation!.id);
            toast.success("Quotation deleted successfully.");
            router.push("/internal/quotations");
        } catch (error) {
            toast.error("Failed to delete quotation.");
            console.error("Delete quotation error:", error);
        }
    };

    const handleConvert = async () => {
        try {
            await updateQuotationStatus(quotation!.id, "APPROVED"); // This will trigger project creation
            toast.success("Quotation converted to project successfully.");
            router.refresh(); // Refresh the page to show updated status and project link
        } catch (error) {
            toast.error("Failed to convert quotation to project.");
            console.error("Convert quotation error:", error);
        }
    };

    if (loading) {
        return <div className="container mx-auto py-10 text-center">Loading quotation...</div>;
    }

    if (!quotation) {
        return <div className="container mx-auto py-10 text-center">Quotation not found.</div>;
    }

    let statusVariant: "default" | "secondary" | "destructive" | "outline" = "default";
    switch (quotation.status) {
        case "APPROVED":
            statusVariant = "default";
            break;
        case "SENT":
            statusVariant = "secondary";
            break;
        case "VIEWED":
            statusVariant = "outline";
            break;
        case "REJECTED":
            statusVariant = "destructive";
            break;
        case "DRAFT":
        default:
            statusVariant = "secondary";
            break;
    }

    return (
        <main className="flex-1 space-y-4 p-8 md:p-10">
            <div className="flex items-center justify-between space-y-2">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Quotation #{quotation.quotationNumber}</h2>
                    <p className="text-muted-foreground">View details and manage the quotation.</p>
                </div>
                <div className="space-x-2">
                    {quotation.status === "APPROVED" && !quotation.projectId && (
                        <Button onClick={handleConvert}>Convert to Project</Button>
                    )}
                    <Button asChild variant="outline">
                        <Link href={`/internal/quotations/${quotation.id}/edit`}>Edit</Link>
                    </Button>
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button variant="destructive">Delete</Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    This action cannot be undone. This will permanently delete this
                                    quotation and remove its data from our servers.                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={handleDelete}>Continue</AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle>Client Information</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Client Name</span>
                            <span>{quotation.client.name}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Client Email</span>
                            <span>{quotation.client.email}</span>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>Quotation Details</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex justify-between items-center">
                            <span className="text-muted-foreground">Status</span>
                            <Badge variant={statusVariant}>{quotation.status}</Badge>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Issue Date</span>
                            <span>{format(new Date(quotation.issueDate), "PPP")}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Expiry Date</span>
                            <span>{quotation.expiryDate ? format(new Date(quotation.expiryDate), "PPP") : "N/A"}</span>
                        </div>
                        {quotation.projectId && (
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Linked Project</span>
                                <Link href={`/internal/projects/${quotation.projectId}`} className="text-blue-600 hover:underline">
                                    View Project
                                </Link>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Quotation Items</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[50%]">Description</TableHead>
                                <TableHead className="text-right">Quantity</TableHead>
                                <TableHead className="text-right">Unit Price</TableHead>
                                <TableHead className="text-right">Discount</TableHead>
                                <TableHead className="text-right">Tax</TableHead>
                                <TableHead className="text-right">Line Total</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {quotation.items.map((item: Quotation['items'][number]) => (
                                <TableRow key={item.id}>
                                    <TableCell className="font-medium">{item.description}</TableCell>
                                    <TableCell className="text-right">{item.quantity}</TableCell>
                                    <TableCell className="text-right">
                                        {new Intl.NumberFormat("en-US", {
                                            style: "currency",
                                            currency: item.currency,
                                        }).format(parseFloat(item.unitPrice.toString()))}
                                    </TableCell>
                                    <TableCell className="text-right">{item.discountPct ? `${item.discountPct}%` : '-'}</TableCell>
                                    <TableCell className="text-right">{item.taxPct ? `${item.taxPct}%` : '-'}</TableCell>
                                    <TableCell className="text-right">
                                        {new Intl.NumberFormat("en-US", {
                                            style: "currency",
                                            currency: item.currency,
                                        }).format(parseFloat(item.lineTotal.toString()))}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                    <Separator className="my-4" />
                    <div className="grid gap-2 text-right">
                        <div className="flex justify-end items-center space-x-4">
                            <span className="text-muted-foreground">Subtotal</span>
                            <span className="font-medium">
                                {new Intl.NumberFormat("en-US", {
                                    style: "currency",
                                    currency: quotation.currency,
                                }).format(parseFloat(quotation.subtotal.toString()))}
                            </span>
                        </div>
                        <div className="flex justify-end items-center space-x-4">
                            <span className="text-muted-foreground">Discount</span>
                            <span className="font-medium">
                                - {new Intl.NumberFormat("en-US", {
                                    style: "currency",
                                    currency: quotation.currency,
                                }).format(parseFloat(quotation.discount.toString()))}
                            </span>
                        </div>
                        <div className="flex justify-end items-center space-x-4">
                            <span className="text-muted-foreground">Tax</span>
                            <span className="font-medium">
                                + {new Intl.NumberFormat("en-US", {
                                    style: "currency",
                                    currency: quotation.currency,
                                }).format(parseFloat(quotation.tax.toString()))}
                            </span>
                        </div>
                        <div className="flex justify-end items-center space-x-4 text-lg font-bold">
                            <span>Total</span>
                            <span>
                                {new Intl.NumberFormat("en-US", {
                                    style: "currency",
                                    currency: quotation.currency,
                                }).format(parseFloat(quotation.totalAmount.toString()))}
                            </span>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </main>
    );
}
