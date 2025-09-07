"use client"

import { Quotation, QuotationStatus } from '@prisma/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from '@/components/ui/chart';
import { PieChart, Pie, Cell } from 'recharts';
import { useMemo } from 'react';

interface ClientQuotationsSectionProps {
  quotations: Quotation[];
}

const statusColors: Record<QuotationStatus, string> = {
  DRAFT: "hsl(var(--chart-1))",
  SENT: "hsl(var(--chart-2))",
  VIEWED: "hsl(var(--chart-3))",
  APPROVED: "hsl(var(--chart-4))",
  REJECTED: "hsl(var(--chart-5))",
};

const chartConfig = {
  [QuotationStatus.DRAFT]: { label: 'Draft', color: statusColors.DRAFT },
  [QuotationStatus.SENT]: { label: 'Sent', color: statusColors.SENT },
  [QuotationStatus.VIEWED]: { label: 'Viewed', color: statusColors.VIEWED },
  [QuotationStatus.APPROVED]: { label: 'Approved', color: statusColors.APPROVED },
  [QuotationStatus.REJECTED]: { label: 'Rejected', color: statusColors.REJECTED },
};

export default function ClientQuotationsSection({ quotations }: ClientQuotationsSectionProps) {
  const quotationStatusCounts = useMemo(() => {
    const counts = quotations.reduce((acc, quotation) => {
      acc[quotation.status] = (acc[quotation.status] || 0) + 1;
      return acc;
    }, {} as Record<QuotationStatus, number>);
    return Object.entries(counts).map(([status, count]) => ({
      status: status as QuotationStatus,
      count,
      fill: statusColors[status as QuotationStatus],
    }));
  }, [quotations]);

  const totalQuotations = quotations.length;

  return (
    <Card>
      <CardHeader>
        <CardTitle>My Quotations</CardTitle>
        <CardDescription>
          You have {totalQuotations} quotations in total.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {totalQuotations > 0 ? (
          <ChartContainer config={chartConfig} className="min-h-[200px] w-full">
            <PieChart>
              <ChartTooltip content={<ChartTooltipContent nameKey="count" hideLabel />} />
              <Pie
                data={quotationStatusCounts}
                dataKey="count"
                nameKey="status"
                cx="50%"
                cy="50%"
                outerRadius={80}
                labelLine={false}
                label={({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
                  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
                  const x = cx + radius * Math.cos(-midAngle * (Math.PI / 180));
                  const y = cy + radius * Math.sin(-midAngle * (Math.PI / 180));
                  return (
                    <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central">
                      {`${(percent * 100).toFixed(0)}%`}
                    </text>
                  );
                }}
              >
                {quotationStatusCounts.map((entry) => (
                  <Cell key={entry.status} fill={entry.fill} />
                ))}
              </Pie>
              <ChartLegend content={<ChartLegendContent />} />
            </PieChart>
          </ChartContainer>
        ) : (
          <div className="flex justify-center items-center h-48">
            <p className="text-muted-foreground">No quotation data available.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
