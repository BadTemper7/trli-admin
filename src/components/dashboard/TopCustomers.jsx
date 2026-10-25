import DashboardCard from "@/components/dashboard/DashboardCard.jsx"
import { formatCurrency, formatNumber } from "@/lib/formatters.js"

function TopCustomers({ data = [] }) {
  return (
    <DashboardCard
      title="Top Customers"
      description="By container volume"
      className="h-full"
    >
      <ol className="divide-y divide-border">
        {data.slice(0, 5).map((customer, index) => (
          <li
            key={customer.name}
            className="flex items-center gap-4 py-3.5 first:pt-0 last:pb-0"
          >
            <span
              aria-hidden="true"
              className="w-5 shrink-0 text-center text-sm font-semibold tabular-nums text-muted-foreground/70"
            >
              {index + 1}
            </span>
            <span className="min-w-0 flex-1 truncate text-sm font-semibold">
              <span className="sr-only">Rank {index + 1}: </span>
              {customer.name}
            </span>
            <span className="shrink-0 text-right">
              <span className="block text-sm font-semibold tabular-nums">
                {formatCurrency(customer.revenue)}
              </span>
              <span className="block text-xs tabular-nums text-muted-foreground">
                {formatNumber(customer.containers)} containers
              </span>
            </span>
          </li>
        ))}
      </ol>
    </DashboardCard>
  )
}

export default TopCustomers
