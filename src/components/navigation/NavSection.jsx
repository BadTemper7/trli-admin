import { useId } from "react"

import NavItem from "@/components/navigation/NavItem.jsx"
import { cn } from "@/lib/utils.js"

function NavSection({ section, items, collapsed = false, isFirst = false, onNavigate }) {
  const headingId = useId()

  return (
    <div
      role="group"
      aria-labelledby={headingId}
      className={cn(!isFirst && (collapsed ? "mt-3 border-t border-border pt-3" : "mt-5"))}
    >
      <h2
        id={headingId}
        className={cn(
          "mb-1.5 px-3 text-xs font-semibold text-muted-foreground/90",
          collapsed && "sr-only"
        )}
      >
        {section}
      </h2>
      <ul className="space-y-0.5">
        {items.map((item) => (
          <NavItem
            key={item.path}
            item={item}
            collapsed={collapsed}
            onNavigate={onNavigate}
          />
        ))}
      </ul>
    </div>
  )
}

export default NavSection
