import { getTeamWorkload } from "./actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TeamWorkloadChart } from "@/components/team-workload-chart";

export default async function ResourceManagementPage() {
  const workloadData = await getTeamWorkload();

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Resource Management</h1>
      
      <Card>
        <CardHeader>
          <CardTitle>Team Workload - Monthly View</CardTitle>
        </CardHeader>
        <CardContent>
          {workloadData.length > 0 ? (
            <TeamWorkloadChart data={workloadData} />
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
