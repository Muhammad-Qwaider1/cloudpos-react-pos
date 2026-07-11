import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../api/client';
import { Plus, Pencil, Trash2, Truck, Phone } from 'lucide-react';

const empty = { name: '', phone: '', email: '', address: '', contact_person: '', balance: 0 };

export default function Suppliers() {
  const { t } = useTranslation();
  const [list, setList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState<any>(empty);

  const load = () => { setLoading(true); api.get('/suppliers').then((res) => setList(res.data)).finally(() => setLoading(false)); };
  useEffect(load, []);

  const filtered = list.filter((s) => !search || s.name?.toLowerCase().includes(search.toLowerCase()));

  const save = async () => {
    if (editing === 'new') await api.post('/suppliers', form);
    else await api.patch(`/suppliers/${editing}`, form);
    setEditing(null); load();
  };
  const remove = async (s: any) => { if (confirm(`Delete ${s.name}?`)) { await api.delete(`/suppliers/${s.id}`); load(); } };

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div><h2 className="text-2xl font-heading font-bold">{t('suppliers')}</h2><p className="text-muted-foreground text-sm mt-0.5">{list.length} suppliers</p></div>
        <button onClick={() => { setForm(empty); setEditing('new'); }} className="btn-touch bg-primary text-primary-foreground rounded-lg px-4 flex items-center gap-2 font-medium hover:opacity-90"><Plus className="h-4 w-4" /> {t('add')}</button>
      </div>

      <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t('search')} className="max-w-md w-full h-10 rounded-lg border px-3 bg-card focus:outline-none focus:ring-2 focus:ring-ring" />

      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {loading ? <p className="text-muted-foreground">{t('loading')}</p> : filtered.map((s) => (
          <div key={s.id} className="bg-card border rounded-xl p-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-violet-500/10 flex items-center justify-center"><Truck className="h-5 w-5 text-violet-600" /></div>
                <div><p className="font-medium">{s.name}</p>{s.phone && <p className="text-xs text-muted-foreground flex items-center gap-1"><Phone className="h-3 w-3" />{s.phone}</p>}</div>
              </div>
              <div className="flex gap-1">
                <button onClick={() => { setForm({ ...s }); setEditing(s.id); }} className="h-8 w-8 rounded-lg hover:bg-accent flex items-center justify-center"><Pencil className="h-4 w-4" /></button>
                <button onClick={() => remove(s)} className="h-8 w-8 rounded-lg hover:bg-accent text-destructive flex items-center justify-center"><Trash2 className="h-4 w-4" /></button>
              </div>
            </div>
            {s.contact_person && <p className="mt-3 text-xs text-muted-foreground">Contact: {s.contact_person}</p>}
          </div>
        ))}
      </div>
      {!loading && filtered.length === 0 && <div className="text-center text-muted-foreground py-12"><Truck className="h-10 w-10 mx-auto mb-2 opacity-30" /><p>{t('noData')}</p></div>}

      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-card rounded-2xl shadow-2xl w-full max-w-md p-6">
            <h3 className="font-heading font-semibold text-lg mb-4">{editing === 'new' ? t('add') : t('edit')}</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2"><label className="text-sm font-medium">{t('productName')} *</label><input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full h-10 mt-1 rounded-lg border px-3 bg-background" /></div>
              <div><label className="text-sm font-medium">Phone</label><input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="w-full h-10 mt-1 rounded-lg border px-3 bg-background" /></div>
              <div><label className="text-sm font-medium">Contact Person</label><input value={form.contact_person} onChange={(e) => setForm({ ...form, contact_person: e.target.value })} className="w-full h-10 mt-1 rounded-lg border px-3 bg-background" /></div>
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