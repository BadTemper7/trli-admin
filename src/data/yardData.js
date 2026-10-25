export const DEFAULT_BLOCKS = [
  { id: "alpha", name: "ALPHA", size: "40'", capacity: 84, occupied: 61, color: "#2f7d32", x: 205, y: 210, w: 190, h: 135, rows: 4, bays: 6 },
  { id: "bravo", name: "BRAVO", size: "40'", capacity: 84, occupied: 70, color: "#1769aa", x: 410, y: 210, w: 160, h: 135, rows: 4, bays: 5 },
  { id: "charlie", name: "CHARLIE", size: "20'", capacity: 96, occupied: 72, color: "#c65d16", x: 585, y: 210, w: 175, h: 135, rows: 4, bays: 6 },
  { id: "echo", name: "ECHO", size: "40'", capacity: 280, occupied: 206, color: "#087a78", x: 205, y: 395, w: 555, h: 145, rows: 5, bays: 14 },
  { id: "delta", name: "DELTA", size: "40'", capacity: 140, occupied: 99, color: "#5b3a96", x: 205, y: 585, w: 180, h: 155, rows: 5, bays: 6 },
  { id: "foxtrot", name: "FOXTROT", size: "20'", capacity: 160, occupied: 118, color: "#b88909", x: 405, y: 585, w: 185, h: 155, rows: 5, bays: 6 },
  { id: "golf", name: "GOLF", size: "REEFER / SPECIAL", capacity: 40, occupied: 31, color: "#b82f67", x: 610, y: 585, w: 150, h: 155, rows: 5, bays: 5 },
]

export const STATUS_COLORS = {
  LOADED: "#2f6edb",
  EMPTY: "#94a3b8",
  RESERVED: "#f59e0b",
  INSPECTION: "#eab308",
  HOLD: "#ef4444",
  REEFER: "#7c3aed",
}

const statusPool = ["LOADED", "LOADED", "LOADED", "EMPTY", "RESERVED", "INSPECTION", "HOLD", "REEFER"]

export function createContainers(blocks) {
  let serial = 4821000
  const containers = []
  blocks.forEach((block, blockIndex) => {
    const count = Math.min(block.rows * block.bays, Math.max(8, Math.round((block.occupied / Math.max(block.capacity, 1)) * block.rows * block.bays)))
    for (let i = 0; i < count; i += 1) {
      const row = Math.floor(i / block.bays) + 1
      const bay = (i % block.bays) + 1
      serial += 7 + blockIndex
      const status = statusPool[(i + blockIndex * 2) % statusPool.length]
      containers.push({
        id: `${block.id}-${i}`,
        number: `MSCU ${serial} ${i % 10}`,
        blockId: block.id,
        bay,
        row,
        tier: (i % 4) + 1,
        type: block.size.includes("20") ? "20GP" : block.id === "golf" ? "40RF" : i % 3 === 0 ? "40HC" : "40GP",
        status,
        arrival: `24 Oct 2026`,
        dwell: `${(i % 7) + 1}d ${(i * 3) % 24}h`,
        cargoStatus: i % 5 === 0 ? "Pending" : "Cleared",
      })
    }
  })
  return containers
}
