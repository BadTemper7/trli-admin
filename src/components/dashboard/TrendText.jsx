import { ArrowDownRight, ArrowUpRight } from "lucide-react"

import { formatSignedPercent } from "@/lib/formatters.js"
import { cn } from "@/lib/utils.js"

// "↑ +12% vs yesterday" with an arrow icon; green when up, red when down.
function TrendText({ change, comparison, fractionDigits = 0, className }) {
  const isDown = change < 0
  const Icon = isDown ? ArrowDownRight : ArrowUpRight

  return (
    <span className={cn("inline-flex items-center gap-1", className)}>
      <span
        className={cn(
          "inline-flex items-center gap-0.5 font-semibold",
          isDown ? "text-danger-600" : "text-emerald-700"
        )}
      >
        <Icon aria-hidden="true" className="size-4" />
        {formatSignedPercent(change, fractionDigits)}
      </span>
      <span className="text-muted-foreground">{comparison}</span>
    </span>
  )
}

export default TrendText
