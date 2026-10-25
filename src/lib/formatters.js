const numberFormat = new Intl.NumberFormat("en-PH")

const currencyFormat = new Intl.NumberFormat("en-PH", {
  style: "currency",
  currency: "PHP",
  maximumFractionDigits: 0,
})

const compactCurrencyFormat = new Intl.NumberFormat("en-PH", {
  style: "currency",
  currency: "PHP",
  notation: "compact",
  maximumFractionDigits: 0,
})

export function formatNumber(value) {
  return numberFormat.format(value)
}

export function formatCurrency(value) {
  return currencyFormat.format(value)
}

// Short peso labels for chart axes, e.g. ₱400K.
export function formatCompactCurrency(value) {
  return compactCurrencyFormat.format(value)
}

export function formatPercent(value, fractionDigits = 0) {
  return `${value.toFixed(fractionDigits)}%`
}

// "+12%" / "-3.5%"
export function formatSignedPercent(value, fractionDigits = 0) {
  const sign = value > 0 ? "+" : value < 0 ? "-" : ""
  return `${sign}${Math.abs(value).toFixed(fractionDigits)}%`
}
