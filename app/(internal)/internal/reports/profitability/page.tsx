'use client';

import { useState, useEffect, useMemo } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface ProfitabilityData {
  projectId: string;
  projectName: string;
  revenue: number;
  expenses: number;
  laborCost: number;
  profit: number;
}

// Helper to format currency
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount);
};

export default function ProfitabilityReportPage() {
  const [data, setData] = useState<ProfitabilityData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        setIsLoading(true);
        const response = await fetch('/api/reports/profitability');
        if (!response.ok) {
          throw new Error('Failed to fetch profitability report.');
        }
        const reportData = await response.json();
        setData(reportData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, []);

  const totals = useMemo(() => {
    return data.reduce(
      (acc, project) => {
        acc.revenue += project.revenue;
        acc.expenses += project.expenses;
        acc.laborCost += project.laborCost;
        acc.profit += project.profit;
        return acc;
      },
      { revenue: 0, expenses: 0, laborCost: 0, profit: 0 }
    );
  }, [data]);

  if (error) {
    return <p className="text-red-500 p-4">Error: {error}</p>;
  }

  return (
    <div className="container mx-auto p-4 space-y-6">
      <h1 className="text-2xl font-bold">Project Profitability Report</h1>
      
      <Card>
        <CardHeader>
            <CardTitle>Report Summary</CardTitle>
        </CardHeader>
        <CardContent>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Project Name</TableHead>
                        <TableHead className="text-right">Revenue</TableHead>
                        <TableHead className="text-right">Expenses</TableHead>
                        <TableHead className="text-right">Labor Cost</TableHead>
                        <TableHead className="text-right">Profit</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {isLoading ? (
                        Array.from({ length: 5 }).map((_, i) => (
                            <TableRow key={i}>
                                <TableCell><Skeleton className="h-5 w-3/4" /></TableCell>
                                <TableCell><Skeleton className="h-5 w-full" /></TableCell>
                                <TableCell><Skeleton className="h-5 w-full" /></TableCell>
                                <TableCell><Skeleton className="h-5 w-full" /></TableCell>
                                <TableCell><Skeleton className="h-5 w-full" /></TableCell>
                            </TableRow>
                        ))
                    ) : (
                        data.map((project) => (
                            <TableRow key={project.projectId}>
                                <TableCell className="font-medium">{project.projectName}</TableCell>
                                <TableCell className="text-right">{formatCurrency(project.revenue)}</TableCell>
                                <TableCell className="text-right text-orange-600">({formatCurrency(project.expenses)})</TableCell>
                                <TableCell className="text-right text-orange-600">({formatCurrency(project.laborCost)})</TableCell>
                                <TableCell className={cn(
                                    "text-right font-bold",
                                    project.profit >= 0 ? "text-green-600" : "text-red-600"
                                )}>
                                    {formatCurrency(project.profit)}
                                </TableCell>
                            </TableRow>
                        ))
                    )}
                </TableBody>
                <TableFooter>
                    <TableRow>
                        <TableHead>Totals</TableHead>
                        <TableHead className="text-right">{formatCurrency(totals.revenue)}</TableHead>
                        <TableHead className="text-right">({formatCurrency(totals.expenses)})</TableHead>
                        <TableHead className="text-right">({formatCurrency(totals.laborCost)})</TableHead>
                        <TableHead className={cn(
                            "text-right font-bold",
                            totals.profit >= 0 ? "text-green-600" : "text-red-600"
                        )}>
                            {formatCurrency(totals.profit)}
                        </TableHead>
                    </TableRow>
                </TableFooter>
            </Table>
        </CardContent>
      </Card>
    </div>
  );
}
