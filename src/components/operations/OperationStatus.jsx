const labels = {
  BOOKING_SUBMITTED: 'Booking Submitted', BOOKING_APPROVED: 'Booking Approved', READY_FOR_GATE_IN: 'Ready for Gate-in',
  GATE_IN_PAYMENT_SUBMITTED: 'Payment Submitted', GATE_IN: 'Gate-in', INVENTORY: 'Inventory', STORAGE: 'Storage',
  GATE_OUT_REQUESTED: 'Gate-out Requested', GATE_OUT_PAYMENT_PENDING: 'Waiting for Payment',
  GATE_OUT_PAYMENT_SUBMITTED: 'Payment Submitted', GATE_OUT_APPROVED: 'Gate-out Approved',
  READY_FOR_RELEASE: 'Ready for Release', CONTAINER_RELEASED: 'Released',
}

const tones = {
  BOOKING_SUBMITTED: 'bg-amber-50 text-amber-700 ring-amber-200',
  READY_FOR_GATE_IN: 'bg-blue-50 text-blue-700 ring-blue-200',
  GATE_IN_PAYMENT_SUBMITTED: 'bg-indigo-50 text-indigo-700 ring-indigo-200',
  GATE_IN: 'bg-cyan-50 text-cyan-700 ring-cyan-200', INVENTORY: 'bg-cyan-50 text-cyan-700 ring-cyan-200',
  STORAGE: 'bg-violet-50 text-violet-700 ring-violet-200', GATE_OUT_REQUESTED: 'bg-orange-50 text-orange-700 ring-orange-200',
  GATE_OUT_PAYMENT_PENDING: 'bg-amber-50 text-amber-700 ring-amber-200', GATE_OUT_PAYMENT_SUBMITTED: 'bg-indigo-50 text-indigo-700 ring-indigo-200',
  GATE_OUT_APPROVED: 'bg-emerald-50 text-emerald-700 ring-emerald-200', READY_FOR_RELEASE: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  CONTAINER_RELEASED: 'bg-slate-100 text-slate-700 ring-slate-200',
}

export function OperationStatus({ stage }) {
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${tones[stage] || 'bg-slate-50 text-slate-600 ring-slate-200'}`}>{labels[stage] || stage?.replaceAll('_', ' ') || '—'}</span>
}

export function formatMoney(value) {
  return new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(Number(value || 0))
}

export function formatDateTime(value) {
  if (!value) return '—'
  return new Intl.DateTimeFormat('en-PH', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value))
}
