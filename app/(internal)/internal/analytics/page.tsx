import { getProjects } from "../projects/actions";
import { AnalyticsCharts } from "./charts";

export default async function AnalyticsPage() {
    const projects = await getProjects();

    // Calculate summary metrics
    const totalProjects = projects.length;
    const totalBudget = projects.reduce((sum, p) => sum + Number(p.budget), 0);
    const totalExpenses = projects.reduce((sum, p) => sum + Number(p.totalExpenses), 0);
    const totalProfitability = projects.reduce((sum, p) => sum + Number(p.profitability), 0);

    // Process data for status pie chart
    const statusCounts = projects.reduce((acc, project) => {
        const status = project.status.replace("_", " ");
        acc[status] = (acc[status] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    const statusData = Object.entries(statusCounts).map(([name, value]) => ({ name, value }));

    // Process data for financials bar chart
    const financialsData = projects.map(p => ({
        name: p.name,
        budget: Number(p.budget),
        expenses: Number(p.totalExpenses),
    }));

    return (
        <AnalyticsCharts 
            totalBudget={totalBudget}
            totalExpenses={totalExpenses}
            totalProfitability={totalProfitability}
            totalProjects={totalProjects}
            statusData={statusData}
            financialsData={financialsData}
        />
    );
}