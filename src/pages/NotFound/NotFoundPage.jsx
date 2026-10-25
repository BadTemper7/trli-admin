import { Link } from "react-router-dom"

import BrandLogo from "@/components/layout/BrandLogo.jsx"
import { Button } from "@/components/ui/button.jsx"

// Standalone page. Intentionally outside DashboardLayout.
function NotFoundPage() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center bg-background px-6 py-12 text-center">
      <BrandLogo to={null} className="h-20" />

      <p className="mt-10 text-7xl font-bold tracking-tight text-brand-600">
        404
      </p>
      <h1 className="mt-3 text-2xl font-semibold">Page Not Found</h1>
      <p className="mt-2 max-w-sm text-sm text-muted-foreground">
        The page you're looking for doesn't exist.
      </p>

      <Button asChild size="lg" className="mt-8">
        <Link to="/dashboard">Back to Dashboard</Link>
      </Button>
    </main>
  )
}

export default NotFoundPage
