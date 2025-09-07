'use client';

import { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

// This is a mock function. In a real app, you'd fetch this from your backend.
// You would need an API route that gets invoices for the logged-in client.
async function getClientInvoices() {
  // In a real app, you'd have authentication and fetch based on the logged-in user.
  // For now, let's mock some data.
  // NOTE: This mock data will not work with the payment flow as it doesn't exist in the DB.
  // This is for UI demonstration purposes. The actual page would need a proper API call.
  return [
    { id: 'inv_mock_1', invoiceNumber: '2025-001', issueDate: '2025-08-15', dueDate: '2025-09-14', totalAmount: 1500.00, status: 'PAID' },
    { id: 'inv_mock_2', invoiceNumber: '2025-002', issueDate: '2025-08-20', dueDate: '2025-09-19', totalAmount: 250.00, status: 'SENT' },
    { id: 'inv_mock_3', invoiceNumber: '2025-003', issueDate: '2025-07-10', dueDate: '2025-08-09', totalAmount: 3000.00, status: 'OVERDUE' },
    { id: 'inv_mock_4', invoiceNumber: '2025-004', issueDate: '2025-09-01', dueDate: '2025-10-01', totalAmount: 750.00, status: 'PROCESSING' },
  ];
}

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!
);

interface Invoice {
  id: string;
  invoiceNumber: string;
  issueDate: string;
  dueDate: string;
  totalAmount: number;
  status: string;
}

export default function ClientBillingPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [payingInvoiceId, setPayingInvoiceId] = useState<string | null>(null);

  useEffect(() => {
    getClientInvoices().then(data => {
      setInvoices(data);
      setLoading(false);
    });
  }, []);

  const handlePayment = async (invoiceId: string) => {
    setPayingInvoiceId(invoiceId);
    try {
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ invoiceId }),
      });

      if (!response.ok) {
        throw new Error('Failed to create checkout session');
      }

      const { sessionId } = await response.json();
      const stripe = await stripePromise;
      
      if (stripe) {
        const { error } = await stripe.redirectToCheckout({ sessionId });
        if (error) {
          console.error('Stripe redirect error:', error);
        }
      }
    } catch (error) {
      console.error('Payment error:', error);
      alert('Could not initiate payment. Please try again.');
    } finally {
      setPayingInvoiceId(null);
    }
  };

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

  if (loading) {
    return <div>Loading billing information...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>My Billing</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Invoice #</TableHead>
              <TableHead>Issue Date</TableHead>
              <TableHead>Due Date</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-center">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {invoices.map((invoice) => (
              <TableRow key={invoice.id}>
                <TableCell className="font-medium">{invoice.invoiceNumber}</TableCell>
                <TableCell>{invoice.issueDate}</TableCell>
                <TableCell>{invoice.dueDate}</TableCell>
                <TableCell className="text-right">${invoice.totalAmount.toFixed(2)}</TableCell>
                <TableCell>{getStatusBadge(invoice.status)}</TableCell>
                <TableCell className="text-center">
                  {['SENT', 'OVERDUE'].includes(invoice.status.toUpperCase()) && (
                    <Button 
                      onClick={() => handlePayment(invoice.id)}
                      disabled={payingInvoiceId === invoice.id}
                    >
                      {payingInvoiceId === invoice.id ? 'Processing...' : 'Pay Now'}
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

// A new variant for the Badge component might be needed for 'success'
// You can add this to your badge component's variants if it doesn't exist.
