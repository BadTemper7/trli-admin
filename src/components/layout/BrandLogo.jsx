import { Link } from "react-router-dom"

import logo from "@/assets/logo.webp"
import { HOME_PATH } from "@/config/navigation.js"
import { cn } from "@/lib/utils.js"

/**
 * The one official logo. Same file at every size; only the height changes.
 * `to` makes it a link; pass `to={null}` to render a plain image.
 */
function BrandLogo({ className, to = HOME_PATH }) {
  const image = (
    <img
      src={logo}
      alt="Company Logo"
      className={cn("w-auto object-contain", className)}
    />
  )

  if (!to) return image

  return (
    <Link
      to={to}
      aria-label="Go to dashboard"
      className="inline-flex items-center rounded-md"
    >
      {image}
    </Link>
  )
}

export default BrandLogo
