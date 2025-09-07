'use client';

import { useState } from 'react';
import { Invoice } from '@prisma/client';
import { loadStripe } from '@stripe/stripe-js';
import { DataTable } from '@/components/data-table';
import { ColumnDef } from '@tanstack/react-table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!
);

interface BillingClientPageProps {
  invoices: Invoice[];
}

const getStatusBadge = (status: string) => {
  switch (status.toUpperCase()) {
    case 'PAID':
      return <Badge variant="success">Paid</Badge>;
    case 'SENT':
      return <Badge variant="secondary">Sent</Badge>;
    case 'PROCESSING':
      return <Badge variant="outline">Processing</Badge>;
    case 'OVERDUE':
      return <Badge variant="destructive">Overdue</Badge>;
    default:
      return <Badge>{status}</Badge>;
  }
};

interface InvoiceActionCellProps {
  invoice: Invoice;
}

const InvoiceActionCell: React.FC<InvoiceActionCellProps> = ({ invoice }) => {
  const [paying, setPaying] = useState(false);

  const handlePayment = async (invoiceId: string) => {
    setPaying(true);
    try {
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ invoiceId }),
      });
      if (!response.ok) throw new Error('Failed to create checkout session');
      const { sessionId } = await response.json();
      const stripe = await stripePromise;
      if (stripe) {
        const { error } = await stripe.redirectToCheckout({ sessionId });
        if (error) console.error('Stripe redirect error:', error);
      }
    } catch (error) {
      console.error('Payment error:', error);
      alert('Could not initiate payment. Please try again.');
    } finally {
      setPaying(false);
    }
  };

  if (['SENT', 'OVERDUE'].includes(invoice.status.toUpperCase())) {
    return (
      <Button onClick={() => handlePayment(invoice.id)} disabled={paying}>
        {paying ? 'Processing...' : 'Pay Now'}
      </Button>
    );
  }
  return null;
};

const columns: ColumnDef<Invoice>[] = [
  { accessorKey: 'invoiceNumber', header: 'Invoice #' },
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
  {
    accessorKey: 'totalAmount',
    header: 'Amount',
    cell: ({ row }) => {
      const amount = parseFloat(row.getValue('totalAmount'));
      return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
    },
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => getStatusBadge(row.getValue('status')),
  },
  {
    id: 'actions',
    cell: ({ row }) => {
      return <InvoiceActionCell invoice={row.original} />;
    },
  },
];

export default function BillingClientPage({ invoices }: BillingClientPageProps) {
  return (
    <div className="p-4 md:p-6 lg:p-8">
      <h1 className="text-2xl md:text-3xl font-bold mb-6">My Billing</h1>
      <DataTable columns={columns} data={invoices} filterColumn="invoiceNumber" />
    </div>
  );
}
