import { Link, useLocation } from "react-router-dom"

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip.jsx"
import { cn } from "@/lib/utils.js"

function NavItem({ item, collapsed = false, onNavigate }) {
  const location = useLocation()
  const isActive = location.pathname === item.path
  const Icon = item.icon

  const link = (
    <Link
      to={item.path}
      onClick={onNavigate}
      aria-current={isActive ? "page" : undefined}
      aria-label={collapsed ? item.title : undefined}
      className={cn(
        "group relative flex h-10 items-center gap-3 rounded-lg text-sm font-medium transition-colors",
        collapsed ? "justify-center px-0" : "px-3",
        isActive
          ? "bg-brand-50 text-brand-600"
          : "text-muted-foreground hover:bg-muted hover:text-foreground"
      )}
    >
      {isActive && (
        <span
          aria-hidden="true"
          className="absolute -left-3 top-2 h-6 w-1 rounded-r-full bg-brand-600"
        />
      )}
      <Icon
        aria-hidden="true"
        className={cn(
          "size-5 shrink-0 transition-colors",
          isActive
            ? "text-brand-600"
            : "text-muted-foreground group-hover:text-foreground"
        )}
      />
      {!collapsed && <span className="truncate">{item.title}</span>}
    </Link>
  )

  if (!collapsed) return <li>{link}</li>

  return (
    <li>
      <Tooltip>
        <TooltipTrigger asChild>{link}</TooltipTrigger>
        <TooltipContent side="right">{item.title}</TooltipContent>
      </Tooltip>
    </li>
  )
}

export default NavItem
