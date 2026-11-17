import React, { useState } from 'react';
import { ShieldCheck, Lock, KeyRound, Eye, EyeOff, AlertTriangle, ArrowLeft } from 'lucide-react';
import { User } from '../types';
import { JalwaLogo } from './JalwaLogo';

interface AdminPortalLoginProps {
  onSuccess: (adminUser: User) => void;
  onBackToMainSite?: () => void;
}

export const AdminPortalLogin: React.FC<AdminPortalLoginProps> = ({
  onSuccess,
  onBackToMainSite,
}) => {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!identifier.trim() || !password.trim()) {
      setErrorMsg('Admin Node ID / Email and Password are required.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nodeId: identifier.trim(),
          email: identifier.trim(),
          password: password.trim(),
        }),
      });
      const data = await res.json();

      if (!res.ok || !data.user) {
        throw new Error(data.error || 'Invalid Admin credentials');
      }

      const loggedUser: User = data.user;
      const hasAdminAccess = Boolean(
        loggedUser.isAdmin ||
          loggedUser.isSuperAdmin ||
          loggedUser.isSubAdmin ||
          loggedUser.nodeId === 'NX-ROOT01'
      );

      if (!hasAdminAccess) {
        throw new Error('Access Denied: This account does not have Admin privileges.');
      }

      localStorage.removeItem('tp_logged_out');
      localStorage.setItem('tp_user_id', loggedUser.id);
      sessionStorage.setItem('sportx_admin_verified', loggedUser.id);
      onSuccess(loggedUser);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050814] text-slate-100 flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Subtle Ambient Glow */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md bg-[#0a1124]/95 border border-cyan-500/30 rounded-3xl p-6 sm:p-8 shadow-[0_0_50px_rgba(6,182,212,0.18)] relative z-10 space-y-6">
        <div className="flex flex-col items-center text-center space-y-3">
          <JalwaLogo size="md" showSubtext={false} />
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/40 text-amber-300 text-[11px] font-black uppercase tracking-wider">
            <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
            <span>Restricted Admin Subdomain</span>
          </div>
          <div>
            <h1 className="text-xl font-black text-white tracking-tight">
              SportX Master Control Login
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Password-protected portal isolated from player lobby
            </p>
          </div>
        </div>

        {errorMsg && (
          <div className="p-3 rounded-xl bg-rose-950/70 border border-rose-500/50 text-rose-300 text-xs font-bold flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-300 block">
              Admin ID / Email
            </label>
            <div className="relative">
              <KeyRound className="w-4 h-4 text-cyan-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="Enter Admin ID or Email"
                autoComplete="username"
                className="w-full bg-[#050914] border border-slate-700 focus:border-cyan-400 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none font-mono"
                required
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-300 block">
              Admin Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-amber-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter Admin Password"
                autoComplete="current-password"
                className="w-full bg-[#050914] border border-slate-700 focus:border-amber-400 rounded-xl pl-10 pr-10 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none font-mono"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 hover:brightness-110 text-black font-black text-sm shadow-[0_0_20px_rgba(245,158,11,0.35)] transition active:scale-[0.99] disabled:opacity-50 cursor-pointer"
          >
            {loading ? 'Verifying Credentials...' : 'Unlock Master Admin Panel'}
          </button>
        </form>

        {onBackToMainSite && (
          <div className="pt-2 border-t border-slate-800/80 text-center">
            <button
              type="button"
              onClick={onBackToMainSite}
              className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-cyan-300 transition font-semibold"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Return to SportX Player Site</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
