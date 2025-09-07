"use client"

import { Project, ProjectStatus } from '@prisma/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from '@/components/ui/chart';
import { PieChart, Pie, Cell } from 'recharts';
import { useMemo } from 'react';

interface ClientProjectsSectionProps {
  projects: Project[];
}

const statusColors: Record<ProjectStatus, string> = {
  PLANNING: "hsl(var(--chart-1))",
  ON_GOING: "hsl(var(--chart-2))",
  ON_HOLD: "hsl(var(--chart-3))",
  COMPLETED: "hsl(var(--chart-4))",
  CANCELLED: "hsl(var(--chart-5))",
};

const chartConfig = {
  [ProjectStatus.PLANNING]: { label: 'Planning', color: statusColors.PLANNING },
  [ProjectStatus.ON_GOING]: { label: 'On Going', color: statusColors.ON_GOING },
  [ProjectStatus.ON_HOLD]: { label: 'On Hold', color: statusColors.ON_HOLD },
  [ProjectStatus.COMPLETED]: { label: 'Completed', color: statusColors.COMPLETED },
  [ProjectStatus.CANCELLED]: { label: 'Cancelled', color: statusColors.CANCELLED },
};

export default function ClientProjectsSection({ projects }: ClientProjectsSectionProps) {
  const projectStatusCounts = useMemo(() => {
    const counts = projects.reduce((acc, project) => {
      acc[project.status] = (acc[project.status] || 0) + 1;
      return acc;
    }, {} as Record<ProjectStatus, number>);
    return Object.entries(counts).map(([status, count]) => ({
      status: status as ProjectStatus,
      count,
      fill: statusColors[status as ProjectStatus],
    }));
  }, [projects]);

  const totalProjects = projects.length;

  return (
    <Card className="col-span-1 lg:col-span-2">
      <CardHeader>
        <CardTitle>My Projects</CardTitle>
        <CardDescription>
          You have {totalProjects} projects in total.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {totalProjects > 0 ? (
          <ChartContainer config={chartConfig} className="min-h-[200px] w-full">
            <PieChart>
              <ChartTooltip content={<ChartTooltipContent nameKey="count" hideLabel />} />
              <Pie
                data={projectStatusCounts}
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
                {projectStatusCounts.map((entry) => (
                  <Cell key={entry.status} fill={entry.fill} />
                ))}
              </Pie>
              <ChartLegend content={<ChartLegendContent />} />
            </PieChart>
          </ChartContainer>
        ) : (
          <div className="flex justify-center items-center h-48">
            <p className="text-muted-foreground">No project data available.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
