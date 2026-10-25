// Static sample data for the Dashboard. Every value shown on the Dashboard comes from
// this file, so it can be swapped for API responses later without touching components.

export const dashboardMeta = {
  dateLabel: "October 25, 2026",
  lastUpdated: "10:30 AM",
}

export const dashboardStats = {
  receivedToday: 128,
  receivedChange: 12,

  releasedToday: 96,
  releasedChange: 5,

  currentInventory: 1842,

  totalCapacity: 2400,
  availableCapacity: 558,
  occupancyRate: 76.8,

  revenueToday: 428750,
  revenueTodayChange: 8.4,

  revenueMonthToDate: 8725400,
  revenueMonthChange: 11.2,

  overstayingContainers: 43,
  criticalOverstaying: 12,
}

export const revenueTrend = [
  { day: "Oct 19", revenue: 312500 },
  { day: "Oct 20", revenue: 356200 },
  { day: "Oct 21", revenue: 338750 },
  { day: "Oct 22", revenue: 401300 },
  { day: "Oct 23", revenue: 389900 },
  { day: "Oct 24", revenue: 395600 },
  { day: "Oct 25", revenue: 428750 },
]

export const containerMovement = [
  { day: "Oct 19", received: 104, released: 91 },
  { day: "Oct 20", received: 117, released: 102 },
  { day: "Oct 21", received: 98, released: 110 },
  { day: "Oct 22", received: 132, released: 108 },
  { day: "Oct 23", received: 121, released: 114 },
  { day: "Oct 24", received: 114, released: 101 },
  { day: "Oct 25", received: 128, released: 96 },
]

export const topCustomers = [
  { name: "Pacific Star Logistics", containers: 286, revenue: 1284500 },
  { name: "Manila Freight Solutions", containers: 241, revenue: 1038200 },
  { name: "HarborLink Transport", containers: 198, revenue: 892300 },
  { name: "Luzon Cargo Services", containers: 174, revenue: 754900 },
  { name: "PrimePort Logistics", containers: 139, revenue: 648500 },
]

export const shippingLineActivity = [
  { name: "Maersk", inbound: 82, outbound: 61, total: 143 },
  { name: "CMA CGM", inbound: 67, outbound: 58, total: 125 },
  { name: "Evergreen", inbound: 54, outbound: 49, total: 103 },
  { name: "ONE", inbound: 46, outbound: 42, total: 88 },
  { name: "COSCO", inbound: 39, outbound: 35, total: 74 },
]
