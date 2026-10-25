import { useEffect, useMemo, useState } from 'react'
import { paymentTypeApi } from '@/lib/paymentTypeApi.js'

export default function PaymentMethodSelect({ value, onChange, disabled = false, className = '' }) {
  const [rows, setRows] = useState([])
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    paymentTypeApi.active().then((result) => {
      if (!active) return
      const next = result.data || []
      setRows(next)
      if (!value && next[0]) onChange?.(next[0].code, next[0])
    }).catch((e) => active && setError(e.message))
    return () => { active = false }
  }, [])

  const selected = useMemo(() => rows.find((x) => x.code === value), [rows, value])

  return <div className={className}>
    <select
      value={value || ''}
      disabled={disabled}
      onChange={(e) => {
        const item = rows.find((x) => x.code === e.target.value)
        onChange?.(e.target.value, item)
      }}
      className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-60"
    >
      <option value="" disabled>Select payment type</option>
      {rows.map((row) => <option key={row.id} value={row.code}>{row.name}</option>)}
    </select>
    {selected && <div className="mt-1.5 text-xs text-muted-foreground">
      <p>{selected.requiresReference ? 'Reference number required' : 'Reference number not required'}</p>
      {selected.code !== 'CASH' && (selected.bankName || selected.accountName || selected.accountNumber) && (
        <div className="mt-2 rounded-lg border border-border bg-muted/35 px-3 py-2">
          <div className="font-semibold text-foreground">{selected.bankName || selected.name}</div>
          <div>{selected.accountName || '—'}</div>
          <div className="font-mono">{selected.accountNumber || '—'}</div>
        </div>
      )}
    </div>}
    {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
  </div>
}
