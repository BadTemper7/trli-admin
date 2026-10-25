import BrandLogo from "@/components/layout/BrandLogo.jsx"

const CURRENT_YEAR = new Date().getFullYear()

// Standalone layout for sign-in. No sidebar, header or breadcrumbs.
function AuthLayout({ children }) {
  return (
    <div className="grid min-h-dvh bg-surface lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
      <aside className="hidden flex-col bg-brand-50 p-12 lg:flex xl:p-16">
        <div className="flex flex-1 flex-col justify-center">
          <div>
            <BrandLogo to={null} className="mb-10 h-44 xl:h-56" />
          </div>
          <p className="max-w-sm text-2xl font-semibold leading-snug text-foreground">
            Manage gate-in, storage, and release from one place.
          </p>
        </div>

        <p className="text-sm text-muted-foreground">
          © {CURRENT_YEAR} All rights reserved.
        </p>
      </aside>

      <main className="flex items-center justify-center bg-background px-4 py-10 sm:px-8 lg:bg-surface">
        <div className="w-full max-w-md">
          <div className="mb-8 flex justify-center lg:hidden">
            <BrandLogo to={null} className="h-20" />
          </div>
          <div className="rounded-2xl border border-border bg-surface p-6 shadow-sm sm:p-8 lg:border-0 lg:p-0 lg:shadow-none">
            {children}
          </div>
        </div>
      </main>
    </div>
  )
}

export default AuthLayout
