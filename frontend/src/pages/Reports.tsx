import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import api from "../api/client";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { DollarSign, Receipt, TrendingUp, ShoppingBag } from 'lucide-react';

export default function Reports() {
  const { t } = useTranslation();
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/invoices?limit=500&status=COMPLETED').then((res) => {
      setInvoices(res.data.data || res.data || []);
    }).finally(() => setLoading(false));
  }, []);

  const { daily, totals } = useMemo(() => {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() - i);
      days.push({ date: d, label: d.toLocaleDateString('en', { weekday: 'short' }), sales: 0, count: 0 });
    }
    invoices.forEach((inv) => {
      const d = new Date(inv.created_at); d.setHours(0, 0, 0, 0);
      const slot = days.find((s) => s.date.getTime() === d.getTime());
      if (slot) { slot.sales += inv.total || 0; slot.count += 1; }
    });
    const tt = {
      sales: invoices.reduce((s, i) => s + (i.total || 0), 0),
      tax: invoices.reduce((s, i) => s + (i.tax_amount || 0), 0),
      count: invoices.length,
      avg: invoices.length ? invoices.reduce((s, i) => s + (i.total || 0), 0) / invoices.length : 0,
    };
    return { daily: days, totals: tt };
  }, [invoices]);

  if (loading) return <div className="flex items-center justify-center h-full"><div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" /></div>;

  const cards = [
    { icon: DollarSign, label: t('todaysSales'), value: totals.sales.toFixed(2), color: 'bg-emerald-500/15 text-emerald-600' },
    { icon: Receipt, label: t('todaysInvoices'), value: totals.count, color: 'bg-blue-500/15 text-blue-600' },
    { icon: TrendingUp, label: 'Avg. Sale', value: totals.avg.toFixed(2), color: 'bg-violet-500/15 text-violet-600' },
    { icon: ShoppingBag, label: 'Tax Collected', value: totals.tax.toFixed(2), color: 'bg-amber-500/15 text-amber-600' },
  ];

  return (
    <div className="p-6 space-y-6">
      <div>
        <h2 className="text-2xl font-heading font-bold">{t('reports')}</h2>
        <p className="text-muted-foreground text-sm mt-0.5">Last 7 days performance</p>
      </div>

      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        {cards.map((c, i) => {
          const Icon = c.icon;
          return (
            <div key={i} className="bg-card border rounded-xl p-5">
              <div className="flex items-start justify-between">
                <div><p className="text-sm text-muted-foreground">{c.label}</p><p className="text-2xl font-heading font-bold mt-1">{c.value}</p></div>
                <div className={`h-11 w-11 rounded-xl flex items-center justify-center ${c.color}`}><Icon className="h-5 w-5" /></div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="bg-card border rounded-xl p-5">
        <h3 className="font-heading font-semibold mb-4">Daily Sales</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={daily}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis dataKey="label" className="text-xs" />
            <YAxis className="text-xs" />
            <Tooltip cursor={{ fill: 'hsl(var(--muted))' }} formatter={(v: any) => v.toFixed(2)} />
            <Bar dataKey="sales" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}