"use client";

import { useState, useEffect } from "react";
import { ChartAreaInteractive } from "@/components/chart-area-interactive";
import { SectionCards } from "@/components/section-cards";
import { Button } from "@/components/ui/button";
import { Settings } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { DashboardCustomizationDialog } from "@/components/dashboard/dashboard-customization-dialog";

interface DashboardData {
  cardData: {
    totalRevenue: number;
    newCustomers: number;
    activeAccounts: number;
    growthRate: number;
  };
  chartData: Array<{ date: string; desktop: number; mobile: number }>;
}

// Define available dashboard sections and their components
const dashboardSections = {
  "section-cards": { title: "Overview Cards", component: SectionCards },
  "chart-area-interactive": { title: "Interactive Chart", component: ChartAreaInteractive },
  // Add other sections here as they are developed
};

export default function DashboardPage() {
  const [layout, setLayout] = useState<string[]>([]);
  const [isCustomizationOpen, setIsCustomizationOpen] = useState(false);
  const [data, setData] = useState<DashboardData | null>(null); // To store fetched data
  const [isLoading, setIsLoading] = useState(true);

  // Fetch dashboard data and user layout
  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      try {
        // Fetch all necessary data for the dashboard components
        const [totalRevenue, newCustomers, activeAccounts, growthRate, chartData] = await Promise.all([
          fetch("/api/dashboard/total-revenue").then(res => res.json()),
          fetch("/api/dashboard/new-customers").then(res => res.json()),
          fetch("/api/dashboard/active-accounts").then(res => res.json()),
          fetch("/api/dashboard/growth-rate").then(res => res.json()),
          fetch("/api/dashboard/chart-data").then(res => res.json()),
        ]);

        setData({
          cardData: {
            totalRevenue: Number(totalRevenue),
            newCustomers,
            activeAccounts,
            growthRate,
          },
          chartData,
        });

        // Fetch user's custom layout
        const layoutResponse = await fetch("/api/dashboard-layout");
        const layoutData = await layoutResponse.json();
        setLayout(layoutData.layout || Object.keys(dashboardSections)); // Use fetched layout or default all

      } catch (error) {
        console.error("Failed to fetch dashboard data or layout:", error);
        // Fallback to default layout on error
        setLayout(Object.keys(dashboardSections));
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, []);

  const handleLayoutSave = (newLayout: string[]) => {
    setLayout(newLayout);
    setIsCustomizationOpen(false);
  };

  if (isLoading) {
    return (
      <div className="flex flex-1 flex-col p-4">
        <div className="flex justify-end mb-4"><Skeleton className="h-10 w-40" /></div>
        <Skeleton className="h-48 w-full mb-4" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!data) {
    return <div className="p-4 text-center text-red-500">Failed to load dashboard data.</div>;
  }

  return (
    <div className="flex flex-1 flex-col">
      <div className="@container/main flex flex-1 flex-col gap-2">
        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
          <div className="flex justify-end px-4 lg:px-6">
            <Button variant="outline" onClick={() => setIsCustomizationOpen(true)}>
              <Settings className="mr-2 h-4 w-4" />
              Customize Dashboard
            </Button>
          </div>
          {layout.map((sectionId) => {
            const SectionComponent = dashboardSections[sectionId]?.component;
            if (!SectionComponent) return null;

            // Pass appropriate data to each section component
            let sectionProps = {};
            if (sectionId === "section-cards") {
              sectionProps = { data: data.cardData };
            } else if (sectionId === "chart-area-interactive") {
              sectionProps = { data: data.chartData };
            }

            return (
              <div key={sectionId} className="px-4 lg:px-6">
                <SectionComponent {...sectionProps} />
              </div>
            );
          })}
        </div>
      </div>

      <DashboardCustomizationDialog
        open={isCustomizationOpen}
        onOpenChange={setIsCustomizationOpen}
        onSave={handleLayoutSave}
        currentLayout={layout}
        availableSections={Object.entries(dashboardSections).map(([id, { title }]) => ({ id, title }))}
      />
    </div>
  );
}