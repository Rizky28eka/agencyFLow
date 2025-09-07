'use client'

import { getClientQuotationById, updateClientQuotationStatus, Quotation } from "../actions";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { QuotationStatus } from "@prisma/client";
import { useEffect, useState } from "react";

export default function ClientQuotationDetailsPage({ params }: { params: { id: string } }) {
    const router = useRouter();
    const [quotation, setQuotation] = useState<Quotation | null>(null); 
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchQuotation = async () => {
            try {
                const fetchedQuotation = await getClientQuotationById(params.id);
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

    const handleStatusUpdate = async (status: QuotationStatus) => {
        try {
            await updateClientQuotationStatus(quotation!.id, status);
            toast.success(`Quotation ${status.toLowerCase()} successfully.`);
            router.refresh(); // Refresh the page to show updated status
        } catch (error) {
            toast.error(`Failed to ${status.toLowerCase()} quotation.`);
            console.error(`Update quotation status error (${status}):`, error);
        }
    };

    if (loading) {
        return <div className="container mx-auto py-10 text-center">Loading quotation...</div>;
    }

    if (!quotation) {
        return <div className="container mx-auto py-10 text-center">Quotation not found or you do not have permission to view it.</div>;
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

    const isActionable = quotation.status === "SENT" || quotation.status === "VIEWED";

    return (
        <div className="container mx-auto py-10">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold">Quotation #{quotation.quotationNumber}</h1>
                {isActionable && (
                    <div className="space-x-2">
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button variant="default">Approve</Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Approve Quotation?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        Are you sure you want to approve this quotation? This action cannot be undone.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => handleStatusUpdate("APPROVED")}>Approve</AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button variant="destructive">Reject</Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Reject Quotation?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        Are you sure you want to reject this quotation? This action cannot be undone.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => handleStatusUpdate("REJECTED")}>Reject</AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </div>
                )}
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
                            {new Intl.NumberFormat("id-ID", {
                                style: "currency",
                                currency: "IDR",
                            }).format(parseFloat(quotation.totalAmount.toString()))}
                        </p>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Items</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {quotation.items.map((item) => (
                            <div key={item.id} className="border p-4 rounded-md">
                                <p className="font-medium">{item.description}</p>
                                <p className="text-sm text-gray-600">
                                    {item.quantity} x{" "}
                                    {new Intl.NumberFormat("id-ID", {
                                        style: "currency",
                                        currency: "IDR",
                                    }).format(parseFloat(item.unitPrice.toString()))}
                                    {item.discountPct ? ` (-${item.discountPct}%)` : ""}
                                    {item.taxPct ? ` (+${item.taxPct}%)` : ""}
                                </p>
                                <p className="text-right font-semibold">
                                    {new Intl.NumberFormat("id-ID", {
                                        style: "currency",
                                        currency: "IDR",
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