'use client';

import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { getClientDashboardData } from '@/app/actions/client-data';
import { Project, Invoice, Quotation, QuotationStatus } from '@/types/db-models';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

import ClientProjectsSection from '@/components/client-dashboard/ClientProjectsSection';
import ClientBillingSection from '@/components/client-dashboard/ClientBillingSection';
import ClientQuotationsSection from '@/components/client-dashboard/ClientQuotationsSection';

function StatCard({ title, value, isLoading }: { title: string; value: string | number; isLoading: boolean }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-8 w-1/2" />
        ) : (
          <div className="text-2xl font-bold">{value}</div>
        )}
      </CardContent>
    </Card>
  );
}

export default function ClientDashboardPage() {
  const { data: session } = useSession();
  const [projects, setProjects] = useState<Project[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [outstandingInvoices, setOutstandingInvoices] = useState<Invoice[]>([]);
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const { projects, invoices, outstandingInvoices, quotations } = await getClientDashboardData();
        setProjects(projects);
        setInvoices(invoices);
        setOutstandingInvoices(outstandingInvoices);
        setQuotations(quotations);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Failed to fetch dashboard data.');
        console.error('Error fetching client dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [session]);

  const pendingQuotations = quotations.filter(q => q.status === QuotationStatus.SENT || q.status === QuotationStatus.VIEWED).length;

  if (error) {
    return (
      <div className="container mx-auto p-4">
        <h1 className="text-2xl font-bold mb-4">Client Dashboard</h1>
        <p className="text-red-500">Error: {error}</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 md:p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Welcome, {session?.user?.name || 'Client'}!</h1>
        <p className="text-muted-foreground">Here&apos;s a summary of your activities.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        <StatCard title="Total Projects" value={projects.length} isLoading={loading} />
        <StatCard title="Outstanding Invoices" value={outstandingInvoices.length} isLoading={loading} />
        <StatCard title="Pending Quotations" value={pendingQuotations} isLoading={loading} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <ClientProjectsSection projects={projects} />
        <ClientQuotationsSection quotations={quotations} />
        <ClientBillingSection invoices={invoices} outstandingInvoices={outstandingInvoices} />
      </div>
    </div>
  );
}
