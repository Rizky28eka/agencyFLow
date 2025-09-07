'use client';

import { Quotation } from '@prisma/client';
import { DataTable } from '@/components/data-table';
import { ColumnDef } from '@tanstack/react-table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';

interface QuotationsClientPageProps {
  quotations: Quotation[];
}

const getStatusBadge = (status: string) => {
  switch (status.toUpperCase()) {
    case 'APPROVED':
      return <Badge variant="success">Approved</Badge>;
    case 'SENT':
      return <Badge variant="secondary">Sent</Badge>;
    case 'VIEWED':
      return <Badge variant="outline">Viewed</Badge>;
    case 'REJECTED':
      return <Badge variant="destructive">Rejected</Badge>;
    case 'DRAFT':
      return <Badge>Draft</Badge>;
    default:
      return <Badge>{status}</Badge>;
  }
};

const columns: ColumnDef<Quotation>[] = [
  { accessorKey: 'quotationNumber', header: 'Quotation #' },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => getStatusBadge(row.getValue('status')),
  },
  {
    accessorKey: 'issueDate',
    header: 'Issue Date',
    cell: ({ row }) => new Date(row.getValue('issueDate')).toLocaleDateString(),
  },
  {
    accessorKey: 'expiryDate',
    header: 'Expiry Date',
    cell: ({ row }) => {
      const date = row.getValue('expiryDate');
      return date ? new Date(date as string).toLocaleDateString() : 'N/A';
    },
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
    id: 'actions',
    cell: ({ row }) => {
      const quotation = row.original;
      return (
        <Button asChild variant="outline" size="sm">
          <Link href={`/client/quotations/${quotation.id}`}>View</Link>
        </Button>
      );
    },
  },
];

export default function QuotationsClientPage({ quotations }: QuotationsClientPageProps) {
  return (
    <div className="p-4 md:p-6 lg:p-8">
      <h1 className="text-2xl md:text-3xl font-bold mb-6">My Quotations</h1>
      <DataTable columns={columns} data={quotations} filterColumn="quotationNumber" />
    </div>
  );
}
