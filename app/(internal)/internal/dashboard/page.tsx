"use client";

import { useState, useEffect, useCallback } from "react";
import { Responsive, WidthProvider } from "react-grid-layout";
import "react-grid-layout/css/styles.css";

import { ChartAreaInteractive } from "@/components/chart-area-interactive";
import { SectionCards } from "@/components/section-cards";
import { Button } from "@/components/ui/button";
import { Settings } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { DashboardCustomizationDialog } from "@/components/dashboard/dashboard-customization-dialog";
import { getDashboardLayout, saveDashboardLayout } from "@/app/actions/dashboard";
import { DashboardWidget as DashboardWidgetType } from "@prisma/client";

const ResponsiveGridLayout = WidthProvider(Responsive);

// Define available dashboard widgets and their components
const availableWidgets = {
  "section-cards": { title: "Overview Cards", component: SectionCards },
  "chart-area-interactive": { title: "Interactive Chart", component: ChartAreaInteractive },
  // Add other widgets here as they are developed
};

export default function DashboardPage() {
  const [layout, setLayout] = useState<ReactGridLayout.Layout[]>([]); // Stores react-grid-layout layout
  const [widgets, setWidgets] = useState<DashboardWidgetType[]>([]); // Stores actual widget data from DB
  const [isCustomizationOpen, setIsCustomizationOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [data, setData] = useState<{
    cardData: {
      totalRevenue: number;
      newCustomers: number;
      activeAccounts: number;
      growthRate: number;
    };
    chartData: Array<{ date: string; desktop: number; mobile: number }>;
  } | null>(null); // To store fetched data for widgets

  const fetchDashboardData = useCallback(async () => {
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
      const userLayout = await getDashboardLayout();
      if (userLayout && userLayout.layout && userLayout.widgets) {
        setLayout(userLayout.layout as ReactGridLayout.Layout[]);
        setWidgets(userLayout.widgets);
      } else {
        // Default layout if none exists
        const defaultWidgets: DashboardWidgetType[] = Object.keys(availableWidgets).map(key => ({
          id: key, // Use key as ID for default widgets
          type: key,
          config: {},
          layoutId: "", // Will be set on save
          createdAt: new Date(),
          updatedAt: new Date(),
        }));
        setWidgets(defaultWidgets);
        setLayout(defaultWidgets.map((widget, index) => ({
          i: widget.id,
          x: index * 4 % 12,
          y: Math.floor(index / 3) * 4,
          w: 4,
          h: 4,
        })));
      }
    } catch (error: any) {
      console.error("Failed to fetch dashboard data or layout:", error);
      // Fallback to default layout on error
      setWidgets(Object.keys(availableWidgets).map(key => ({
        id: key,
        type: key,
        config: {},
        layoutId: "",
        createdAt: new Date(),
        updatedAt: new Date(),
      })));
      setLayout(Object.keys(availableWidgets).map((key, index) => ({
        i: key,
        x: index * 4 % 12,
        y: Math.floor(index / 3) * 4,
        w: 4,
        h: 4,
      })));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const onLayoutChange = (newLayout: ReactGridLayout.Layout[]) => {
    setLayout(newLayout);
  };

  const handleLayoutSave = async (newWidgetIds: string[]) => {
    setIsLoading(true);
    try {
      const widgetsToSave: Omit<DashboardWidgetType, "layoutId" | "createdAt" | "updatedAt">[] = newWidgetIds.map(id => {
        const existingWidget = widgets.find(w => w.id === id);
        if (existingWidget) {
          return { id: existingWidget.id, type: existingWidget.type, config: existingWidget.config };
        } else {
          // This case should ideally not happen if availableSections are correctly mapped
          return { id, type: id, config: {} };
        }
      });

      const savedLayout = await saveDashboardLayout(layout, widgetsToSave);
      if (savedLayout) {
        setLayout(savedLayout.layout as ReactGridLayout.Layout[]);
        setWidgets(savedLayout.widgets);
      }
    } catch (error: any) {
      console.error("Failed to save dashboard layout:", error);
    } finally {
      setIsCustomizationOpen(false);
      setIsLoading(false);
    }
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
          <ResponsiveGridLayout
            className="layout"
            layouts={{ lg: layout }}
            breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
            cols={{ lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 }}
            rowHeight={100}
            onLayoutChange={onLayoutChange}
            isDraggable={true}
            isResizable={true}
          >
            {widgets.map((widget) => {
              const WidgetComponent = availableWidgets[widget.type]?.component;
              if (!WidgetComponent) return null;

              // Pass appropriate data to each widget component based on its type
              let widgetProps = {};
              if (widget.type === "section-cards") {
                widgetProps = { data: data.cardData };
              } else if (widget.type === "chart-area-interactive") {
                widgetProps = { data: data.chartData };
              }

              return (
                <div key={widget.id} data-grid={{ i: widget.id, x: 0, y: 0, w: 4, h: 4 }}>
                  <WidgetComponent {...widgetProps} />
                </div>
              );
            })}
          </ResponsiveGridLayout>
        </div>
      </div>

      <DashboardCustomizationDialog
        open={isCustomizationOpen}
        onOpenChange={setIsCustomizationOpen}
        onSave={handleLayoutSave}
        currentLayout={widgets.map(w => w.id)}
        availableSections={Object.entries(availableWidgets).map(([id, { title }]) => ({ id, title }))}
      />
    </div>
  );
}