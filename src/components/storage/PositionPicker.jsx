import { useEffect, useMemo, useState } from 'react'
import { Button } from '@/components/ui/button.jsx'

function buildKey(bay, row, tier) {
  return `${bay}-${row}-${tier}`
}

function findFirstAvailable(block, occupiedKeys, tier = 1) {
  const totalRows = Number(block?.layout?.rows || 0)
  const totalBays = Number(block?.layout?.bays || 0)

  for (let row = 1; row <= totalRows; row += 1) {
    for (let bay = 1; bay <= totalBays; bay += 1) {
      if (!occupiedKeys.has(buildKey(bay, row, tier))) {
        return { bay, row, tier }
      }
    }
  }

  return { bay: 1, row: 1, tier }
}

function slotCode({ bay, row, tier }) {
  return `B${String(bay).padStart(2, '0')}-R${String(row).padStart(2, '0')}-T${String(tier).padStart(2, '0')}`
}

export default function PositionPicker({ block, occupied = [], title = 'Assign Container', onCancel, onConfirm, busy }) {
  const occupiedKeys = useMemo(
    () => new Set(occupied.map((container) => buildKey(container.storage?.bay, container.storage?.row, container.storage?.tier))),
    [occupied],
  )

  const [position, setPosition] = useState(() => findFirstAvailable(block, occupiedKeys, 1))

  useEffect(() => {
    setPosition((current) => {
      const currentKey = buildKey(current.bay, current.row, current.tier)
      const tier = current.tier || 1
      if (!occupiedKeys.has(currentKey)) return current
      return findFirstAvailable(block, occupiedKeys, tier)
    })
  }, [block, occupiedKeys])

  const currentKey = buildKey(position.bay, position.row, position.tier)
  const taken = occupiedKeys.has(currentKey)
  const availableOnTier = useMemo(() => {
    const available = []
    const totalRows = Number(block?.layout?.rows || 0)
    const totalBays = Number(block?.layout?.bays || 0)
    for (let row = 1; row <= totalRows; row += 1) {
      for (let bay = 1; bay <= totalBays; bay += 1) {
        const key = buildKey(bay, row, position.tier)
        if (!occupiedKeys.has(key)) available.push({ bay, row, tier: position.tier })
      }
    }
    return available
  }, [block, occupiedKeys, position.tier])

  const hasAvailability = availableOnTier.length > 0

  const totalBays = Number(block?.layout?.bays || 0)
  const totalRows = Number(block?.layout?.rows || 0)
  const totalTiers = Number(block?.layout?.tiers || 0)

  const handleTierChange = (tier) => {
    setPosition((current) => {
      const nextKey = buildKey(current.bay, current.row, tier)
      if (!occupiedKeys.has(nextKey)) return { ...current, tier }
      return findFirstAvailable(block, occupiedKeys, tier)
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
      <div className="w-full max-w-6xl rounded-2xl border bg-white shadow-2xl">
        <div className="border-b p-5">
          <h3 className="text-lg font-bold">{title}</h3>
          <p className="text-sm text-muted-foreground">Choose a storage slot inside {block.name}. The grid below shows the actual 2D slot layout for the selected tier.</p>
        </div>

        <div className="space-y-5 p-5">
          <div className="grid gap-4 lg:grid-cols-[320px_minmax(0,1fr)]">
            <div className="space-y-4">
              <div className="rounded-2xl border bg-slate-50 p-4">
                <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Selected Storage Slot</div>
                <div className="mt-2 text-2xl font-black">{slotCode(position)}</div>
                <div className={`mt-2 text-sm font-medium ${taken ? 'text-red-700' : 'text-emerald-700'}`}>
                  {taken ? 'This slot is occupied.' : 'This slot is available.'}
                </div>
              </div>

              <div className="rounded-2xl border p-4">
                <div className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Tier / Level</div>
                <div className="flex flex-wrap gap-2">
                  {Array.from({ length: totalTiers }, (_, index) => index + 1).map((tier) => {
                    const active = position.tier === tier
                    return (
                      <button
                        key={tier}
                        type="button"
                        onClick={() => handleTierChange(tier)}
                        className={`rounded-lg border px-3 py-2 text-sm font-semibold transition ${active ? 'border-primary bg-primary text-white' : 'border-slate-200 bg-white text-slate-700 hover:border-primary/40 hover:bg-slate-50'}`}
                      >
                        Tier {String(tier).padStart(2, '0')}
                      </button>
                    )
                  })}
                </div>
              </div>

              <div className="rounded-2xl border p-4">
                <div className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Legend</div>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2"><span className="h-4 w-4 rounded border border-emerald-300 bg-emerald-50" />Available slot</div>
                  <div className="flex items-center gap-2"><span className="h-4 w-4 rounded border border-red-300 bg-red-50" />Occupied slot</div>
                  <div className="flex items-center gap-2"><span className="h-4 w-4 rounded border border-primary bg-primary/15" />Selected slot</div>
                </div>
              </div>

              <div className="rounded-2xl border p-4 text-sm">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <div className="text-xs uppercase text-muted-foreground">Bays</div>
                    <div className="text-lg font-bold">{totalBays}</div>
                  </div>
                  <div>
                    <div className="text-xs uppercase text-muted-foreground">Rows</div>
                    <div className="text-lg font-bold">{totalRows}</div>
                  </div>
                  <div>
                    <div className="text-xs uppercase text-muted-foreground">Tiers</div>
                    <div className="text-lg font-bold">{totalTiers}</div>
                  </div>
                  <div>
                    <div className="text-xs uppercase text-muted-foreground">Available</div>
                    <div className="text-lg font-bold">{availableOnTier.length}</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="overflow-hidden rounded-2xl border">
              <div className="border-b bg-slate-50 px-4 py-3">
                <div className="font-semibold">2D Slot Map</div>
                <div className="text-xs text-muted-foreground">Click an available slot to assign the container. Viewing Tier {String(position.tier).padStart(2, '0')}.</div>
              </div>

              <div className="overflow-auto p-4">
                {!hasAvailability && (
                  <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                    No available slots on this tier. Please choose another tier.
                  </div>
                )}

                <div
                  className="grid min-w-[720px] gap-2"
                  style={{ gridTemplateColumns: `90px repeat(${totalBays}, minmax(96px, 1fr))` }}
                >
                  <div className="sticky left-0 z-10 rounded-lg bg-white p-2 text-xs font-bold uppercase text-muted-foreground">Row / Bay</div>
                  {Array.from({ length: totalBays }, (_, index) => index + 1).map((bay) => (
                    <div key={`head-${bay}`} className="rounded-lg bg-slate-100 p-2 text-center text-xs font-bold uppercase text-slate-600">
                      Bay {String(bay).padStart(2, '0')}
                    </div>
                  ))}

                  {Array.from({ length: totalRows }, (_, rowIndex) => {
                    const row = rowIndex + 1
                    return [
                      <div key={`row-label-${row}`} className="sticky left-0 z-10 flex min-h-[88px] items-center rounded-lg bg-slate-100 px-3 text-xs font-bold uppercase text-slate-600">
                        Row {String(row).padStart(2, '0')}
                      </div>,
                      ...Array.from({ length: totalBays }, (_, bayIndex) => {
                        const bay = bayIndex + 1
                        const key = buildKey(bay, row, position.tier)
                        const isOccupied = occupiedKeys.has(key)
                        const isSelected = position.bay === bay && position.row === row

                        return (
                          <button
                            key={key}
                            type="button"
                            disabled={isOccupied}
                            onClick={() => setPosition({ bay, row, tier: position.tier })}
                            className={`min-h-[88px] rounded-xl border p-3 text-left transition ${isOccupied ? 'cursor-not-allowed border-red-200 bg-red-50 text-red-700' : isSelected ? 'border-primary bg-primary/10 text-primary shadow-sm' : 'border-emerald-200 bg-emerald-50/60 text-slate-800 hover:border-primary/40 hover:bg-white'}`}
                          >
                            <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Slot</div>
                            <div className="mt-1 text-sm font-black">B{String(bay).padStart(2, '0')} · R{String(row).padStart(2, '0')}</div>
                            <div className={`mt-2 text-xs font-semibold ${isOccupied ? 'text-red-700' : isSelected ? 'text-primary' : 'text-emerald-700'}`}>
                              {isOccupied ? 'Occupied' : isSelected ? 'Selected' : 'Available'}
                            </div>
                          </button>
                        )
                      }),
                    ]
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 border-t p-4">
          <Button variant="outline" onClick={onCancel}>Cancel</Button>
          <Button disabled={busy || taken || !hasAvailability} onClick={() => onConfirm(position)}>
            {busy ? 'Saving...' : 'Confirm Slot'}
          </Button>
        </div>
      </div>
    </div>
  )
}
