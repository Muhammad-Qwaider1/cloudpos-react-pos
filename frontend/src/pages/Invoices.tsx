import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../store/authStore';
import api from '../api/client';
import { Receipt, Search, Eye, Printer, ShieldAlert } from 'lucide-react';

export default function Invoices() {
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selected, setSelected] = useState<any>(null);
  const [voidReason, setVoidReason] = useState('');
  const [voiding, setVoiding] = useState(false);

  const canVoid = ['ADMIN', 'SUPERVISOR'].includes(user?.role || '');

  useEffect(() => {
    api.get('/invoices?limit=200').then((res) => {
      setInvoices(res.data.data || res.data || []);
    }).finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return invoices.filter((i) =>
      (statusFilter === 'all' || i.status === statusFilter) &&
      (!q || i.invoice_number?.toLowerCase().includes(q) || i.customer_name?.toLowerCase().includes(q)),
    );
  }, [invoices, search, statusFilter]);

  const doVoid = async () => {
    if (!voidReason.trim() || !selected) return;
    setVoiding(true);
    try {
      await api.post(`/invoices/${selected.id}/void`, { reason: voidReason });
      setInvoices((prev) => prev.map((i) => (i.id === selected.id ? { ...i, status: 'VOIDED', void_reason: voidReason } : i)));
      setSelected(null);
      setVoidReason('');
    } finally {
      setVoiding(false);
    }
  };

  return (
    <div className="p-6 space-y-4">
      <div>
        <h2 className="text-2xl font-heading font-bold">{t('invoices')}</h2>
        <p className="text-muted-foreground text-sm mt-0.5">{invoices.length} total</p>
      </div>

      <div className="flex flex-wrap gap-2 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search..." className="w-full pl-9 h-10 rounded-lg border bg-card focus:outline-none focus:ring-2 focus:ring-ring" />
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="h-10 rounded-lg border px-3 bg-card">
          <option value="all">All Status</option>
          <option value="COMPLETED">Completed</option>
          <option value="VOIDED">Voided</option>
          <option value="RETURNED">Returned</option>
        </select>
      </div>

      <div className="bg-card border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-muted-foreground">
              <tr>
                <th className="text-left font-medium px-4 py-3">Invoice #</th>
                <th className="text-left font-medium px-4 py-3">Customer</th>
                <th className="text-left font-medium px-4 py-3">Date</th>
                <th className="text-right font-medium px-4 py-3">Total</th>
                <th className="text-center font-medium px-4 py-3">Status</th>
                <th className="text-right font-medium px-4 py-3">{t('actions')}</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="text-center py-10 text-muted-foreground">{t('loading')}</td></tr>
              ) : filtered.map((inv) => (
                <tr key={inv.id} className="border-t hover:bg-muted/30">
                  <td className="px-4 py-3 font-mono font-medium">{inv.invoice_number}</td>
                  <td className="px-4 py-3">{inv.customer_name || 'Walk-in'}</td>
                  <td className="px-4 py-3 text-muted-foreground">{new Date(inv.created_at).toLocaleDateString()}</td>
                  <td className="px-4 py-3 text-right font-semibold">{inv.total?.toFixed(2)}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${inv.status === 'COMPLETED' ? 'bg-emerald-500/15 text-emerald-600' : inv.status === 'VOIDED' ? 'bg-destructive/15 text-destructive' : 'bg-amber-500/15 text-amber-600'}`}>{inv.status}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end">
                      <button onClick={() => setSelected(inv)} className="h-8 w-8 rounded-lg hover:bg-accent flex items-center justify-center"><Eye className="h-4 w-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!loading && filtered.length === 0 && <div className="py-10 text-center text-muted-foreground"><Receipt className="h-10 w-10 mx-auto mb-2 opacity-30" />{t('noData')}</div>}
      </div>

      {/* Detail Modal */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-card rounded-2xl shadow-2xl w-full max-w-lg p-6">
            <h3 className="font-heading font-semibold text-lg mb-4">Invoice {selected.invoice_number}</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Customer</span><span>{selected.customer_name}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Date</span><span>{new Date(selected.created_at).toLocaleString()}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Status</span><span>{selected.status}</span></div>
              {selected.void_reason && <div className="text-destructive">Void: {selected.void_reason}</div>}
              <div className="flex justify-between font-bold pt-2 border-t"><span>{t('total')}</span><span>{selected.total?.toFixed(2)}</span></div>
            </div>
            {canVoid && selected.status === 'COMPLETED' && (
              <div className="border-t mt-4 pt-4 space-y-2">
                <label className="flex items-center gap-1.5 text-destructive text-sm font-medium"><ShieldAlert className="h-4 w-4" /> {t('voidInvoice')}</label>
                <input value={voidReason} onChange={(e) => setVoidReason(e.target.value)} placeholder={t('voidReason')} className="w-full h-10 rounded-lg border px-3 bg-background" />
                <button onClick={doVoid} disabled={voiding || !voidReason.trim()} className="bg-destructive text-destructive-foreground rounded-lg px-4 h-10 text-sm font-medium hover:opacity-90 disabled:opacity-50">
                  {voiding ? t('processing') : t('void')}
                </button>
              </div>
            )}
            <div className="flex gap-2 mt-4">
              <button onClick={() => window.print()} className="flex-1 h-11 rounded-lg border font-medium hover:bg-accent flex items-center justify-center gap-2"><Printer className="h-4 w-4" /> {t('print')}</button>
              <button onClick={() => setSelected(null)} className="flex-1 h-11 rounded-lg bg-primary text-primary-foreground font-semibold hover:opacity-90">{t('close')}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}