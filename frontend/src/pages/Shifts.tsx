import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from "../store/authStore";
import api from "../api/client";
import { ScrollText, Play, Square, CheckCircle2 } from 'lucide-react';

export default function Shifts() {
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const [shifts, setShifts] = useState<any[]>([]);
  const [open, setOpen] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [openingCash, setOpeningCash] = useState('');
  const [closeDialog, setCloseDialog] = useState<any>(null);
  const [countedCash, setCountedCash] = useState('');

  const load = () => {
    setLoading(true);
    Promise.all([api.get('/shifts'), api.get('/shifts/open')]).then(([allRes, openRes]) => {
      setShifts(allRes.data || []);
      setOpen(openRes.data || null);
    }).finally(() => setLoading(false));
  };
  useEffect(load, []);

  const openShift = async () => {
    await api.post('/shifts/open', { opening_cash: parseFloat(openingCash) || 0 });
    setOpenDialog(false); setOpeningCash(''); load();
  };

  const closeShift = async () => {
    const counted = parseFloat(countedCash) || 0;
    await api.post(`/shifts/${closeDialog.id}/close`, { counted_cash: counted });
    setCloseDialog(null); setCountedCash(''); load();
  };

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div><h2 className="text-2xl font-heading font-bold">{t('shifts')}</h2></div>
        {!open && <button onClick={() => setOpenDialog(true)} className="btn-touch bg-primary text-primary-foreground rounded-lg px-4 flex items-center gap-2 font-medium hover:opacity-90"><Play className="h-4 w-4" /> {t('openShift')}</button>}
      </div>

      {open && (
        <div className="bg-card border border-emerald-500/30 rounded-xl p-5 bg-emerald-500/5">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-xl bg-emerald-500/15 flex items-center justify-center"><CheckCircle2 className="h-6 w-6 text-emerald-600" /></div>
              <div>
                <p className="font-heading font-semibold">{t('shiftOpen')}</p>
                <p className="text-sm text-muted-foreground">{t('opened')}: {new Date(open.opened_at).toLocaleString()} · {t('openingCash')}: <span className="font-medium text-foreground">{(open.opening_cash || 0).toFixed(2)}</span></p>
              </div>
            </div>
            <button onClick={() => { setCloseDialog(open); setCountedCash(String(open.expected_cash || 0)); }} className="btn-touch bg-destructive text-destructive-foreground rounded-lg px-4 flex items-center gap-2 font-medium hover:opacity-90"><Square className="h-4 w-4" /> {t('closeShift')}</button>
          </div>
        </div>
      )}

      <div className="bg-card border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-muted-foreground">
              <tr>
                <th className="text-left font-medium px-4 py-3">{t('opened')}</th>
                <th className="text-left font-medium px-4 py-3">{t('closed')}</th>
                <th className="text-right font-medium px-4 py-3">{t('openingCash')}</th>
                <th className="text-right font-medium px-4 py-3">{t('expectedCash')}</th>
                <th className="text-right font-medium px-4 py-3">{t('countedCash')}</th>
                <th className="text-right font-medium px-4 py-3">{t('discrepancy')}</th>
                <th className="text-center font-medium px-4 py-3">{t('status')}</th>
              </tr>
            </thead>
            <tbody>
              {loading ? <tr><td colSpan={7} className="text-center py-10 text-muted-foreground">{t('loading')}</td></tr> : shifts.map((sh) => (
                <tr key={sh.id} className="border-t hover:bg-muted/30">
                  <td className="px-4 py-3">{new Date(sh.opened_at).toLocaleString()}</td>
                  <td className="px-4 py-3 text-muted-foreground">{sh.closed_at ? new Date(sh.closed_at).toLocaleString() : '—'}</td>
                  <td className="px-4 py-3 text-right">{sh.opening_cash?.toFixed(2)}</td>
                  <td className="px-4 py-3 text-right">{sh.expected_cash?.toFixed(2)}</td>
                  <td className="px-4 py-3 text-right">{sh.counted_cash != null ? sh.counted_cash.toFixed(2) : '—'}</td>
                  <td className="px-4 py-3 text-right">{sh.discrepancy != null ? <span className={Math.abs(sh.discrepancy) < 0.01 ? 'text-emerald-600' : 'text-destructive font-medium'}>{sh.discrepancy.toFixed(2)}</span> : '—'}</td>
                  <td className="px-4 py-3 text-center"><span className={`text-xs px-2 py-0.5 rounded-full font-medium ${sh.status === 'OPEN' ? 'bg-emerald-500/15 text-emerald-600' : 'bg-muted text-muted-foreground'}`}>{sh.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!loading && shifts.length === 0 && <div className="py-12 text-center text-muted-foreground"><ScrollText className="h-10 w-10 mx-auto mb-2 opacity-30" /><p>{t('noData')}</p></div>}
      </div>

      {/* Open Shift Dialog */}
      {openDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-card rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <h3 className="font-heading font-semibold text-lg mb-4">{t('openShift')}</h3>
            <label className="text-sm font-medium">{t('openingCash')}</label>
            <input type="number" value={openingCash} onChange={(e) => setOpeningCash(e.target.value)} placeholder="0.00" autoFocus className="w-full h-12 text-lg mt-1 rounded-lg border px-3 bg-background" />
            <div className="flex gap-2 mt-6">
              <button onClick={() => setOpenDialog(false)} className="flex-1 h-11 rounded-lg border font-medium hover:bg-accent">{t('cancel')}</button>
              <button onClick={openShift} disabled={!openingCash} className="flex-1 h-11 rounded-lg bg-primary text-primary-foreground font-semibold hover:opacity-90 disabled:opacity-50">{t('openShift')}</button>
            </div>
          </div>
        </div>
      )}

      {/* Close Shift Dialog */}
      {closeDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-card rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <h3 className="font-heading font-semibold text-lg mb-4">{t('closeShift')}</h3>
            <div className="rounded-lg bg-muted p-3 text-sm space-y-1 mb-3">
              <div className="flex justify-between"><span className="text-muted-foreground">{t('openingCash')}</span><span>{closeDialog.opening_cash?.toFixed(2)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">{t('expectedCash')}</span><span className="font-medium">{closeDialog.expected_cash?.toFixed(2)}</span></div>
            </div>
            <label className="text-sm font-medium">{t('countedCash')}</label>
            <input type="number" value={countedCash} onChange={(e) => setCountedCash(e.target.value)} className="w-full h-12 text-lg mt-1 rounded-lg border px-3 bg-background" autoFocus />
            {countedCash && closeDialog && (
              <p className={`text-sm font-medium mt-2 ${Math.abs((parseFloat(countedCash) || 0) - (closeDialog.expected_cash || 0)) < 0.01 ? 'text-emerald-600' : 'text-destructive'}`}>
                {t('discrepancy')}: {((parseFloat(countedCash) || 0) - (closeDialog.expected_cash || 0)).toFixed(2)}
              </p>
            )}
            <div className="flex gap-2 mt-6">
              <button onClick={() => setCloseDialog(null)} className="flex-1 h-11 rounded-lg border font-medium hover:bg-accent">{t('cancel')}</button>
              <button onClick={closeShift} className="flex-1 h-11 rounded-lg bg-destructive text-destructive-foreground font-semibold hover:opacity-90">{t('closeShift')}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}