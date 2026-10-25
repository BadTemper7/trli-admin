import { useNavigate } from 'react-router-dom'

const positions = {
  ALPHA:   { left: '26%', top: '26%', width: '18%', height: '18%' },
  BRAVO:   { left: '46%', top: '26%', width: '18%', height: '18%' },
  CHARLIE: { left: '66%', top: '26%', width: '18%', height: '18%' },
  ECHO:    { left: '30%', top: '49%', width: '50%', height: '18%' },
  DELTA:   { left: '26%', top: '72%', width: '18%', height: '19%' },
  FOXTROT: { left: '46%', top: '72%', width: '18%', height: '19%' },
  GOLF:    { left: '66%', top: '72%', width: '18%', height: '19%' },
}

const fallback = [
  { left: '26%', top: '26%', width: '18%', height: '18%' },
  { left: '46%', top: '26%', width: '18%', height: '18%' },
  { left: '66%', top: '26%', width: '18%', height: '18%' },
  { left: '30%', top: '49%', width: '50%', height: '18%' },
  { left: '26%', top: '72%', width: '18%', height: '19%' },
  { left: '46%', top: '72%', width: '18%', height: '19%' },
  { left: '66%', top: '72%', width: '18%', height: '19%' },
]

export default function YardOverview({ blocks }) {
  const navigate = useNavigate()
  return <section className="mb-5 rounded-2xl border bg-white p-4 shadow-sm">
    <div className="mb-4"><h2 className="font-bold">Mega Port Yard Layout</h2><p className="text-xs text-muted-foreground">Operational yard representation based on the supplied container location plan. Click a block to open it.</p></div>
    <div className="overflow-x-auto"><div className="relative mx-auto aspect-[1.08/1] min-w-[760px] max-w-[980px] overflow-hidden rounded-2xl border-4 border-amber-400 bg-slate-600 shadow-inner">
      <div className="absolute left-[4%] top-[5%] rounded-xl border border-slate-300 bg-slate-700 px-5 py-4 text-center text-xs font-black text-white shadow-lg">ADMIN / OPS<br/>OFFICE</div>
      <div className="absolute left-[5%] top-[27%] flex h-[23%] w-[15%] items-center justify-center rounded-xl border bg-stone-300 text-center text-[10px] font-bold text-slate-700">EQUIPMENT<br/>PARKING</div>
      <div className="absolute left-[19%] top-[8%] rounded-lg border-2 border-amber-700 bg-amber-400 px-4 py-3 text-center text-[10px] font-black text-slate-800">GATE<br/>IN / OUT</div>
      <div className="absolute left-[22%] top-[20%] h-[5%] w-[67%] rounded-full border-y border-dashed border-white/60 bg-slate-700" />
      <div className="absolute left-[21%] top-[45%] h-[4%] w-[68%] rounded-full border-y border-dashed border-white/60 bg-slate-700" />
      <div className="absolute left-[21%] top-[67%] h-[4%] w-[68%] rounded-full border-y border-dashed border-white/60 bg-slate-700" />
      <div className="absolute left-[21%] top-[20%] h-[72%] w-[4%] rounded-full border-x border-dashed border-white/60 bg-slate-700" />
      <div className="absolute right-[10%] top-[20%] h-[72%] w-[4%] rounded-full border-x border-dashed border-white/60 bg-slate-700" />
      {blocks.map((block, index) => {
        const p = positions[block.name] || fallback[index % fallback.length]
        return <button key={block.id} type="button" onClick={() => navigate(`/storage-monitoring/${block.id}`)} className="absolute overflow-hidden rounded-xl border-2 border-white/40 text-left text-white shadow-xl transition hover:scale-[1.02] hover:brightness-110" style={{ ...p, backgroundColor: block.color }}>
          <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,.45) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.45) 1px,transparent 1px)', backgroundSize: '22px 18px' }} />
          <div className="relative flex h-full flex-col items-center justify-center p-2 text-center"><div className="text-sm font-black sm:text-base">{block.name} BLOCK</div><div className="text-[10px] font-semibold opacity-90">({block.containerSize})</div><div className="mt-2 rounded bg-black/25 px-2 py-1 text-[10px] font-bold">{block.occupiedTeu}/{block.capacityTeu} {block.capacityUnit||'TEU'} · {block.occupancyRate}%</div></div>
        </button>
      })}
      <div className="absolute bottom-[3%] left-[4%] w-[16%] rounded-lg bg-white/90 p-2 text-[10px] font-bold text-slate-700 shadow">Roadway / drive lane<br/>6.0 m reference</div>
    </div></div>
  </section>
}
