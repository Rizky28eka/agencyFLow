'use client';

import { getTeamWorkload, TeamWorkloadData } from "./actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TeamWorkloadChart } from "@/components/team-workload-chart";
import { useEffect, useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function ResourceManagementPage() {
  const [workloadData, setWorkloadData] = useState<TeamWorkloadData>([]);
  const [view, setView] = useState<'monthly' | 'weekly'>('monthly');
  const [month] = useState(new Date());

  useEffect(() => {
    const fetchData = async () => {
      const data = await getTeamWorkload(month);
      setWorkloadData(data);
    };
    fetchData();
  }, [month]);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Resource Management</h1>
        <div className="flex items-center space-x-4">
            <Select value={view} onValueChange={(value) => setView(value as 'monthly' | 'weekly')}>
                <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Select view" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="monthly">Monthly View</SelectItem>
                    <SelectItem value="weekly">Weekly View</SelectItem>
                </SelectContent>
            </Select>
        </div>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Team Workload - {view === 'monthly' ? 'Monthly' : 'Weekly'} View</CardTitle>
        </CardHeader>
        <CardContent>
          {workloadData.length > 0 ? (
            <TeamWorkloadChart data={workloadData} view={view} month={month} />
          ) : (
            <div className="flex items-center justify-center h-60">
              <p className="text-gray-500">No tasks assigned for the current month.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
