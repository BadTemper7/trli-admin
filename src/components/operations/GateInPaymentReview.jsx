import { useCallback, useEffect, useState } from 'react';
import { CheckCircle2, Clock3, FileCheck2, ShieldAlert, XCircle } from 'lucide-react';
import { adminRequest } from '@/lib/adminApi.js';
import { openAdminFile } from '@/lib/adminFiles.js';
import { adminSocket } from '@/lib/adminSocket.js';
import { Button } from '@/components/ui/button.jsx';

const money = value => new Intl.NumberFormat('en-PH', {style:'currency',currency:'PHP'}).format(Number(value || 0));
const stamp = value => value ? new Date(value).toLocaleString('en-PH', {timeZone:'Asia/Manila',dateStyle:'medium',timeStyle:'short'}) : '—';

/**
 * Inline financial confirmation for Gate-in Processing. Uses the existing
 * authorized review endpoint; it NEVER records physical entry or inspection.
 */
export default function GateInPaymentReview({ booking, canReview, onReviewed }) {
  const bookingId = booking?.id;
  const [payment, setPayment] = useState(null);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [reason, setReason] = useState('');
  const [confirmed, setConfirmed] = useState(false);
  const status = booking?.gateIn?.payment?.status || 'PENDING';
  const invoice = booking?.gateInCharges;

  const reload = useCallback(async () => {
    if (!bookingId || !canReview || status === 'VERIFIED') {
      setPayment(null);
      return;
    }
    setLoading(true);
    try {
      const result = await adminRequest(`/admin/invoices/pending-payments?booking=${encodeURIComponent(bookingId)}`);
      setPayment((result.data?.items || []).find(item => String(item.booking) === String(bookingId)) || null);
      setError('');
    } catch (err) {
      setError(err.message || 'Unable to load pending payment.');
    } finally {
      setLoading(false);
    }
  }, [bookingId, canReview, status]);

  useEffect(() => {
    setPayment(null);
    setReason('');
    setConfirmed(false);
    setError('');
    reload();
  }, [reload]);

  useEffect(() => {
    if (!bookingId || !canReview) return undefined;
    const refresh = event => {
      if (!event?.id || String(event.id) === String(bookingId)) reload();
    };
    adminSocket.on('gate-in:updated', refresh);
    adminSocket.on('connect', reload);
    return () => {
      adminSocket.off('gate-in:updated', refresh);
      adminSocket.off('connect', reload);
    };
  }, [bookingId, canReview, reload]);

  const review = async decision => {
    if (!payment || busy || !canReview) return;
    if (decision === 'APPROVE' && !confirmed) {
      setError('Confirm that you independently checked the receiving account before verification.');
      return;
    }
    if (decision === 'REJECT' && !reason.trim()) {
      setError('Provide a rejection reason so the client can resubmit.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      await adminRequest(`/admin/invoices/payments/${payment._id}/review`, {
        method:'POST', body: JSON.stringify({decision, reason: reason.trim()}),
      });
      setPayment(null);
      setReason('');
      setConfirmed(false);
      onReviewed(decision);
    } catch (err) {
      setError(err.message || 'Payment review failed.');
      await reload();
    } finally {
      setBusy(false);
    }
  };

  if (status === 'VERIFIED') {
    return <div className="mt-3 flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
      <div><strong>Payment verified.</strong><p className="mt-1 text-xs">Invoice {invoice?.invoiceNumber || '—'} is paid. Complete the inspection and click Confirm Physical Gate-in once.</p></div>
    </div>;
  }

  return <div className="mt-3 space-y-3" aria-label="Gate-in payment verification">
    {error && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>}
    {!canReview && <p className="rounded-lg bg-amber-50 p-3 text-xs text-amber-800">Payment verification requires Gate-in processing permission.</p>}
    {loading && <div role="status" className="animate-pulse rounded-xl bg-muted p-4 text-sm">Loading submitted payment details…</div>}
    {!loading && !payment && <p className="rounded-lg bg-amber-50 p-3 text-xs leading-5 text-amber-800">
      {status === 'REJECTED' ? 'Payment was rejected. The client may resubmit the reference or proof.' : status === 'SUBMITTED' ? 'Client payment is recorded as submitted, but no pending verification entry was returned. Refresh the queue or check the booking before physical entry.' : 'Awaiting the client’s online payment reference or proof. Payment must be verified before confirming physical Gate-in.'}
    </p>}
    {!loading && payment && <div className="space-y-3 rounded-xl border border-primary/25 bg-primary/5 p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="flex items-center gap-2 text-xs font-bold text-primary"><Clock3 size={15}/> PENDING PAYMENT VERIFICATION</p>
        <span className="text-xs text-muted-foreground">Submitted {stamp(payment.createdAt)}</span>
      </div>
      <dl className="grid gap-3 text-xs sm:grid-cols-2">
        <div><dt className="text-muted-foreground">Invoice number</dt><dd className="break-all font-bold">{payment.invoice?.number || invoice?.invoiceNumber || '—'}</dd></div>
        <div><dt className="text-muted-foreground">Amount submitted</dt><dd className="font-bold">{money(payment.amount)}</dd></div>
        <div><dt className="text-muted-foreground">Method</dt><dd className="font-bold">{payment.method || '—'}</dd></div>
        <div><dt className="text-muted-foreground">Payment reference</dt><dd className="break-words font-bold">{payment.reference || 'Proof only (no reference)'}</dd></div>
      </dl>
      {(payment.receivingAccount?.accountNumber || payment.receivingAccount?.accountName) && <div className="rounded-lg border border-border bg-background p-3 text-xs">
        <p className="font-semibold">Receiving account</p>
        <p className="mt-1">{payment.receivingAccount.bankName || payment.method} · {payment.receivingAccount.accountName || '—'} · {payment.receivingAccount.accountNumber || '—'}</p>
      </div>}
      {Math.abs(Number(payment.amount || 0) - Number(invoice?.total || 0)) > 0.001 && <p role="alert" className="rounded-lg bg-red-50 p-2 text-xs text-red-700">Submitted amount does not match the invoice. Do not approve this payment.</p>}
      {payment.proof?.storedName ? <button type="button" className="inline-flex items-center gap-2 text-sm font-semibold text-primary underline underline-offset-2" onClick={() => openAdminFile(`/admin/invoices/payments/${payment._id}/proof`).catch(err => setError(err.message))}><FileCheck2 size={16}/> View submitted payment proof</button> : <p className="flex items-start gap-2 rounded-lg bg-amber-50 p-3 text-xs text-amber-800"><ShieldAlert size={16} className="shrink-0" />Reference-only payment. Cross-check the actual receiving account before approval.</p>}
      {canReview && <div className="space-y-3 border-t border-border pt-3">
        <label className="flex cursor-pointer items-start gap-2 text-xs leading-5"><input type="checkbox" className="mt-1" checked={confirmed} onChange={event => setConfirmed(event.target.checked)} disabled={busy}/><span>I verified the amount and evidence against the receiving bank/e-wallet transaction records.</span></label>
        <label className="block text-xs font-medium">Reason for rejection (required only when rejecting)<textarea value={reason} onChange={event => setReason(event.target.value)} disabled={busy} maxLength={800} placeholder="Explain the issue so the client can resubmit" className="mt-1 min-h-20 w-full rounded-lg border border-input bg-background p-3 text-sm" /></label>
        <div className="grid gap-2 sm:grid-cols-2">
          <Button type="button" disabled={busy || !confirmed || Math.abs(Number(payment.amount || 0) - Number(invoice?.total || 0)) > 0.001} onClick={() => review('APPROVE')}><CheckCircle2 size={16}/> {busy ? 'Saving…' : 'Verify Payment'}</Button>
          <Button type="button" variant="outline" disabled={busy || !reason.trim()} onClick={() => review('REJECT')} className="border-red-200 text-red-700"><XCircle size={16}/> Reject Payment</Button>
        </div>
        <p className="text-xs text-muted-foreground">Verification marks the invoice paid and issues a receipt. Complete the inspection and use Confirm Physical Gate-in to record physical entry.</p>
      </div>}
    </div>}
  </div>;
}
