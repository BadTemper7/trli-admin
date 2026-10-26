import { ArrowRightLeft, PackageCheck, Warehouse } from "lucide-react";
import BrandLogo from "@/components/layout/BrandLogo.jsx";

const CURRENT_YEAR = new Date().getFullYear();

const FEATURES = [
  {
    icon: ArrowRightLeft,
    title: "Gate-in",
    text: "Log arrivals and inspections as they happen.",
  },
  {
    icon: Warehouse,
    title: "Storage",
    text: "Track every container and its yard location.",
  },
  {
    icon: PackageCheck,
    title: "Release",
    text: "Approve and release with a full audit trail.",
  },
];

// Standalone layout for sign-in. No sidebar, header or breadcrumbs.
function AuthLayout({ children }) {
  return (
    <div className="grid min-h-dvh bg-background lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)]">
      <aside className="relative hidden flex-col justify-between overflow-hidden bg-primary p-12 text-white lg:flex xl:p-16">
        {/* depth: gradient, grid, glow */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/15 via-transparent to-black/40"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-40 [background-image:linear-gradient(to_right,rgb(255_255_255/0.08)_1px,transparent_1px),linear-gradient(to_bottom,rgb(255_255_255/0.08)_1px,transparent_1px)] [background-size:48px_48px] [mask-image:radial-gradient(ellipse_at_top_left,black,transparent_70%)]"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-40 -right-40 h-[28rem] w-[28rem] rounded-full bg-white/10 blur-3xl"
        />

        <header className="relative">
          <div className="inline-flex items-center gap-4 rounded-2xl bg-white py-3 pl-3 pr-6 shadow-xl shadow-black/20 ring-1 ring-white/30">
            <BrandLogo to={null} className="h-14 xl:h-16" />
            <div className="leading-tight">
              <p className="text-lg font-semibold text-slate-900 xl:text-xl">
                Trans Roadway
              </p>
              <p className="text-sm text-slate-500">Logistics Inc.</p>
            </div>
          </div>
        </header>

        <div className="relative max-w-lg">
          <h2 className="text-4xl font-semibold leading-tight tracking-tight xl:text-5xl">
            Manage gate-in, storage, and release from one place.
          </h2>
          <p className="mt-4 text-base text-white/90">
            Real-time visibility across your terminal operations.
          </p>

          <ul className="mt-10 space-y-3">
            {FEATURES.map(({ icon: Icon, title, text }) => (
              <li
                key={title}
                className="flex items-start gap-4 rounded-2xl border border-white/20 bg-black/25 p-4 backdrop-blur-sm"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/15 ring-1 ring-white/25">
                  <Icon className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-sm font-semibold text-white">{title}</p>
                  <p className="text-sm text-white/90">{text}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-sm text-white/80">
          © {CURRENT_YEAR} All rights reserved.
        </p>
      </aside>

      <main className="flex flex-col bg-brand-50 px-4 py-8 sm:px-8">
        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-md">
            <div className="mb-8 flex items-center justify-center gap-3 lg:hidden">
              <BrandLogo to={null} className="h-14" />
              <div className="leading-tight">
                <p className="text-lg font-semibold text-foreground">
                  Trans Roadway
                </p>
                <p className="text-sm text-muted-foreground">Logistics Inc.</p>
              </div>
            </div>
            <div className="rounded-2xl border border-border bg-surface p-6 shadow-xl shadow-primary/5 sm:p-10">
              {children}
            </div>
          </div>
        </div>

        <p className="mt-8 text-center text-xs text-muted-foreground">
          © {CURRENT_YEAR} All rights reserved.
        </p>
      </main>
    </div>
  );
}

export default AuthLayout;
