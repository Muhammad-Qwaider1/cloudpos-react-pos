 
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../api/client';
import { Store, Mail, KeyRound, Lock, Loader2, ArrowLeft, Copy, CheckCheck } from 'lucide-react';

type Step = 'email' | 'code';

export default function ForgotPassword() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [resetCode, setResetCode] = useState('');   // code shown to user
  const [emailHint, setEmailHint] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [copied, setCopied] = useState(false);

  // ─── Step 1: request code ─────────────────────────────────────────────────
  const handleRequestCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await api.post('/auth/forgot-password', { email });
      const data = res.data;
      if (data.reset_code) {
        setResetCode(data.reset_code);
        setEmailHint(data.email_hint || email);
        setStep('code');
      } else {
        // Email not found — show generic message, don't reveal
        setError('If this email is registered you will see a code. Please check the email.');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Something went wrong. Try again.');
    } finally {
      setLoading(false);
    }
  };

  // ─── Step 2: submit code + new password ──────────────────────────────────
  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }
    setLoading(true);
    try {
      await api.post('/auth/reset-password', {
        token: code,
        new_password: newPassword,
      });
      setSuccess('Password reset successfully! Redirecting to login...');
      setTimeout(() => navigate('/login'), 2500);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Invalid or expired code. Try again.');
    } finally {
      setLoading(false);
    }
  };

  const copyCode = () => {
    navigator.clipboard.writeText(resetCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
      <div className="w-full max-w-md">

        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex h-14 w-14 rounded-2xl bg-primary items-center justify-center mb-3">
            <Store className="h-7 w-7 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-heading font-bold">Reset Password</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {step === 'email'
              ? 'Enter your email to receive a reset code'
              : `Enter the code shown below and your new password`}
          </p>
        </div>

        {/* ── STEP 1: Email form ── */}
        {step === 'email' && (
          <form onSubmit={handleRequestCode} className="bg-card border rounded-2xl p-6 space-y-4 shadow-sm">
            {error && (
              <div className="bg-destructive/10 text-destructive text-sm rounded-lg p-3 border border-destructive/20">
                {error}
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-sm font-medium">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoFocus
                  className="w-full pl-10 pr-3 h-11 rounded-lg border bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="your@email.com"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-touch w-full bg-primary text-primary-foreground rounded-lg font-semibold hover:opacity-90 disabled:opacity-50 transition-opacity flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Get Reset Code'}
            </button>
          </form>
        )}

        {/* ── STEP 2: Code + new password form ── */}
        {step === 'code' && (
          <div className="space-y-4">

            {/* Reset code display box */}
            <div className="bg-card border-2 border-primary/30 rounded-2xl p-5 shadow-sm">
              <p className="text-xs text-muted-foreground mb-1">
                Reset code for <span className="font-medium text-foreground">{emailHint}</span>
              </p>
              <div className="flex items-center justify-between gap-3 mt-2">
                <span className="text-3xl font-mono font-bold tracking-[0.3em] text-primary select-all">
                  {resetCode}
                </span>
                <button
                  type="button"
                  onClick={copyCode}
                  className="h-9 px-3 rounded-lg border bg-muted hover:bg-accent transition-colors flex items-center gap-1.5 text-sm"
                >
                  {copied ? <CheckCheck className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                  {copied ? 'Copied' : 'Copy'}
                </button>
              </div>
              <p className="text-xs text-muted-foreground mt-2">⏱ Expires in 15 minutes</p>
            </div>

            {/* Reset form */}
            <form onSubmit={handleReset} className="bg-card border rounded-2xl p-6 space-y-4 shadow-sm">
              {error && (
                <div className="bg-destructive/10 text-destructive text-sm rounded-lg p-3 border border-destructive/20">
                  {error}
                </div>
              )}
              {success && (
                <div className="bg-green-500/10 text-green-600 text-sm rounded-lg p-3 border border-green-500/20 flex items-center gap-2">
                  <CheckCheck className="h-4 w-4 shrink-0" />
                  {success}
                </div>
              )}

              {/* Code input */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Enter the 6-digit code</label>
                <div className="relative">
                  <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input
                    type="text"
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    required
                    autoFocus
                    maxLength={6}
                    inputMode="numeric"
                    pattern="\d{6}"
                    className="w-full pl-10 pr-3 h-11 rounded-lg border bg-background focus:outline-none focus:ring-2 focus:ring-ring font-mono tracking-widest text-center text-lg"
                    placeholder="000000"
                  />
                </div>
              </div>

              {/* New password */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium">New Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    minLength={8}
                    className="w-full pl-10 pr-3 h-11 rounded-lg border bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                    placeholder="Min. 8 characters"
                  />
                </div>
              </div>

              {/* Confirm password */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Confirm New Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    className="w-full pl-10 pr-3 h-11 rounded-lg border bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                    placeholder="Repeat password"
                  />
                </div>
                {confirmPassword && newPassword !== confirmPassword && (
                  <p className="text-xs text-destructive">Passwords do not match</p>
                )}
              </div>

              <button
                type="submit"
                disabled={loading || !!success}
                className="btn-touch w-full bg-primary text-primary-foreground rounded-lg font-semibold hover:opacity-90 disabled:opacity-50 transition-opacity flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Reset Password'}
              </button>

              <button
                type="button"
                onClick={() => { setStep('email'); setError(''); setResetCode(''); }}
                className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                ← Request a new code
              </button>
            </form>
          </div>
        )}

        {/* Back to login */}
        <div className="mt-4 text-center">
          <Link
            to="/login"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Login
          </Link>
        </div>

      </div>
    </div>
  );
}
