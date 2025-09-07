'use client'

import { addQuotation, getClientsForSelection, getServicesForSelection } from "../actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DatePicker } from "@/components/ui/date-picker";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Prisma } from "@prisma/client"; // Import Client and Service types
import { PlusCircle, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type QuotationItemForm = {
    id?: string;
    description: string;
    quantity: number;
    unitPrice: number;
    discountPct?: number;
    taxPct?: number;
    serviceId?: string;
};

export default function NewQuotationPage() {
    const router = useRouter();
    const [clients, setClients] = useState<{ id: string; name: string }[]>([]);
    const [services, setServices] = useState<{ id: string; name: string; defaultPrice: Prisma.Decimal; }[]>([]);

    const [clientId, setClientId] = useState<string>("");
    const [issueDate, setIssueDate] = useState<Date | undefined>(new Date());
    const [expiryDate, setExpiryDate] = useState<Date | undefined>();
    const [items, setItems] = useState<QuotationItemForm[]>([{ description: "", quantity: 1, unitPrice: 0 }]);

    useEffect(() => {
        const fetchData = async () => {
            const fetchedClients = await getClientsForSelection();
            setClients(fetchedClients);
            const fetchedServices = await getServicesForSelection();
            setServices(fetchedServices);
        };
        fetchData();
    }, []);

    const handleAddItem = () => {
        setItems([...items, { description: "", quantity: 1, unitPrice: 0 }]);
    };

    const handleRemoveItem = (index: number) => {
        const newItems = items.filter((_, i) => i !== index);
        setItems(newItems);
    };

    const handleItemChange = (index: number, field: keyof QuotationItemForm, value: string | number) => {
        const newItems = [...items];
        if (field === "quantity" || field === "unitPrice" || field === "discountPct" || field === "taxPct") {
            newItems[index][field] = parseFloat(value as string);
        } else if (field === "description" || field === "serviceId") {
            newItems[index][field] = value as string;
        }
        setItems(newItems);
    };

    const calculateLineTotal = (item: QuotationItemForm) => {
        const quantity = item.quantity || 0;
        const unitPrice = item.unitPrice || 0;
        const discountPct = item.discountPct || 0;
        const taxPct = item.taxPct || 0;

        const subtotal = quantity * unitPrice;
        const discounted = subtotal * (1 - discountPct / 100);
        const taxed = discounted * (1 + taxPct / 100);
        return taxed;
    };

    const calculateTotalAmount = () => {
        return items.reduce((sum, item) => sum + calculateLineTotal(item), 0);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!clientId || !issueDate) {
            toast.error("Client and Issue Date are required.");
            return;
        }
        if (items.some(item => !item.description || item.quantity <= 0 || item.unitPrice <= 0)) {
            toast.error("All quotation items must have a description, quantity, and unit price greater than 0.");
            return;
        }

        try {
            await addQuotation({
                clientId,
                issueDate,
                expiryDate,
                items: items.map(item => ({
                    ...item,
                    unitPrice: parseFloat(item.unitPrice.toString()), // Ensure unitPrice is number
                })),
            });
            toast.success("Quotation created successfully.");
            router.push("/internal/quotations");
        } catch (error) {
            toast.error("Failed to create quotation.");
            console.error("Create quotation error:", error);
        }
    };

    return (
        <div className="container mx-auto py-10">
            <h1 className="text-3xl font-bold mb-6">Create New Quotation</h1>
            <form onSubmit={handleSubmit} className="space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Quotation Details</CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <Label htmlFor="clientId">Client</Label>
                            <Select onValueChange={setClientId} value={clientId}>
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
                        <div>
                            <Label htmlFor="issueDate">Issue Date</Label>
                            <DatePicker date={issueDate} setDate={setIssueDate} />
                        </div>
                        <div>
                            <Label htmlFor="expiryDate">Expiry Date (Optional)</Label>
                            <DatePicker date={expiryDate} setDate={setExpiryDate} />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex justify-between items-center">
                            Quotation Items
                            <Button type="button" onClick={handleAddItem} size="sm">
                                <PlusCircle className="h-4 w-4 mr-2" /> Add Item
                            </Button>
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {items.map((item, index) => (
                            <div key={item.id || index} className="grid grid-cols-1 md:grid-cols-6 gap-4 border p-4 rounded-md relative">
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleRemoveItem(index)}
                                    className="absolute top-2 right-2 text-red-500 hover:text-red-700"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                                <div className="md:col-span-2">
                                    <Label htmlFor={`description-${index}`}>Description</Label>
                                    <Textarea
                                        id={`description-${index}`}
                                        value={item.description}
                                        onChange={(e) => handleItemChange(index, "description", e.target.value)}
                                        required
                                    />
                                </div>
                                <div>
                                    <Label htmlFor={`service-${index}`}>Service (Optional)</Label>
                                    <Select onValueChange={(value) => handleItemChange(index, "serviceId", value)} value={item.serviceId}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select a service" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {services.map((service) => (
                                                <SelectItem key={service.id} value={service.id}>
                                                    {service.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div>
                                    <Label htmlFor={`quantity-${index}`}>Quantity</Label>
                                    <Input
                                        id={`quantity-${index}`}
                                        type="number"
                                        value={item.quantity}
                                        onChange={(e) => handleItemChange(index, "quantity", e.target.value)}
                                        min="1"
                                        required
                                    />
                                </div>
                                <div>
                                    <Label htmlFor={`unitPrice-${index}`}>Unit Price</Label>
                                    <Input
                                        id={`unitPrice-${index}`}
                                        type="number"
                                        value={item.unitPrice}
                                        onChange={(e) => handleItemChange(index, "unitPrice", e.target.value)}
                                        step="0.01"
                                        min="0"
                                        required
                                    />
                                </div>
                                <div>
                                    <Label htmlFor={`discountPct-${index}`}>Discount (%)</Label>
                                    <Input
                                        id={`discountPct-${index}`}
                                        type="number"
                                        value={item.discountPct || ""}
                                        onChange={(e) => handleItemChange(index, "discountPct", e.target.value)}
                                        step="0.01"
                                        min="0"
                                        max="100"
                                    />
                                </div>
                                <div>
                                    <Label htmlFor={`taxPct-${index}`}>Tax (%)</Label>
                                    <Input
                                        id={`taxPct-${index}`}
                                        type="number"
                                        value={item.taxPct || ""}
                                        onChange={(e) => handleItemChange(index, "taxPct", e.target.value)}
                                        step="0.01"
                                        min="0"
                                    />
                                </div>
                                <div className="md:col-span-6 text-right font-semibold">
                                    Line Total: {new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR" }).format(calculateLineTotal(item))}
                                </div>
                            </div>
                        ))}
                        <div className="text-right text-xl font-bold mt-4">
                            Total Amount: {new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR" }).format(calculateTotalAmount())}
                        </div>
                    </CardContent>
                </Card>

                <Button type="submit">Create Quotation</Button>
            </form>
        </div>
    );
}