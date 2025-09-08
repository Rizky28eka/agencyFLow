"use client"

import { Invoice, InvoiceStatus } from '@/types/db-models';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { DataTable } from '@/components/data-table';
import { ColumnDef } from '@tanstack/react-table';
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { useMemo } from 'react';

interface ClientBillingSectionProps {
  invoices: Invoice[];
  outstandingInvoices: Invoice[];
}

const statusColors: Record<InvoiceStatus, string> = {
  DRAFT: "hsl(var(--chart-1))",
  SENT: "hsl(var(--chart-2))",
  PAID: "hsl(var(--chart-4))",
  OVERDUE: "hsl(var(--chart-5))",
  CANCELLED: "hsl(var(--chart-3))",
  PROCESSING: "hsl(var(--chart-1))",
};

const chartConfig = {
  [InvoiceStatus.PAID]: { label: 'Paid', color: statusColors.PAID },
  [InvoiceStatus.SENT]: { label: 'Sent', color: statusColors.SENT },
  [InvoiceStatus.OVERDUE]: { label: 'Overdue', color: statusColors.OVERDUE },
};

const columns: ColumnDef<Invoice>[] = [
  { accessorKey: 'invoiceNumber', header: 'Invoice #' },
  { accessorKey: 'status', header: 'Status' },
  {
    accessorKey: 'totalAmount',
    header: 'Amount',
    cell: ({ row }) => {
      const amount = parseFloat(row.getValue('totalAmount'));
      return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
    },
  },
  {
    accessorKey: 'issueDate',
    header: 'Issue Date',
    cell: ({ row }) => new Date(row.getValue('issueDate')).toLocaleDateString(),
  },
  {
    accessorKey: 'dueDate',
    header: 'Due Date',
    cell: ({ row }) => new Date(row.getValue('dueDate')).toLocaleDateString(),
  },
];

export default function ClientBillingSection({ invoices, outstandingInvoices }: ClientBillingSectionProps) {
  const monthlyInvoiceData = useMemo(() => {
    const monthlyData: { [key: string]: { [key in InvoiceStatus]?: number } } = {};
    invoices.forEach(invoice => {
      const month = new Date(invoice.issueDate).toLocaleString('default', { month: 'short' });
      if (!monthlyData[month]) {
        monthlyData[month] = {};
      }
      monthlyData[month][invoice.status] = (monthlyData[month][invoice.status] || 0) + Number(invoice.totalAmount);
    });

    return Object.keys(monthlyData).map(month => ({
      month,
      ...monthlyData[month],
    }));
  }, [invoices]);

  const totalOutstanding = outstandingInvoices.reduce((acc, inv) => acc + Number(inv.totalAmount), 0);

  return (
    <Card className="col-span-1 lg:col-span-3">
      <CardHeader>
        <CardTitle>My Billing</CardTitle>
        <CardDescription>
          Total outstanding: {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(totalOutstanding)}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {invoices.length > 0 ? (
          <ChartContainer config={chartConfig} className="min-h-[200px] w-full">
            <BarChart data={monthlyInvoiceData}>
              <CartesianGrid vertical={false} />
              <XAxis dataKey="month" tickLine={false} tickMargin={10} axisLine={false} />
              <YAxis />
              <ChartTooltip content={<ChartTooltipContent />} />
              <ChartLegend content={<ChartLegendContent />} />
              <Bar dataKey={InvoiceStatus.PAID} fill={statusColors.PAID} stackId="a" radius={4} />
              <Bar dataKey={InvoiceStatus.SENT} fill={statusColors.SENT} stackId="a" radius={4} />
              <Bar dataKey={InvoiceStatus.OVERDUE} fill={statusColors.OVERDUE} stackId="a" radius={4} />
            </BarChart>
          </ChartContainer>
        ) : (
          <div className="flex justify-center items-center h-48">
            <p className="text-muted-foreground">No billing data available.</p>
          </div>
        )}
        <DataTable columns={columns} data={invoices} filterColumn="invoiceNumber" />
      </CardContent>
    </Card>
  );
}
