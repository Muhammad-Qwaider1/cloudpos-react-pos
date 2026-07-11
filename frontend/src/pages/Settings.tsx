import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../store/authStore';
import api from "../api/client";
import { Users, Store, Percent, Save } from 'lucide-react';

const ROLES = [
  { value: 'ADMIN', label: 'Admin', desc: 'Full access' },
  { value: 'SUPERVISOR', label: 'Supervisor', desc: 'Approves discounts, returns, voids' },
  { value: 'STOCK_MANAGER', label: 'Stock Manager', desc: 'Products & inventory only' },
  { value: 'CASHIER', label: 'Cashier', desc: 'Sales only, no cost prices' },
];

export default function Settings() {
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const [store, setStore] = useState({ name: 'CloudPOS Store', tax_rate: 15, currency: 'USD', address: '', phone: '' });
  const [users, setUsers] = useState<any[]>([]);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const s = localStorage.getItem('cloudpos_settings');
    if (s) setStore(JSON.parse(s));
    if (user?.role === 'ADMIN') {
      api.get('/users').then((res) => setUsers(res.data)).catch(() => {});
    }
  }, []);

  const save = () => {
    localStorage.setItem('cloudpos_settings', JSON.stringify(store));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const changeRole = async (uid: string, role: string) => {
    await api.patch(`/users/${uid}`, { role });
    setUsers((prev) => prev.map((u) => (u.id === uid ? { ...u, role } : u)));
  };

  return (
    <div className="p-6 space-y-6 max-w-4xl">
      <div>
        <h2 className="text-2xl font-heading font-bold">{t('settings')}</h2>
        <p className="text-muted-foreground text-sm mt-0.5">Configure your store</p>
      </div>

      {/* Store Info */}
      <div className="bg-card border rounded-xl p-5 space-y-4">
        <div className="flex items-center gap-2"><Store className="h-5 w-5 text-primary" /><h3 className="font-heading font-semibold">Store Information</h3></div>
        <div className="grid grid-cols-2 gap-4">
          <div><label className="text-sm font-medium">Store Name</label><input value={store.name} onChange={(e) => setStore({ ...store, name: e.target.value })} className="w-full h-10 mt-1 rounded-lg border px-3 bg-background" /></div>
          <div><label className="text-sm font-medium">Currency</label><input value={store.currency} onChange={(e) => setStore({ ...store, currency: e.target.value })} className="w-full h-10 mt-1 rounded-lg border px-3 bg-background" /></div>
          <div><label className="text-sm font-medium">Phone</label><input value={store.phone} onChange={(e) => setStore({ ...store, phone: e.target.value })} className="w-full h-10 mt-1 rounded-lg border px-3 bg-background" /></div>
          <div><label className="text-sm font-medium">Address</label><input value={store.address} onChange={(e) => setStore({ ...store, address: e.target.value })} className="w-full h-10 mt-1 rounded-lg border px-3 bg-background" /></div>
        </div>
        <div className="flex items-center gap-2 pt-2"><Percent className="h-5 w-5 text-primary" /><h3 className="font-heading font-semibold">Tax</h3></div>
        <div className="max-w-xs"><label className="text-sm font-medium">Default VAT Rate (%)</label><input type="number" value={store.tax_rate} onChange={(e) => setStore({ ...store, tax_rate: parseFloat(e.target.value) || 0 })} className="w-full h-10 mt-1 rounded-lg border px-3 bg-background" /></div>
        <button onClick={save} className="btn-touch bg-primary text-primary-foreground rounded-lg px-4 flex items-center gap-2 font-medium hover:opacity-90">
          <Save className="h-4 w-4" /> {saved ? 'Saved!' : t('save')}
        </button>
      </div>

      {/* Users & Roles */}
      {user?.role === 'ADMIN' && (
        <div className="bg-card border rounded-xl p-5 space-y-4">
          <div className="flex items-center gap-2"><Users className="h-5 w-5 text-primary" /><h3 className="font-heading font-semibold">Users & Roles</h3></div>
          <div className="space-y-2">
            {users.map((u) => (
              <div key={u.id} className="flex items-center justify-between gap-3 p-3 rounded-lg border">
                <div>
                  <p className="text-sm font-medium">{u.full_name}</p>
                  <p className="text-xs text-muted-foreground">{u.email}</p>
                </div>
                <select value={u.role} onChange={(e) => changeRole(u.id, e.target.value)} className="text-sm border rounded-lg px-3 py-1.5 bg-background">
                  {ROLES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
                </select>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-2 pt-2">
            {ROLES.map((r) => (
              <div key={r.value} className="border rounded-lg p-3">
                <p className="text-sm font-medium">{r.label}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{r.desc}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}