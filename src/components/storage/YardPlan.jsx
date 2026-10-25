import { Pencil, Search } from "lucide-react"

import { STATUS_COLORS } from "@/data/yardData.js"

const scaleX = (value) => `${(value / 980) * 100}%`
const scaleY = (value) => `${(value / 820) * 100}%`

function YardPlan({ blocks, containers, selectedContainer, selectedBlockId, onSelectContainer, onSelectBlock, onEditBlock, query }) {
  const normalized = query.trim().toUpperCase()

  return (
    <div className="relative aspect-[1.19/1] min-h-[560px] w-full overflow-hidden rounded-xl border bg-[#d7d2c7] shadow-inner">
      <div className="absolute inset-[2%] rounded-[26px] border-[5px] border-[#e6b42c] bg-[#50575c] shadow-[0_0_0_2px_#443b2d]">
        <div className="absolute left-[2%] top-[2%] rounded-lg bg-white/95 px-3 py-2 shadow">
          <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">Mega Port Terminal</div>
          <div className="text-sm font-extrabold text-[#17324f]">Container Location Plan</div>
        </div>

        <div className="absolute left-[10%] top-[14%] h-[14%] w-[22%] rounded-xl border-2 border-dashed border-slate-300/80 bg-[#6b7379] p-3 text-center text-white shadow-inner">
          <div className="text-xs font-semibold">ADMIN / OPS</div>
          <div className="text-xs font-semibold">OFFICE</div>
        </div>
        <div className="absolute left-[10%] top-[31%] flex h-[28%] w-[13%] items-center justify-center rounded-xl border border-[#bfb5a4] bg-[#d2c7b5] p-2 text-center text-[10px] font-bold text-slate-700">EQUIPMENT<br />PARKING</div>
        <div className="absolute left-[25%] top-[7%] rounded-md border-2 border-[#9d7214] bg-[#f4b21c] px-3 py-2 text-center text-[10px] font-extrabold text-[#3b3429] shadow">GATE<br />IN / OUT</div>

        <div className="absolute left-[24%] top-[33%] h-[4%] w-[62%] rounded-full border-y border-dashed border-white/70 bg-[#444b50]" />
        <div className="absolute left-[24%] top-[54%] h-[4%] w-[62%] rounded-full border-y border-dashed border-white/70 bg-[#444b50]" />
        <div className="absolute left-[24%] top-[76%] h-[4%] w-[62%] rounded-full border-y border-dashed border-white/70 bg-[#444b50]" />
        <div className="absolute left-[22%] top-[31%] h-[52%] w-[4%] rounded-full border-x border-dashed border-white/70 bg-[#444b50]" />
        <div className="absolute right-[10%] top-[31%] h-[49%] w-[4%] rounded-full border-x border-dashed border-white/70 bg-[#444b50]" />

        {blocks.map((block) => {
          const blockContainers = containers.filter((container) => container.blockId === block.id)
          const isSelected = selectedBlockId === block.id
          const pct = Math.min(100, Math.round((block.occupied / Math.max(block.capacity, 1)) * 100))
          const padding = 9
          const cols = block.bays
          const rows = block.rows
          return (
            <button
              type="button"
              key={block.id}
              onClick={() => onSelectBlock(block.id)}
              className={`group absolute overflow-hidden rounded-lg border-2 text-left shadow-xl transition ${isSelected ? "ring-4 ring-white/90" : "hover:brightness-105"}`}
              style={{ left: scaleX(block.x), top: scaleY(block.y), width: scaleX(block.w), height: scaleY(block.h), background: block.color, borderColor: `${block.color}cc` }}
            >
              <div className="absolute inset-0 opacity-25" style={{ backgroundImage: "linear-gradient(rgba(255,255,255,.35) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.35) 1px,transparent 1px)", backgroundSize: "22px 16px" }} />
              <div className="absolute inset-x-0 top-0 z-10 flex items-start justify-between bg-black/15 p-2 text-white">
                <div>
                  <div className="text-[10px] font-extrabold leading-none sm:text-xs">{block.name} BLOCK</div>
                  <div className="mt-0.5 text-[9px] opacity-90">{block.size}</div>
                </div>
                <span onClick={(e) => { e.stopPropagation(); onEditBlock(block) }} className="rounded bg-white/15 p-1 opacity-0 transition group-hover:opacity-100"><Pencil className="h-3.5 w-3.5" /></span>
              </div>
              <div className="absolute bottom-2 left-2 z-10 rounded bg-black/30 px-2 py-1 text-[9px] font-semibold text-white backdrop-blur-sm">{block.occupied}/{block.capacity} {block.capacityUnit||'TEU'} · {pct}%</div>
              {blockContainers.map((container) => {
                const c = container.bay - 1
                const r = container.row - 1
                const width = Math.max(7, (100 - padding * 2) / cols - 1)
                const height = Math.max(7, (100 - 30) / rows - 1)
                const match = !normalized || container.number.replaceAll(" ", "").includes(normalized.replaceAll(" ", ""))
                const active = selectedContainer?.id === container.id
                return (
                  <span
                    role="button"
                    tabIndex={0}
                    key={container.id}
                    title={`${container.number} · ${container.status}`}
                    onClick={(e) => { e.stopPropagation(); onSelectContainer(container) }}
                    onKeyDown={(e) => { if (e.key === "Enter") onSelectContainer(container) }}
                    className={`absolute z-20 rounded-[2px] border border-black/20 shadow-sm transition ${active ? "ring-2 ring-white" : ""} ${match ? "opacity-100" : "opacity-20"}`}
                    style={{ left: `${padding + c * ((100 - padding * 2) / cols)}%`, top: `${28 + r * ((100 - 32) / rows)}%`, width: `${width}%`, height: `${height}%`, background: STATUS_COLORS[container.status] }}
                  />
                )
              })}
            </button>
          )
        })}

        <div className="absolute bottom-[5%] left-[10%] h-[32%] w-[7%] overflow-hidden rounded-lg border border-slate-300 bg-[#71685e] p-1">
          {Array.from({ length: 18 }).map((_, i) => <div key={i} className="my-[2px] h-[4%] rounded-sm" style={{ background: ["#c54d3c", "#2973a7", "#57884c", "#d0902c"][i % 4] }} />)}
        </div>

        <div className="absolute bottom-[4%] left-[34%] h-[15%] w-[33%] -skew-x-[18deg] rounded-xl border border-[#bfb5a4] bg-[#c9c0b2] p-2">
          <div className="grid h-full grid-cols-3 gap-2">
            {[0, 1, 2].map((lane) => <div key={lane} className="rounded bg-[#6d7377] p-1">{Array.from({ length: 7 }).map((_, i) => <div key={i} className="mb-1 h-[8%] rounded-sm" style={{ background: ["#ce6134", "#247a95", "#477b50", "#d39a25"][i % 4] }} />)}</div>)}
          </div>
        </div>

        <div className="absolute left-[2.5%] top-[66%] rounded-lg bg-white/90 p-2 text-[9px] font-semibold text-slate-700 shadow"><Search className="mr-1 inline h-3 w-3" /> Container stacks</div>
      </div>
    </div>
  )
}

export default YardPlan
