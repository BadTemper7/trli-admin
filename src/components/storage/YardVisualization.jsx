import { Box, Grid3X3, RotateCcw, ZoomIn, ZoomOut } from 'lucide-react'
import { useMemo, useState } from 'react'

/* ---------- helpers ---------- */

function keyOf(container) {
  return `${container.storage?.bay}-${container.storage?.row}-${container.storage?.tier}`
}

const PALETTE = [
  { base: '#1f4e9c', dark: '#16397a', light: '#2f67c0' }, // blue
  { base: '#b3261e', dark: '#851b15', light: '#cf4037' }, // red
  { base: '#1f7a4d', dark: '#165a39', light: '#2f9a64' }, // green
  { base: '#c46a12', dark: '#92500c', light: '#e0872c' }, // orange
  { base: '#4b5563', dark: '#374151', light: '#6b7280' }, // grey
  { base: '#6d3fb0', dark: '#4f2c85', light: '#8a5ccc' }, // purple
  { base: '#0f766e', dark: '#0b5750', light: '#1a968c' }, // teal
]

function hashString(value = '') {
  let h = 0
  for (let i = 0; i < value.length; i += 1) h = (h * 31 + value.charCodeAt(i)) >>> 0
  return h
}

function paletteFor(container) {
  const type = String(container.type || '').toUpperCase()
  if (type.includes('REEFER') || type.includes('RF')) return { base: '#d8dee6', dark: '#aab4c0', light: '#eef2f6', reefer: true }
  return PALETTE[hashString(container.shippingLine || container.containerNumber) % PALETTE.length]
}

function splitNumber(value = '') {
  const clean = String(value).replace(/\s+/g, '')
  return { owner: clean.slice(0, 4), serial: clean.slice(4, 10), check: clean.slice(10, 11) }
}

const RIBS = (color) =>
  `repeating-linear-gradient(90deg, rgba(0,0,0,.22) 0 1.5px, rgba(255,255,255,.10) 1.5px 3px, transparent 3px 6px), linear-gradient(180deg, rgba(255,255,255,.18), rgba(0,0,0,.18)), ${color}`
const RIBS_TOP = (color) =>
  `repeating-linear-gradient(90deg, rgba(0,0,0,.18) 0 1.5px, rgba(255,255,255,.12) 1.5px 3px, transparent 3px 6px), ${color}`

/* ---------- 3D container (front/top/door-end faces, true container look) ---------- */

function Casting({ className = '', style }) {
  return <i className={`absolute block h-[5px] w-[6px] rounded-[1px] bg-gradient-to-br from-amber-200 to-amber-600 shadow-[0_0_0_.5px_rgba(0,0,0,.55)] ${className}`} style={style} />
}

function ContainerBox3D({ container, blockColor, highlighted, label, onClick, empty, is20 }) {
  const W = is20 ? 52 : 98
  const H = 30
  const D = 12 // depth shown on top/side
  const pal = empty ? null : paletteFor(container)
  const { owner, serial, check } = empty ? {} : splitNumber(container.containerNumber)
  const ring = highlighted ? '#f59e0b' : empty ? '#cbd5e1' : 'rgba(0,0,0,.55)'

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={empty}
      aria-label={label}
      title={label}
      className={`group absolute text-left transition-transform duration-150 ${empty ? 'cursor-default' : 'hover:-translate-y-1'} ${highlighted ? 'z-50' : ''}`}
      style={{ width: W + D, height: H + D }}
    >
      {empty ? (
        <>
          <span className="absolute rounded-[2px] border border-dashed border-slate-300 bg-slate-50/70" style={{ left: 0, top: D, width: W, height: H }} />
          <span className="absolute border border-dashed border-slate-300 bg-white/70" style={{ left: D * 0.7, top: 0, width: W, height: D, transform: 'skewX(-45deg)', transformOrigin: 'bottom left' }} />
          <span className="absolute inset-x-0 flex items-center justify-center text-[7px] font-bold tracking-widest text-slate-300" style={{ top: D, height: H }}>EMPTY</span>
        </>
      ) : (
        <>
          {/* roof */}
          <span
            className="absolute border"
            style={{
              left: D * 0.7, top: 0, width: W, height: D,
              background: RIBS_TOP(pal.light), borderColor: ring,
              transform: 'skewX(-45deg)', transformOrigin: 'bottom left',
              boxShadow: highlighted ? '0 0 0 3px rgba(245,158,11,.35)' : undefined,
            }}
          />
          {/* door end (right side) */}
          <span
            className="absolute border"
            style={{
              left: W, width: D * 0.7, height: H,
              background: `repeating-linear-gradient(0deg, rgba(0,0,0,.25) 0 1px, transparent 1px 4px), ${pal.dark}`,
              borderColor: ring,
              transform: 'skewY(-45deg)', transformOrigin: 'top left',
              top: D * 0.7,
            }}
          />
          {/* front long side with corrugation */}
          <span
            className={`absolute overflow-hidden rounded-[1.5px] border ${highlighted ? 'ring-[3px] ring-amber-300' : ''}`}
            style={{ left: 0, top: D, width: W, height: H, background: RIBS(pal.base), borderColor: ring }}
          >
            {/* top & bottom rails */}
            <i className="absolute inset-x-0 top-0 h-[3px] bg-black/35" />
            <i className="absolute inset-x-0 bottom-0 h-[3px] bg-black/45" />
            {/* corner castings */}
            <Casting className="left-0 top-0" />
            <Casting className="right-0 top-0" />
            <Casting className="bottom-0 left-0" />
            <Casting className="bottom-0 right-0" />
            {/* marking panel */}
            <span className="absolute inset-x-[8px] top-[5px] flex flex-col items-center justify-center rounded-[1px] bg-black/25 px-0.5 py-[1px] leading-none text-white">
              <span className="truncate text-[6px] font-black tracking-[.12em]">{owner} {serial}{check ? `·${check}` : ''}</span>
              {!is20 && <span className="text-[5px] font-semibold tracking-widest opacity-80">{container.size} {container.type}</span>}
            </span>
            {pal.reefer && <span className="absolute bottom-[4px] left-[8px] rounded-[1px] bg-sky-600 px-[3px] text-[5px] font-black text-white">RF</span>}
          </span>
          {/* gloss */}
          <span className="pointer-events-none absolute rounded-[1.5px] bg-gradient-to-b from-white/25 to-transparent" style={{ left: 0, top: D, width: W, height: H / 2 }} />
        </>
      )}
    </button>
  )
}

/* ---------- 2D container (flat side elevation, corrugated, with door end) ---------- */

function ContainerSlot2D({ container, bay, row, tier, highlighted, onSelect, is20 }) {
  if (!container) {
    return (
      <div
        title={`Available · Bay ${bay} · Row ${row} · Tier ${tier}`}
        className="flex h-[54px] items-center justify-center rounded-[4px] border border-dashed border-slate-300 bg-slate-50 text-[9px] font-bold tracking-wider text-slate-400"
      >
        B{String(bay).padStart(2, '0')} R{String(row).padStart(2, '0')}
      </div>
    )
  }
  const pal = paletteFor(container)
  const { owner, serial, check } = splitNumber(container.containerNumber)
  return (
    <button
      type="button"
      onClick={() => onSelect(container)}
      title={`${container.containerNumber} · Bay ${bay} · Row ${row} · Tier ${tier}`}
      className={`group relative flex h-[54px] items-stretch overflow-hidden rounded-[4px] border border-black/60 text-white shadow-[0_2px_4px_rgba(15,23,42,.35)] transition hover:-translate-y-0.5 hover:shadow-lg ${highlighted ? 'z-10 ring-4 ring-amber-300' : ''}`}
      style={{ background: RIBS(pal.base) }}
    >
      {/* top / bottom rails */}
      <i className="absolute inset-x-0 top-0 h-[4px] bg-black/35" />
      <i className="absolute inset-x-0 bottom-0 h-[4px] bg-black/45" />
      {/* corner castings */}
      <i className="absolute left-0 top-0 h-[7px] w-[8px] bg-gradient-to-br from-amber-200 to-amber-600 shadow-[0_0_0_.5px_rgba(0,0,0,.6)]" />
      <i className="absolute right-0 top-0 h-[7px] w-[8px] bg-gradient-to-br from-amber-200 to-amber-600 shadow-[0_0_0_.5px_rgba(0,0,0,.6)]" />
      <i className="absolute bottom-0 left-0 h-[7px] w-[8px] bg-gradient-to-br from-amber-200 to-amber-600 shadow-[0_0_0_.5px_rgba(0,0,0,.6)]" />
      <i className="absolute bottom-0 right-0 h-[7px] w-[8px] bg-gradient-to-br from-amber-200 to-amber-600 shadow-[0_0_0_.5px_rgba(0,0,0,.6)]" />
      {/* marking panel */}
      <span className="relative z-[1] m-auto flex flex-col items-center rounded-[2px] bg-black/30 px-1.5 py-[2px] leading-tight">
        <span className="text-[8px] font-black tracking-[.14em]">{owner}</span>
        <span className="text-[9px] font-black tracking-[.1em]">{serial}<sup className="ml-0.5 text-[6px]">{check}</sup></span>
        <span className="text-[6px] font-semibold tracking-widest opacity-80">{container.size} {container.type}</span>
      </span>
      {/* door end with locking bars */}
      <span className="relative z-[1] mr-[1px] flex w-[18%] min-w-[16px] items-center justify-evenly border-l-2 border-black/50 bg-black/25">
        <i className="h-[70%] w-[2px] rounded bg-slate-300/80 shadow-[0_0_0_.5px_rgba(0,0,0,.5)]" />
        <i className="h-[70%] w-[2px] rounded bg-slate-300/80 shadow-[0_0_0_.5px_rgba(0,0,0,.5)]" />
      </span>
      {pal.reefer && <span className="absolute bottom-[5px] left-[10px] z-[2] rounded-[2px] bg-sky-600 px-1 text-[6px] font-black">REEFER</span>}
    </button>
  )
}

/* ---------- main ---------- */

export default function YardVisualization({ block, containers, highlightedId, onSelect }) {
  const [mode, setMode] = useState('3d')
  const [zoom, setZoom] = useState(1)
  const [mirrored, setMirrored] = useState(false)

  const bays = Math.max(1, Number(block.layout?.bays) || 1)
  const rows = Math.max(1, Number(block.layout?.rows) || 1)
  const tiers = Math.max(1, Number(block.layout?.tiers) || 1)
  const is20 = String(block.containerSize || '').startsWith('20')

  const byPosition = useMemo(() => new Map(containers.map((c) => [keyOf(c), c])), [containers])

  const cells = useMemo(() => {
    const result = []
    for (let row = rows; row >= 1; row -= 1) {
      for (let bay = 1; bay <= bays; bay += 1) {
        for (let tier = 1; tier <= tiers; tier += 1) {
          result.push({ bay, row, tier, container: byPosition.get(`${bay}-${row}-${tier}`) })
        }
      }
    }
    return result
  }, [bays, rows, tiers, byPosition])

  const boxW = is20 ? 52 : 98
  const bayStep = boxW + 22
  const rowStepX = 30
  const rowStepY = 52
  const tierStep = 33
  const margin = 56
  const canvasWidth = margin * 2 + (bays - 1) * bayStep + (rows - 1) * rowStepX + boxW + 24
  const canvasHeight = margin * 2 + (rows - 1) * rowStepY + (tiers - 1) * tierStep + 72

  const positionFor = (bay, row, tier) => {
    const visualBay = mirrored ? bays - bay + 1 : bay
    return {
      left: margin + (visualBay - 1) * bayStep + (row - 1) * rowStepX,
      top: margin + (rows - row) * rowStepY + (tiers - tier) * tierStep,
      zIndex: (rows - row) * 100 + tier * 10 + visualBay,
    }
  }

  const occupiedCount = containers.length
  const slotWidth2D = is20 ? 110 : 168

  return (
    <section className="overflow-hidden rounded-2xl border bg-white shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b bg-gradient-to-r from-slate-900 to-slate-800 p-4 text-white">
        <div>
          <h3 className="font-bold tracking-tight">Block Yard Representation</h3>
          <p className="text-xs text-slate-300">Bay / Row / Tier operational layout · {occupiedCount} stored</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-lg bg-white/10 p-1">
            <button type="button" className={`rounded-md px-3 py-1.5 text-xs font-semibold ${mode === '2d' ? 'bg-white text-slate-900 shadow' : 'text-slate-200'}`} onClick={() => setMode('2d')}>
              <Grid3X3 className="mr-1 inline h-3.5 w-3.5" />2D View
            </button>
            <button type="button" className={`rounded-md px-3 py-1.5 text-xs font-semibold ${mode === '3d' ? 'bg-white text-slate-900 shadow' : 'text-slate-200'}`} onClick={() => setMode('3d')}>
              <Box className="mr-1 inline h-3.5 w-3.5" />3D View
            </button>
          </div>
          {mode === '3d' && (
            <>
              <button type="button" className="rounded-lg bg-white/10 p-2 hover:bg-white/20" onClick={() => setMirrored((v) => !v)} title="Rotate view"><RotateCcw className="h-4 w-4" /></button>
              <button type="button" className="rounded-lg bg-white/10 p-2 hover:bg-white/20" onClick={() => setZoom((v) => Math.min(1.5, Number((v + 0.1).toFixed(1))))} title="Zoom in"><ZoomIn className="h-4 w-4" /></button>
              <button type="button" className="rounded-lg bg-white/10 p-2 hover:bg-white/20" onClick={() => setZoom((v) => Math.max(0.6, Number((v - 0.1).toFixed(1))))} title="Zoom out"><ZoomOut className="h-4 w-4" /></button>
              <button type="button" className="rounded-lg bg-white/10 px-3 py-2 text-xs font-semibold hover:bg-white/20" onClick={() => { setZoom(1); setMirrored(false) }}>Reset View</button>
            </>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 border-b bg-slate-50 px-5 py-3 text-xs text-muted-foreground">
        <div className="flex flex-wrap gap-4">
          <span className="flex items-center gap-1.5"><span className="inline-block h-3 w-5 rounded-[2px] border border-black/50" style={{ background: RIBS('#1f4e9c') }} /> Stored container</span>
          <span className="flex items-center gap-1.5"><span className="inline-block h-3 w-5 rounded-[2px] border border-dashed border-slate-400 bg-white" /> Available slot</span>
          <span className="flex items-center gap-1.5"><span className="inline-block h-3 w-5 rounded-[2px] border border-black/30" style={{ background: RIBS('#d8dee6') }} /> Reefer</span>
          <span className="flex items-center gap-1.5"><span className="inline-block h-2 w-8 rounded-full" style={{ backgroundColor: block.color }} /> Block accent</span>
        </div>
        <span className="font-semibold">{bays} Bays × {rows} Rows × {tiers} Tiers · {block.containerSize}</span>
      </div>

      {mode === '2d' ? (
        <div className="overflow-x-auto bg-[radial-gradient(circle_at_1px_1px,#e2e8f0_1px,transparent_0)] [background-size:18px_18px] p-5">
          <div style={{ minWidth: bays * (slotWidth2D + 8) }}>
            {Array.from({ length: tiers }, (_, i) => tiers - i).map((tier) => (
              <div key={tier} className="mb-4">
                <div className="mb-1.5 flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  <span className="rounded bg-slate-800 px-2 py-0.5 text-white">Tier {tier}</span>
                  <span className="h-px flex-1 bg-slate-200" />
                </div>
                <div className="space-y-2">
                  {Array.from({ length: rows }, (_, i) => i + 1).map((row) => (
                    <div key={row} className="flex items-center gap-2">
                      <span className="w-7 shrink-0 text-center text-[10px] font-bold text-slate-400">R{row}</span>
                      <div className="grid flex-1 gap-2" style={{ gridTemplateColumns: `repeat(${bays}, minmax(${slotWidth2D}px, 1fr))` }}>
                        {Array.from({ length: bays }, (_, i) => i + 1).map((bay) => {
                          const container = byPosition.get(`${bay}-${row}-${tier}`)
                          return (
                            <ContainerSlot2D
                              key={`${bay}-${row}-${tier}`}
                              container={container}
                              bay={bay}
                              row={row}
                              tier={tier}
                              is20={is20}
                              highlighted={container?.id === highlightedId}
                              onSelect={onSelect}
                            />
                          )
                        })}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="ml-9 mt-1 h-[3px] rounded-full bg-slate-300" />
              </div>
            ))}
            <div className="ml-9 grid gap-2 text-center text-[10px] font-bold text-slate-400" style={{ gridTemplateColumns: `repeat(${bays}, minmax(${slotWidth2D}px, 1fr))` }}>
              {Array.from({ length: bays }, (_, i) => <span key={i}>BAY {String(i + 1).padStart(2, '0')}</span>)}
            </div>
          </div>
        </div>
      ) : (
        <div className="overflow-auto p-4 sm:p-6">
          <div className="relative overflow-auto rounded-xl border bg-gradient-to-b from-sky-50 via-slate-100 to-slate-200 shadow-inner" style={{ minHeight: 420 }}>
            <div
              className="relative origin-top-left transition-transform duration-200"
              style={{ width: canvasWidth, height: canvasHeight, transform: `scale(${zoom})`, transformOrigin: 'top left' }}
            >
              {/* yard asphalt */}
              <div
                className="absolute rounded-xl"
                style={{
                  left: margin - 30, right: margin - 30, top: margin + 20, bottom: margin - 22,
                  background: 'repeating-linear-gradient(135deg, rgba(100,116,139,.10) 0 2px, transparent 2px 9px), linear-gradient(180deg,#cbd5e1,#b6c2d1)',
                  boxShadow: 'inset 0 0 0 2px rgba(255,255,255,.5)',
                }}
              />
              <div className="absolute left-5 top-4 rounded-lg border bg-white/95 px-3 py-2 text-[10px] font-bold shadow-sm" style={{ zIndex: 9999, borderLeft: `4px solid ${block.color}` }}>
                {block.name} · {block.containerSize}
              </div>

              {cells.map(({ bay, row, tier, container }) => {
                const position = positionFor(bay, row, tier)
                const label = container
                  ? `${container.containerNumber} · Bay ${bay} · Row ${row} · Tier ${tier}`
                  : `Available · Bay ${bay} · Row ${row} · Tier ${tier}`
                return (
                  <div key={`${bay}-${row}-${tier}`} className="absolute" style={position}>
                    <ContainerBox3D
                      container={container}
                      blockColor={block.color}
                      highlighted={container?.id === highlightedId}
                      label={label}
                      empty={!container}
                      is20={is20}
                      onClick={() => container && onSelect(container)}
                    />
                  </div>
                )
              })}

              <div className="absolute rounded-full" style={{ left: margin - 12, top: canvasHeight - margin + 16, width: Math.max(180, canvasWidth - margin * 1.5), height: 6, backgroundColor: block.color, opacity: 0.8 }} />
            </div>
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            Click an occupied container to open its details. Empty positions remain visible as outlined slots.
          </p>
        </div>
      )}
    </section>
  )
}
