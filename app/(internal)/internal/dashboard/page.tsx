import { ChartAreaInteractive } from "@/components/chart-area-interactive"
import { SectionCards } from "@/components/section-cards"
import {
  getTotalRevenue,
  getNewCustomersCount,
  getActiveAccountsCount,
  getGrowthRate,
  getChartData,
} from "@/lib/data"

export default async function Page() {
  const totalRevenue = await getTotalRevenue();
  const newCustomers = await getNewCustomersCount();
  const activeAccounts = await getActiveAccountsCount();
  const growthRate = await getGrowthRate();
  const chartData = await getChartData();

  const cardData = {
    totalRevenue: Number(totalRevenue),
    newCustomers,
    activeAccounts,
    growthRate,
  };

  return (
    <div className="flex flex-1 flex-col">
      <div className="@container/main flex flex-1 flex-col gap-2">
        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
          <SectionCards data={cardData} />
          <div className="px-4 lg:px-6">
            <ChartAreaInteractive data={chartData} />
          </div>
        </div>
      </div>
    </div>
  )
}
