import { cn } from "@/lib/utils.js"

// Shared card shell: title row with optional right-side content, then the body.
function DashboardCard({ title, description, action, className, children }) {
  return (
    <section
      className={cn(
        "flex min-w-0 flex-col rounded-xl border border-border bg-surface p-5 shadow-[0_1px_2px_rgba(26,29,38,0.04)] sm:p-6",
        className
      )}
    >
      <div className="mb-5 flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
        <div className="min-w-0">
          <h2 className="text-base font-semibold text-foreground">{title}</h2>
          {description && (
            <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>
          )}
        </div>
        {action}
      </div>
      {children}
    </section>
  )
}

export default DashboardCard
