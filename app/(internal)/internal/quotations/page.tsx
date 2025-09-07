import { getQuotations } from "./actions";
import { QuotationTable } from "./quotation-table"; // Import the new component
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default async function QuotationsPage() {
    const quotations = await getQuotations();

    return (
        <main className="flex-1 space-y-4 p-8 md:p-10">
            <div className="flex items-center justify-between space-y-2">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Quotations</h2>
                    <p className="text-muted-foreground">Manage all quotations for your agency.</p>
                </div>
                <div className="flex items-center space-x-2">
                    <Button asChild>
                        <Link href="/internal/quotations/new">Create New Quotation</Link>
                    </Button>
                </div>
            </div>
            <Card>
                <CardHeader>
                    <CardTitle>Quotation List</CardTitle>
                    <CardDescription>A list of all quotations in the system.</CardDescription>
                </CardHeader>
                <CardContent>
                    <QuotationTable quotations={quotations} />
                </CardContent>
            </Card>
        </main>
    );
}