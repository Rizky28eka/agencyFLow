// components/dashboard/CustomDashboard.tsx
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { getDashboardLayout, saveDashboardLayout } from '@/app/actions/dashboard';
import { toast } from 'sonner';
import { XIcon } from 'lucide-react';
import { ProfitabilityChart } from './ProfitabilityChart'; // Import the new chart component

// Define types for widgets
interface WidgetConfig {
  id: string;
  type: string; // e.g., 'profitability', 'timeTracking', 'projectProgress'
  // Add other widget-specific properties here (e.g., filters, date ranges)
}

interface DashboardLayoutData {
  id: string;
  userId: string;
  layout: WidgetConfig[];
}

// Dynamic Widget Component
const WidgetComponent = ({ widget }: { widget: WidgetConfig }) => {
  switch (widget.type) {
    case 'profitability':
      return <ProfitabilityChart />;
    // Add other widget types here as they are created
    case 'timeTracking':
      return (
        <Card className="h-full">
          <CardHeader>
            <CardTitle>Time Tracking Widget</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Content for Time Tracking widget (ID: {widget.id})</p>
          </CardContent>
        </Card>
      );
    case 'projectProgress':
      return (
        <Card className="h-full">
          <CardHeader>
            <CardTitle>Project Progress Widget</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Content for Project Progress widget (ID: {widget.id})</p>
          </CardContent>
        </Card>
      );
    default:
      return (
        <Card className="h-full">
          <CardHeader>
            <CardTitle>Unknown Widget Type</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Widget type: {widget.type} (ID: {widget.id})</p>
          </CardContent>
        </Card>
      );
  }
};

export function CustomDashboard() {
  const [layout, setLayout] = useState<WidgetConfig[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchLayout() {
      setIsLoading(true);
      setError(null);
      try {
        const fetchedLayout = await getDashboardLayout();
        if (fetchedLayout && fetchedLayout.layout) {
          setLayout(fetchedLayout.layout as WidgetConfig[]);
        } else {
          // Default layout if none exists
          setLayout([
            { id: 'widget-1', type: 'profitability' },
            { id: 'widget-2', type: 'projectProgress' },
          ]);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
        console.error('Error fetching dashboard layout:', err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchLayout();
  }, []);

  const handleSaveLayout = async () => {
    try {
      await saveDashboardLayout(layout);
      toast.success('Dashboard layout saved!');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save layout.');
      console.error('Error saving dashboard layout:', err);
    }
  };

  const addWidget = (type: string) => {
    const newWidget: WidgetConfig = {
      id: `widget-${Date.now()}`,
      type: type,
    };
    setLayout((prevLayout) => [...prevLayout, newWidget]);
  };

  const removeWidget = (id: string) => {
    setLayout((prevLayout) => prevLayout.filter((widget) => widget.id !== id));
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-1/3" />
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-48 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return <p className="text-red-500">Error: {error}</p>;
  }

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">My Dashboard</h1>
        <div className="flex gap-2">
          <Button onClick={() => addWidget('profitability')}>Add Profitability Widget</Button>
          <Button onClick={() => addWidget('timeTracking')}>Add Time Tracking Widget</Button>
          <Button onClick={handleSaveLayout}>Save Layout</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {layout.length > 0 ? (
          layout.map((widget) => (
            <div key={widget.id} className="relative border rounded-lg p-4">
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-2 right-2"
                onClick={() => removeWidget(widget.id)}
              >
                <XIcon className="h-4 w-4" />
              </Button>
              <WidgetComponent widget={widget} />
            </div>
          ))
        ) : (
          <p className="col-span-full text-center text-muted-foreground py-8">
            No widgets added yet. Add some widgets to customize your dashboard!
          </p>
        )}
      </div>
    </div>
  );
}
