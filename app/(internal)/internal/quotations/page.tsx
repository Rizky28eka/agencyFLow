import { getQuotations } from "./actions";
import { QuotationTable } from "./quotation-table"; // Import the new component
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default async function QuotationsPage() {
    const quotations = await getQuotations();

    return (
        <div className="container mx-auto py-10">
            <div className="flex justify-between items-center mb-4">
                <h1 className="text-3xl font-bold">Quotations</h1>
                <Button asChild>
                    <Link href="/internal/quotations/new">Create New Quotation</Link>
                </Button>
            </div>
            <QuotationTable quotations={quotations} /> {/* Use the new component */}
        </div>
    );
}