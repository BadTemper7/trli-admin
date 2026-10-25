import DashboardCard from "@/components/dashboard/DashboardCard.jsx"
import RevenueChart from "@/components/dashboard/RevenueChart.jsx"
import TrendText from "@/components/dashboard/TrendText.jsx"
import { formatCurrency } from "@/lib/formatters.js"

function RevenueFigure({ label, value, change, comparison }) {
  return (
    <div>
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-0.5 text-3xl font-bold tabular-nums tracking-tight">
        {value}
      </p>
      <TrendText
        change={change}
        comparison={comparison}
        fractionDigits={1}
        className="mt-1 text-sm"
      />
    </div>
  )
}

function RevenueOverview({ stats, revenueTrend }) {

  return (
    <DashboardCard title="Revenue Overview" description="Last 7 days" className="h-full">
      <div className="grid gap-5 sm:grid-cols-2">
        <RevenueFigure
          label="Revenue Today"
          value={formatCurrency(stats.revenueToday)}
          change={stats.revenueTodayChange}
          comparison="vs yesterday"
        />
        <RevenueFigure
          label="Revenue Month to Date"
          value={formatCurrency(stats.revenueMonthToDate)}
          change={stats.revenueMonthChange}
          comparison="vs last month at this point"
        />
      </div>

      <div className="mt-6 flex-1 border-t border-border pt-5">
        <RevenueChart data={revenueTrend} />
      </div>
    </DashboardCard>
  )
}

export default RevenueOverview
