import { ArrowLeftRight, Box, Clock3, MapPin } from "lucide-react"

function DetailRow({ label, value }) {
  return <div className="flex items-start justify-between gap-4 border-b py-2.5 text-sm last:border-0"><span className="text-muted-foreground">{label}</span><span className="text-right font-medium text-foreground">{value}</span></div>
}

function ContainerDetails({ container, block }) {
  if (!container || !block) {
    return <aside className="rounded-xl border bg-white p-5 shadow-sm"><div className="text-sm text-muted-foreground">Select a container from the yard plan to view its details.</div></aside>
  }

  return (
    <aside className="rounded-xl border bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center gap-3">
        <div className="rounded-lg bg-brand-50 p-2 text-primary"><Box className="h-5 w-5" /></div>
        <div><h3 className="font-semibold">Container Details</h3><p className="text-xs text-muted-foreground">Live yard position</p></div>
      </div>
      <div className="mb-4 rounded-xl bg-slate-50 p-4">
        <div className="text-base font-bold">{container.number}</div>
        <div className="mt-2 flex flex-wrap gap-2 text-xs"><span className="rounded-full bg-white px-2 py-1 shadow-sm">{container.type}</span><span className="rounded-full bg-white px-2 py-1 shadow-sm">{container.status}</span></div>
      </div>
      <DetailRow label="Block" value={`${block.name} BLOCK`} />
      <DetailRow label="Location" value={`${block.name}-${String(container.bay).padStart(2,"0")}-${String(container.row).padStart(2,"0")}-${String(container.tier).padStart(2,"0")}`} />
      <DetailRow label="Arrival" value={container.arrival} />
      <DetailRow label="Dwell Time" value={container.dwell} />
      <DetailRow label="Cargo Status" value={container.cargoStatus} />
      <div className="mt-5 grid gap-2">
        <button className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-3 py-2.5 text-sm font-semibold text-white"><MapPin className="h-4 w-4" /> View Position</button>
        <button className="inline-flex items-center justify-center gap-2 rounded-lg border px-3 py-2.5 text-sm font-semibold"><Clock3 className="h-4 w-4" /> Movement History</button>
        <button className="inline-flex items-center justify-center gap-2 rounded-lg border px-3 py-2.5 text-sm font-semibold"><ArrowLeftRight className="h-4 w-4" /> Relocate</button>
      </div>
    </aside>
  )
}

export default ContainerDetails
