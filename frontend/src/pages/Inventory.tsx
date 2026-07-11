import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../store/authStore';
import api from "../api/client";
import { Plus, Search, Pencil, Trash2, Package, AlertTriangle } from 'lucide-react';

const empty = { name: '', barcode: '', category: '', unit_price: 0, cost_price: 0, stock_quantity: 0, min_stock_alert: 5, tax_exempt: false, unit: 'pcs', active: true };

export default function Inventory() {
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState<any>(empty);

  const canSeeCost = ['ADMIN', 'STOCK_MANAGER'].includes(user?.role || '');

  const load = () => {
    setLoading(true);
    api.get('/products').then((res) => setProducts(res.data)).finally(() => setLoading(false));
  };
  useEffect(load, []);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return products;
    return products.filter((p) => p.name?.toLowerCase().includes(q) || p.barcode?.includes(q) || p.category?.toLowerCase().includes(q));
  }, [products, search]);

  const save = async () => {
    if (editing === 'new') await api.post('/products', form);
    else await api.patch(`/products/${editing}`, form);
    setEditing(null);
    load();
  };

  const remove = async (p: any) => {
    if (!confirm(`Delete "${p.name}"?`)) return;
    await api.delete(`/products/${p.id}`);
    load();
  };

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-heading font-bold">{t('inventory')}</h2>
          <p className="text-muted-foreground text-sm mt-0.5">{products.length} products · {products.filter((p) => p.stock_quantity <= (p.min_stock_alert || 5)).length} {t('lowStock').toLowerCase()}</p>
        </div>
        <button onClick={() => { setForm(empty); setEditing('new'); }} className="btn-touch bg-primary text-primary-foreground rounded-lg px-4 flex items-center gap-2 font-medium hover:opacity-90">
          <Plus className="h-4 w-4" /> {t('addProduct')}
        </button>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t('searchProducts')} className="w-full pl-9 h-10 rounded-lg border bg-card focus:outline-none focus:ring-2 focus:ring-ring" />
      </div>

      <div className="bg-card border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-muted-foreground">
              <tr>
                <th className="text-left font-medium px-4 py-3">{t('productName')}</th>
                <th className="text-left font-medium px-4 py-3">{t('barcode')}</th>
                <th className="text-left font-medium px-4 py-3">{t('category')}</th>
                {canSeeCost && <th className="text-right font-medium px-4 py-3">{t('costPrice')}</th>}
                <th className="text-right font-medium px-4 py-3">{t('sellingPrice')}</th>
                <th className="text-center font-medium px-4 py-3">{t('stockQty')}</th>
                <th className="text-right font-medium px-4 py-3">{t('actions')}</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={canSeeCost ? 7 : 6} className="text-center py-12 text-muted-foreground">{t('loading')}</td></tr>
              ) : filtered.map((p) => {
                const low = p.stock_quantity <= (p.min_stock_alert || 5);
                return (
                  <tr key={p.id} className="border-t hover:bg-muted/30">
                    <td className="px-4 py-3 font-medium">{p.name}{p.tax_exempt && <span className="ml-2 text-[10px] bg-blue-500/15 text-blue-600 px-1.5 py-0.5 rounded">Tax-free</span>}</td>
                    <td className="px-4 py-3 text-muted-foreground font-mono text-xs">{p.barcode || '—'}</td>
                    <td className="px-4 py-3 text-muted-foreground">{p.category || '—'}</td>
                    {canSeeCost && <td className="px-4 py-3 text-right text-muted-foreground">{p.cost_price?.toFixed(2)}</td>}
                    <td className="px-4 py-3 text-right font-semibold">{p.unit_price?.toFixed(2)}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${low ? 'bg-amber-500/15 text-amber-600' : 'bg-emerald-500/15 text-emerald-600'}`}>
                        {low && <AlertTriangle className="h-3 w-3" />}{p.stock_quantity}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        <button onClick={() => { setForm({ ...p }); setEditing(p.id); }} className="h-8 w-8 rounded-lg hover:bg-accent flex items-center justify-center"><Pencil className="h-4 w-4" /></button>
                        <button onClick={() => remove(p)} className="h-8 w-8 rounded-lg hover:bg-accent text-destructive flex items-center justify-center"><Trash2 className="h-4 w-4" /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {!loading && filtered.length === 0 && (
          <div className="py-12 text-center text-muted-foreground"><Package className="h-10 w-10 mx-auto mb-2 opacity-30" /><p>{t('noData')}</p></div>
        )}
      </div>

      {/* Edit Dialog */}
      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-card rounded-2xl shadow-2xl w-full max-w-lg p-6">
            <h3 className="font-heading font-semibold text-lg mb-4">{editing === 'new' ? t('addProduct') : t('editProduct')}</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2"><label className="text-sm font-medium">{t('productName')} *</label><input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full h-10 mt-1 rounded-lg border px-3 bg-background" /></div>
              <div><label className="text-sm font-medium">{t('barcode')}</label><input value={form.barcode} onChange={(e) => setForm({ ...form, barcode: e.target.value })} className="w-full h-10 mt-1 rounded-lg border px-3 bg-background" /></div>
              <div><label className="text-sm font-medium">{t('category')}</label><input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="w-full h-10 mt-1 rounded-lg border px-3 bg-background" /></div>
              {canSeeCost && <div><label className="text-sm font-medium">{t('costPrice')}</label><input type="number" value={form.cost_price} onChange={(e) => setForm({ ...form, cost_price: parseFloat(e.target.value) || 0 })} className="w-full h-10 mt-1 rounded-lg border px-3 bg-background" /></div>}
              <div><label className="text-sm font-medium">{t('sellingPrice')} *</label><input type="number" value={form.unit_price} onChange={(e) => setForm({ ...form, unit_price: parseFloat(e.target.value) || 0 })} className="w-full h-10 mt-1 rounded-lg border px-3 bg-background" /></div>
              <div><label className="text-sm font-medium">{t('stockQty')}</label><input type="number" value={form.stock_quantity} onChange={(e) => setForm({ ...form, stock_quantity: parseFloat(e.target.value) || 0 })} className="w-full h-10 mt-1 rounded-lg border px-3 bg-background" /></div>
              <div><label className="text-sm font-medium">{t('minStockAlert')}</label><input type="number" value={form.min_stock_alert} onChange={(e) => setForm({ ...form, min_stock_alert: parseFloat(e.target.value) || 0 })} className="w-full h-10 mt-1 rounded-lg border px-3 bg-background" /></div>
              <div className="col-span-2 flex items-center gap-2"><input type="checkbox" id="taxex" checked={form.tax_exempt} onChange={(e) => setForm({ ...form, tax_exempt: e.target.checked })} /><label htmlFor="taxex" className="text-sm">{t('taxExempt')}</label></div>
            </div>
            <div className="flex gap-2 mt-6">
              <button onClick={() => setEditing(null)} className="flex-1 h-11 rounded-lg border font-medium hover:bg-accent">{t('cancel')}</button>
              <button onClick={save} disabled={!form.name} className="flex-1 h-11 rounded-lg bg-primary text-primary-foreground font-semibold hover:opacity-90 disabled:opacity-50">{t('save')}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}