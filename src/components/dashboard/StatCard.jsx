import { cn } from "@/lib/utils.js"

/**
 * Compact KPI card. `tone="warning"` keeps the card neutral and tints only the
 * icon chip and the top edge, so it reads as a flag rather than an alarm.
 */
function StatCard({ title, value, icon: Icon, footer, tone = "default" }) {
  const isWarning = tone === "warning"

  return (
    <div
      className={cn(
        "relative flex h-full min-h-[148px] flex-col overflow-hidden rounded-xl border border-border bg-surface p-5 shadow-[0_1px_2px_rgba(26,29,38,0.04)]",
        isWarning && "border-t-2 border-t-danger-500"
      )}
    >
      <div className="flex min-h-10 items-center gap-3">
        <span
          aria-hidden="true"
          className={cn(
            "flex size-9 shrink-0 items-center justify-center rounded-lg",
            isWarning
              ? "bg-danger-50 text-danger-600"
              : "bg-brand-50 text-brand-600"
          )}
        >
          <Icon className="size-5" />
        </span>
        <h2 className="text-sm font-medium text-muted-foreground">{title}</h2>
      </div>

      <p className="mt-4 text-4xl font-bold tabular-nums tracking-tight text-foreground">
        {value}
      </p>

      <div className="mt-auto pt-2 text-sm">{footer}</div>
    </div>
  )
}

export default StatCard
