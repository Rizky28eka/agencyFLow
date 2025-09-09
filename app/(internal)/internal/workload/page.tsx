'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface WorkloadData {
  userId: string;
  userName: string | null;
  dailyCapacityHours: number;
  totalEstimatedHours: number;
  totalLoggedHours: number;
}

export default function WorkloadDashboardPage() {
  const [workloadData, setWorkloadData] = useState<WorkloadData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      setError(null);
      try {
        // Fetch data from your API
        const response = await fetch('/api/workload'); // Add query params for date range if needed
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data: WorkloadData[] = await response.json();
        setWorkloadData(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
        console.error('Error fetching workload data:', err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, []);

  if (isLoading) {
    return <p>Loading Workload Dashboard...</p>;
  }

  if (error) {
    return <p className="text-red-500">Error: {error}</p>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Team Workload Overview</CardTitle>
      </CardHeader>
      <CardContent>
        <div style={{ width: '100%', height: 400 }}>
          <ResponsiveContainer>
            <BarChart
              data={workloadData}
              margin={{
                top: 20, right: 30, left: 20, bottom: 5,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="userName" />
              <YAxis />
              <Tooltip formatter={(value: number) => `${value.toFixed(2)} hours`} />
              <Legend />
              <Bar dataKey="totalEstimatedHours" name="Estimated Hours" fill="#8884d8" />
              <Bar dataKey="totalLoggedHours" name="Logged Hours" fill="#82ca9d" />
              <Bar dataKey="dailyCapacityHours" name="Daily Capacity" fill="#ffc658" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}