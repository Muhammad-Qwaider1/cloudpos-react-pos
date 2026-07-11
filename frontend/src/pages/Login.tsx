import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from "../store/authStore";
import { Store, Mail, Lock, Loader2, Languages } from 'lucide-react';
import { toggleLanguage } from '../i18n';

export default function Login() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { login, loading, error } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login(email, password);
      navigate('/');
    } catch {
      // error handled by store
    }
  };

  const fillDemo = (em: string, pw: string) => {
    setEmail(em);
    setPassword(pw);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
      <button
        onClick={toggleLanguage}
        className="absolute top-4 right-4 h-10 w-10 inline-flex items-center justify-center rounded-lg bg-card border hover:bg-accent transition-colors"
      >
        <Languages className="h-5 w-5" />
      </button>

      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex h-14 w-14 rounded-2xl bg-primary items-center justify-center mb-3">
            <Store className="h-7 w-7 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-heading font-bold">{t('welcome')}</h1>
          <p className="text-muted-foreground text-sm mt-1">{t('loginSubtitle')}</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-card border rounded-2xl p-6 space-y-4 shadow-sm">
          {error && (
            <div className="bg-destructive/10 text-destructive text-sm rounded-lg p-3 border border-destructive/20">
              {error}
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-sm font-medium">{t('email')}</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full pl-10 pr-3 h-11 rounded-lg border bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="admin@cloudpos.com"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">{t('password')}</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full pl-10 pr-3 h-11 rounded-lg border bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-touch w-full bg-primary text-primary-foreground rounded-lg font-semibold hover:opacity-90 disabled:opacity-50 transition-opacity flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : t('signIn')}
          </button>
        </form>

        {/* Demo credentials */}
        <div className="mt-4 bg-card border rounded-xl p-4">
          <p className="text-xs text-muted-foreground mb-2 font-medium">Demo Accounts (click to fill):</p>
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: 'Admin', em: 'admin@cloudpos.com', pw: 'admin123' },
              { label: 'Supervisor', em: 'supervisor@cloudpos.com', pw: 'supervisor123' },
              { label: 'Stock Mgr', em: 'stock@cloudpos.com', pw: 'stock123' },
              { label: 'Cashier', em: 'cashier@cloudpos.com', pw: 'cashier123' },
            ].map((d) => (
              <button
                key={d.em}
                onClick={() => fillDemo(d.em, d.pw)}
                className="text-left p-2 rounded-lg border hover:bg-accent transition-colors"
              >
                <p className="text-xs font-medium">{d.label}</p>
                <p className="text-[10px] text-muted-foreground">{d.pw}</p>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}