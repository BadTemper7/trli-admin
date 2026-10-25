import { cn } from "@/lib/utils.js"

function PageContainer({ className, children }) {
  return (
    <div className={cn("mx-auto w-full max-w-[1600px] p-4 sm:p-6 lg:p-8", className)}>
      {children}
    </div>
  )
}

export default PageContainer
