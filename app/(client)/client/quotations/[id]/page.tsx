import { getClientQuotationById, updateClientQuotationStatus } from "../actions";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default async function ClientQuotationDetailsPage({ params }: { params: { id: string } }) {
    const quotation = await getClientQuotationById(params.id);

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
        <main className="flex-1 space-y-4 p-8 md:p-10">
            <div className="flex items-center justify-between space-y-2">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Quotation #{quotation.quotationNumber}</h2>
                    <p className="text-muted-foreground">View details and manage your quotation.</p>
                </div>
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
                                    <AlertDialogAction onClick={async () => {
                                        try {
                                            await updateClientQuotationStatus(quotation.id, "APPROVED");
                                            toast.success(`Quotation APPROVED successfully.`);
                                        } catch (error) {
                                            toast.error(`Failed to APPROVE quotation.`);
                                            console.error(`Update quotation status error (APPROVED):`, error);
                                        }
                                    }}>Approve</AlertDialogAction>
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
                                    <AlertDialogAction onClick={async () => {
                                        try {
                                            await updateClientQuotationStatus(quotation.id, "REJECTED");
                                            toast.success(`Quotation REJECTED successfully.`);
                                        } catch (error) {
                                            toast.error(`Failed to REJECT quotation.`);
                                            console.error(`Update quotation status error (REJECTED):`, error);
                                        }
                                    }}>Reject</AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </div>
                )}
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
                                <TableHead className="w-[60%]">Description</TableHead>
                                <TableHead className="text-right">Quantity</TableHead>
                                <TableHead className="text-right">Unit Price</TableHead>
                                <TableHead className="text-right">Line Total</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {quotation.items.map((item) => (
                                <TableRow key={item.id}>
                                    <TableCell className="font-medium">{item.description}</TableCell>
                                    <TableCell className="text-right">{item.quantity}</TableCell>
                                    <TableCell className="text-right">
                                        {new Intl.NumberFormat("id-ID", {
                                            style: "currency",
                                            currency: "IDR",
                                        }).format(parseFloat(item.unitPrice.toString()))}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        {new Intl.NumberFormat("id-ID", {
                                            style: "currency",
                                            currency: "IDR",
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
                                {new Intl.NumberFormat("id-ID", {
                                    style: "currency",
                                    currency: "IDR",
                                }).format(parseFloat(quotation.subtotal.toString()))}
                            </span>
                        </div>
                        <div className="flex justify-end items-center space-x-4">
                            <span className="text-muted-foreground">Discount</span>
                            <span className="font-medium">
                                - {new Intl.NumberFormat("id-ID", {
                                    style: "currency",
                                    currency: "IDR",
                                }).format(parseFloat(quotation.discount.toString()))}
                            </span>
                        </div>
                        <div className="flex justify-end items-center space-x-4">
                            <span className="text-muted-foreground">Tax</span>
                            <span className="font-medium">
                                + {new Intl.NumberFormat("id-ID", {
                                    style: "currency",
                                    currency: "IDR",
                                }).format(parseFloat(quotation.tax.toString()))}
                            </span>
                        </div>
                        <div className="flex justify-end items-center space-x-4 text-lg font-bold">
                            <span>Total</span>
                            <span>
                                {new Intl.NumberFormat("id-ID", {
                                    style: "currency",
                                    currency: "IDR",
                                }).format(parseFloat(quotation.totalAmount.toString()))}
                            </span>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </main>
    );
}
