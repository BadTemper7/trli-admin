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

function RevenueOverview({ stats, revenueTrend, label }) {

  return (
    <DashboardCard title="Revenue Overview" description={label || "Selected period"} className="h-full">
      <div className="grid gap-5 sm:grid-cols-2">
        <RevenueFigure
          label="Revenue for Selected Period"
          value={formatCurrency(stats.revenueToday)}
          change={stats.revenueTodayChange}
          comparison="vs previous period"
        />
        <RevenueFigure
          label="Verified Payment Transactions"
          value={String(stats.verifiedPayments||0)}
          change={stats.revenueMonthChange}
          comparison="vs previous period"
        />
      </div>

      <div className="mt-6 flex-1 border-t border-border pt-5">
        <RevenueChart data={revenueTrend} />
      </div>
    </DashboardCard>
  )
}

export default RevenueOverview
