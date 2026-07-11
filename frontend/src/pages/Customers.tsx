import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../api/client';
import { Plus, Pencil, Trash2, Users, Phone } from 'lucide-react';

const empty = { name: '', phone: '', email: '', balance: 0, address: '', tax_id: '' };

export default function Customers() {
  const { t } = useTranslation();
  const [list, setList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState<any>(empty);

  const load = () => { setLoading(true); api.get('/customers').then((res) => setList(res.data)).finally(() => setLoading(false)); };
  useEffect(load, []);

  const filtered = list.filter((c) => !search || c.name?.toLowerCase().includes(search.toLowerCase()) || c.phone?.includes(search));

  const save = async () => {
    if (editing === 'new') await api.post('/customers', form);
    else await api.patch(`/customers/${editing}`, form);
    setEditing(null); load();
  };
  const remove = async (c: any) => { if (confirm(`Delete ${c.name}?`)) { await api.delete(`/customers/${c.id}`); load(); } };

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div><h2 className="text-2xl font-heading font-bold">{t('customers')}</h2><p className="text-muted-foreground text-sm mt-0.5">{list.length} registered</p></div>
        <button onClick={() => { setForm(empty); setEditing('new'); }} className="btn-touch bg-primary text-primary-foreground rounded-lg px-4 flex items-center gap-2 font-medium hover:opacity-90"><Plus className="h-4 w-4" /> {t('add')}</button>
      </div>

      <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t('search')} className="max-w-md w-full h-10 rounded-lg border px-3 bg-card focus:outline-none focus:ring-2 focus:ring-ring" />

      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {loading ? <p className="text-muted-foreground">{t('loading')}</p> : filtered.map((c) => (
          <div key={c.id} className="bg-card border rounded-xl p-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center"><Users className="h-5 w-5 text-primary" /></div>
                <div><p className="font-medium">{c.name}</p>{c.phone && <p className="text-xs text-muted-foreground flex items-center gap-1"><Phone className="h-3 w-3" />{c.phone}</p>}</div>
              </div>
              <div className="flex gap-1">
                <button onClick={() => { setForm({ ...c }); setEditing(c.id); }} className="h-8 w-8 rounded-lg hover:bg-accent flex items-center justify-center"><Pencil className="h-4 w-4" /></button>
                <button onClick={() => remove(c)} className="h-8 w-8 rounded-lg hover:bg-accent text-destructive flex items-center justify-center"><Trash2 className="h-4 w-4" /></button>
              </div>
            </div>
            {c.balance > 0 && <div className="mt-3 text-sm"><span className="text-muted-foreground">Balance:</span> <span className="font-semibold text-amber-600">{c.balance.toFixed(2)}</span></div>}
          </div>
        ))}
      </div>
      {!loading && filtered.length === 0 && <div className="text-center text-muted-foreground py-12"><Users className="h-10 w-10 mx-auto mb-2 opacity-30" /><p>{t('noData')}</p></div>}

      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-card rounded-2xl shadow-2xl w-full max-w-md p-6">
            <h3 className="font-heading font-semibold text-lg mb-4">{editing === 'new' ? t('add') : t('edit')}</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2"><label className="text-sm font-medium">{t('productName')} *</label><input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full h-10 mt-1 rounded-lg border px-3 bg-background" /></div>
              <div><label className="text-sm font-medium">{t('phone') || 'Phone'}</label><input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="w-full h-10 mt-1 rounded-lg border px-3 bg-background" /></div>
              <div><label className="text-sm font-medium">{t('email')}</label><input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="w-full h-10 mt-1 rounded-lg border px-3 bg-background" /></div>
              <div className="col-span-2"><label className="text-sm font-medium">Address</label><input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className="w-full h-10 mt-1 rounded-lg border px-3 bg-background" /></div>
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