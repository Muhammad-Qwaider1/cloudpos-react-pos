import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../store/authStore';
import api from '../api/client';
import { Link } from 'react-router-dom';
import { DollarSign, Receipt, Package, AlertTriangle, TrendingUp, ShoppingCart } from 'lucide-react';

export default function Dashboard() {
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const [stats, setStats] = useState({ sales: 0, invoices: 0, products: 0, lowStock: 0, recent: [] as any[] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    Promise.all([
      api.get('/invoices?limit=50').catch(() => ({ data: { data: [] } })),
      api.get('/products').catch(() => ({ data: [] })),
    ]).then(([invRes, prodRes]) => {
      const invoices = invRes.data.data || invRes.data || [];
      const products = prodRes.data || [];
      const todays = invoices.filter((i: any) => new Date(i.created_at) >= todayStart);
      setStats({
        sales: todays.reduce((s: number, i: any) => s + (i.total || 0), 0),
        invoices: todays.length,
        products: products.length,
        lowStock: products.filter((p: any) => p.stock_quantity <= (p.min_stock_alert || 5)).length,
        recent: invoices.slice(0, 6),
      });
    }).finally(() => setLoading(false));
  }, []);

  const role = user?.role || 'CASHIER';
  const canSeeFinance = ['ADMIN', 'SUPERVISOR'].includes(role);

  if (loading)
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" />
      </div>
    );

  const cards = [
    canSeeFinance && { icon: DollarSign, label: t('todaysSales'), value: stats.sales.toFixed(2), color: 'bg-emerald-500/15 text-emerald-600', to: '/pos' },
    canSeeFinance && { icon: Receipt, label: t('todaysInvoices'), value: stats.invoices, color: 'bg-blue-500/15 text-blue-600', to: '/invoices' },
    { icon: Package, label: t('totalProducts'), value: stats.products, color: 'bg-violet-500/15 text-violet-600', to: '/inventory' },
    { icon: AlertTriangle, label: t('lowStockItems'), value: stats.lowStock, color: 'bg-amber-500/15 text-amber-600', to: '/inventory' },
  ].filter(Boolean) as any[];

  return (
    <div className="p-6 space-y-6">
      <div>
        <h2 className="text-2xl font-heading font-bold">{t('welcome')}, {user?.full_name?.split(' ')[0]}</h2>
      </div>

      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        {cards.map((c: any, i) => {
          const Icon = c.icon;
          return (
            <Link key={i} to={c.to}>
              <div className="bg-card border rounded-xl p-5 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{c.label}</p>
                    <p className="text-2xl font-heading font-bold mt-1">{c.value}</p>
                  </div>
                  <div className={`h-11 w-11 rounded-xl flex items-center justify-center ${c.color}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Recent Invoices */}
        <div className="lg:col-span-2 bg-card border rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-heading font-semibold">{t('recentInvoices')}</h3>
            {canSeeFinance && <Link to="/invoices" className="text-sm text-primary hover:underline">{t('viewAll')}</Link>}
          </div>
          <div className="space-y-2">
            {stats.recent.length === 0 ? (
              <p className="text-sm text-muted-foreground py-6 text-center">{t('noData')}</p>
            ) : (
              stats.recent.map((inv: any) => (
                <div key={inv.id} className="flex items-center justify-between py-2 border-b last:border-0">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Receipt className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{inv.invoice_number}</p>
                      <p className="text-xs text-muted-foreground">{new Date(inv.created_at).toLocaleString()}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    {canSeeFinance && <p className="font-semibold">{inv.total?.toFixed(2)}</p>}
                    <span className={`text-xs ${inv.status === 'COMPLETED' ? 'text-emerald-600' : inv.status === 'VOIDED' ? 'text-destructive' : 'text-amber-600'}`}>
                      {inv.status}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-card border rounded-xl p-5">
          <h3 className="font-heading font-semibold mb-4">{t('quickActions')}</h3>
          <div className="space-y-2">
            {['ADMIN', 'SUPERVISOR', 'CASHIER'].includes(role) && (
              <Link to="/pos" className="flex items-center gap-3 p-3 rounded-lg border hover:bg-accent transition-colors">
                <ShoppingCart className="h-5 w-5 text-primary" />
                <span className="text-sm font-medium">{t('newSale')}</span>
              </Link>
            )}
            {['ADMIN', 'STOCK_MANAGER', 'SUPERVISOR'].includes(role) && (
              <Link to="/inventory" className="flex items-center gap-3 p-3 rounded-lg border hover:bg-accent transition-colors">
                <Package className="h-5 w-5 text-violet-600" />
                <span className="text-sm font-medium">{t('manageInventory')}</span>
              </Link>
            )}
            {canSeeFinance && (
              <Link to="/reports" className="flex items-center gap-3 p-3 rounded-lg border hover:bg-accent transition-colors">
                <TrendingUp className="h-5 w-5 text-blue-600" />
                <span className="text-sm font-medium">{t('viewReports')}</span>
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}