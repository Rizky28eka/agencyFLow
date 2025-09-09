// components/team-workload-chart.tsx
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { getUsersWithCapacity, getAllocatedHoursForUsers } from '@/app/actions/resource-management';
import { User } from '@prisma/client';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { DatePickerWithRange } from '@/components/ui/date-picker-with-range';
import { DateRange } from 'react-day-picker';
import { addDays } from 'date-fns';

interface UserWorkload extends User {
  allocatedHours: number;
  remainingCapacity: number;
}

export function TeamWorkloadChart() {
  const [users, setUsers] = useState<UserWorkload[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: new Date(),
    to: addDays(new Date(), 7),
  });

  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      setError(null);
      try {
        const [usersData, allocatedHoursData] = await Promise.all([
          getUsersWithCapacity(),
          dateRange?.from && dateRange?.to ? getAllocatedHoursForUsers(dateRange.from, dateRange.to) : Promise.resolve([]),
        ]);

        const usersWithWorkload: UserWorkload[] = usersData.map(user => {
          const allocated = allocatedHoursData.find(ah => ah.userId === user.id)?.allocatedHours || 0;
          const dailyCapacity = user.dailyCapacityHours?.toNumber() || 0;
          // Assuming 5 working days in a week for simplicity for weekly capacity
          const totalCapacity = dailyCapacity * 5; 
          const remaining = totalCapacity - allocated;

          return {
            ...user,
            allocatedHours: allocated,
            remainingCapacity: remaining,
          };
        });
        setUsers(usersWithWorkload);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
        console.error("Error fetching team workload:", err);
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, [dateRange]);

  if (error) {
    return <p className="text-red-500">{error}</p>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Team Workload Capacity</CardTitle>
        <div className="mt-4">
          <DatePickerWithRange date={dateRange} setDate={setDateRange} />
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-[300px] w-full" />
        ) : users.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={users} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="allocatedHours" stackId="a" fill="#8884d8" name="Allocated Hours" />
              <Bar dataKey="remainingCapacity" stackId="a" fill="#82ca9d" name="Remaining Capacity" />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-center text-muted-foreground py-4">No team members with capacity data found.</p>
        )}
      </CardContent>
    </Card>
  );
}