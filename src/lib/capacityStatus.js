// Yard occupancy bands: 0-69 Normal, 70-84 Moderate, 85-94 High, 95+ Critical.
// `bar` is the fill color of the occupancy meter; `badge` styles the status pill.
const bands = [
  {
    min: 95,
    label: "Critical",
    bar: "#d90000",
    badge: "bg-danger-50 text-danger-600 ring-danger-600/20",
  },
  {
    min: 85,
    label: "High",
    bar: "#ea580c",
    badge: "bg-orange-50 text-orange-700 ring-orange-600/20",
  },
  {
    min: 70,
    label: "Moderate",
    bar: "#d97706",
    badge: "bg-amber-50 text-amber-700 ring-amber-600/25",
  },
  {
    min: 0,
    label: "Normal",
    bar: "#300bc4",
    badge: "bg-brand-50 text-brand-700 ring-brand-600/20",
  },
]

export const capacityThresholds = [70, 85, 95]

export function getCapacityStatus(occupancyRate) {
  return bands.find((band) => occupancyRate >= band.min) ?? bands[bands.length - 1]
}
