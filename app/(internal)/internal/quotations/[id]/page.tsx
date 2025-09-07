'use client'

import { getQuotationById, updateQuotationStatus, deleteQuotation, Quotation } from "../actions";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
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

export default function QuotationDetailsPage({ params }: { params: { id: string } }) {
    const router = useRouter();
    const [quotation, setQuotation] = useState<Quotation | null>(null); 
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchQuotation = async () => {
            try {
                const fetchedQuotation = await getQuotationById(params.id);
                setQuotation(fetchedQuotation);
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
        <div className="container mx-auto py-10">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold">Quotation #{quotation.quotationNumber}</h1>
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

            <Card className="mb-6">
                <CardHeader>
                    <CardTitle>Details</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <p className="text-sm text-gray-500">Client</p>
                        <p className="text-lg font-medium">{quotation.client.name}</p>
                    </div>
                    <div>
                        <p className="text-sm text-gray-500">Status</p>
                        <Badge variant={statusVariant}>{quotation.status}</Badge>
                    </div>
                    <div>
                        <p className="text-sm text-gray-500">Issue Date</p>
                        <p className="text-lg font-medium">{format(new Date(quotation.issueDate), "PPP")}</p>
                    </div>
                    <div>
                        <p className="text-sm text-gray-500">Expiry Date</p>
                        <p className="text-lg font-medium">{quotation.expiryDate ? format(new Date(quotation.expiryDate), "PPP") : "N/A"}</p>
                    </div>
                    <div>
                        <p className="text-sm text-gray-500">Total Amount</p>
                        <p className="text-lg font-medium">
                            {new Intl.NumberFormat("en-US", {
                                style: "currency",
                                currency: quotation.currency,
                            }).format(parseFloat(quotation.totalAmount.toString()))}
                        </p>
                    </div>
                    {quotation.projectId && (
                        <div>
                            <p className="text-sm text-gray-500">Linked Project</p>
                            <Link href={`/internal/projects/${quotation.projectId}`} className="text-blue-600 hover:underline">
                                View Project
                            </Link>
                        </div>
                    )}
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Items</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {quotation.items.map((item: Quotation['items'][number]) => (
                            <div key={item.id} className="border p-4 rounded-md">
                                <p className="font-medium">{item.description}</p>
                                <p className="text-sm text-gray-600">
                                    {item.quantity} x{" "}
                                    {new Intl.NumberFormat("en-US", {
                                        style: "currency",
                                        currency: item.currency,
                                    }).format(parseFloat(item.unitPrice.toString()))}
                                    {item.discountPct ? ` (-${item.discountPct}%)` : ""}
                                    {item.taxPct ? ` (+${item.taxPct}%)` : ""}
                                </p>
                                <p className="text-right font-semibold">
                                    {new Intl.NumberFormat("en-US", {
                                        style: "currency",
                                        currency: item.currency,
                                    }).format(parseFloat(item.lineTotal.toString()))}
                                </p>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
