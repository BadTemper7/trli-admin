import { ChevronRight } from "lucide-react"
import { Fragment } from "react"
import { Link, useLocation } from "react-router-dom"

import { getBreadcrumbs } from "@/config/navigation.js"

function AppBreadcrumb() {
  const { pathname } = useLocation()
  const trail = getBreadcrumbs(pathname)

  return (
    <nav aria-label="Breadcrumb" className="min-w-0">
      <ol className="flex items-center gap-1.5 text-sm">
        {trail.map((crumb, index) => {
          const isLast = index === trail.length - 1
          return (
            <Fragment key={`${crumb.label}-${index}`}>
              {index > 0 && (
                <li aria-hidden="true" className="shrink-0 text-muted-foreground/60">
                  <ChevronRight className="size-3.5" />
                </li>
              )}
              <li
                className={
                  isLast
                    ? "min-w-0 truncate font-semibold text-foreground"
                    : // Earlier levels collapse on narrow screens so the current page stays visible.
                      "hidden shrink-0 text-muted-foreground sm:block"
                }
              >
                {isLast ? (
                  <span aria-current="page">{crumb.label}</span>
                ) : crumb.path ? (
                  <Link
                    to={crumb.path}
                    className="rounded transition-colors hover:text-foreground"
                  >
                    {crumb.label}
                  </Link>
                ) : (
                  <span>{crumb.label}</span>
                )}
              </li>
            </Fragment>
          )
        })}
      </ol>
    </nav>
  )
}

export default AppBreadcrumb
