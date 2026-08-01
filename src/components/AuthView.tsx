import React, { useState } from 'react';
import { TetherPlusLogo } from './TetherPlusLogo';
import {
  ShieldCheck,
  ArrowRight,
  Sparkles,
  Cpu,
  Lock,
  UserCheck,
  RefreshCw,
  Fingerprint,
} from 'lucide-react';
import { User, SystemSettings } from '../types';

interface AuthViewProps {
  users: User[];
  settings: SystemSettings | null;
  onLoginSuccess: () => void;
  showToast: (msg: string, type?: 'success' | 'error') => void;
  onContinueAsGuest?: () => void;
}

export const AuthView: React.FC<AuthViewProps> = ({
  users,
  settings,
  onLoginSuccess,
  showToast,
  onContinueAsGuest,
}) => {
  const [mode, setMode] = useState<'login' | 'register'>('login');

  // Login Form
  const [loginInput, setLoginInput] = useState('NX-GML9L6');
  const [loginPassword, setLoginPassword] = useState('123456');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Register Form
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regWallet, setRegWallet] = useState('');
  const [regSponsorNodeId, setRegSponsorNodeId] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginInput.trim()) {
      showToast('Please enter Email or Node ID', 'error');
      return;
    }

    setIsLoggingIn(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nodeId: loginInput.trim(),
          email: loginInput.trim(),
          password: loginPassword,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Login failed');
      }

      showToast(`Welcome back! Logged in as #${data.user.nodeId} (${data.user.name})`, 'success');
      onLoginSuccess();
    } catch (err: any) {
      showToast(err.message || 'Login failed', 'error');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regName.trim() || !regEmail.trim()) {
      showToast('Name and Email are required', 'error');
      return;
    }

    setIsRegistering(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: regName.trim(),
          email: regEmail.trim(),
          password: regPassword.trim() || '123456',
          walletAddress: regWallet.trim() || undefined,
          sponsorNodeId: regSponsorNodeId.trim() || 'NX-ROOT01',
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Registration failed');
      }

      showToast(`Account Created! Node ID is #${data.user.nodeId}`, 'success');
      onLoginSuccess();
    } catch (err: any) {
      showToast(err.message || 'Registration failed', 'error');
    } finally {
      setIsRegistering(false);
    }
  };

  return (
    <div className="gaurav-login-body min-h-screen text-slate-100 flex flex-col justify-between items-center relative overflow-hidden selection:bg-[#0ef] selection:text-black">
      {/* Top Header Bar */}
      <header className="w-full bg-[#151d2a]/90 backdrop-blur-xl border-b border-[#2c4766] px-4 sm:px-8 py-3.5 flex items-center justify-between z-20 shadow-[0_4px_25px_rgba(0,0,0,0.6)]">
        <div className="flex items-center gap-3">
          <TetherPlusLogo size="md" showTagline={true} />
          <span className="hidden sm:inline-flex items-center gap-1 text-[11px] bg-cyan-950/80 border border-[#0ef]/40 text-[#0ef] px-2.5 py-0.5 rounded-full font-mono font-bold">
            <Cpu className="w-3.5 h-3.5 text-[#0ef] animate-pulse" />
            CYBER WEB3 AUTH
          </span>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center gap-2 bg-[#0e1724] border border-[#2c4766] px-3 py-1.5 rounded-xl font-mono text-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span className="text-slate-300">BNB Smart Chain</span>
          </div>

          {onContinueAsGuest && (
            <button
              onClick={onContinueAsGuest}
              className="text-xs font-mono font-bold text-[#0ef] hover:text-white px-3.5 py-1.5 rounded-xl border border-[#0ef]/40 hover:border-[#0ef] bg-[#0ef]/10 hover:bg-[#0ef]/20 transition shadow-[0_0_15px_rgba(0,238,255,0.2)] flex items-center gap-1.5"
            >
              <span>Preview Guest Node</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </header>

      {/* Main Content Area: Centered Animated Ring & Form Box */}
      <main className="flex-1 w-full max-w-6xl mx-auto px-3 sm:px-4 py-4 sm:py-12 flex flex-col items-center justify-center relative z-10">
        
        {/* Animated Loader Ring & Login Box Container */}
        <div className="gaurav-container my-8 sm:my-20">
          {/* 50 Rotating Animated Spans */}
          {Array.from({ length: 50 }).map((_, i) => (
            <span key={i} style={{ '--i': i } as React.CSSProperties} />
          ))}

          {/* Form Box Centered inside Ring */}
          <div className="gaurav-login-box">
            {mode === 'login' ? (
              <form onSubmit={handleLogin} className="space-y-1">
                <h2 className="text-2xl sm:text-3xl font-extrabold text-[#0ef] tracking-tight mb-1 text-center">
                  Login
                </h2>

                <div className="gaurav-input-box">
                  <input
                    type="text"
                    required
                    value={loginInput}
                    onChange={(e) => setLoginInput(e.target.value)}
                    className={loginInput ? 'has-value' : ''}
                  />
                  <label>Email / Node ID</label>
                </div>

                <div className="gaurav-input-box">
                  <input
                    type="password"
                    required
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    className={loginPassword ? 'has-value' : ''}
                  />
                  <label>Password</label>
                </div>

                <div className="gaurav-forgot-pass">
                  <a
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      showToast('Password reset instructions sent to your email', 'success');
                    }}
                  >
                    Forgot your password?
                  </a>
                </div>

                <button
                  type="submit"
                  disabled={isLoggingIn}
                  className="gaurav-btn flex items-center justify-center gap-2"
                >
                  {isLoggingIn ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin text-[#1f293a]" />
                      <span>Authenticating...</span>
                    </>
                  ) : (
                    'Login'
                  )}
                </button>

                <div className="gaurav-signup-link">
                  <button
                    type="button"
                    onClick={() => setMode('register')}
                  >
                    signup
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleRegister} className="space-y-1">
                <h2 className="text-2xl sm:text-3xl font-extrabold text-[#0ef] tracking-tight mb-1 text-center">
                  Sign Up
                </h2>

                <div className="gaurav-input-box">
                  <input
                    type="text"
                    required
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    className={regName ? 'has-value' : ''}
                  />
                  <label>Full Name</label>
                </div>

                <div className="gaurav-input-box">
                  <input
                    type="email"
                    required
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    className={regEmail ? 'has-value' : ''}
                  />
                  <label>Email</label>
                </div>

                <div className="gaurav-input-box">
                  <input
                    type="password"
                    required
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    className={regPassword ? 'has-value' : ''}
                  />
                  <label>Password</label>
                </div>

                <div className="gaurav-input-box">
                  <input
                    type="text"
                    value={regSponsorNodeId}
                    onChange={(e) => setRegSponsorNodeId(e.target.value)}
                    className={regSponsorNodeId ? 'has-value' : ''}
                  />
                  <label>Sponsor Node ID (Optional)</label>
                </div>

                <button
                  type="submit"
                  disabled={isRegistering}
                  className="gaurav-btn flex items-center justify-center gap-2 mt-2"
                >
                  {isRegistering ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin text-[#1f293a]" />
                      <span>Creating...</span>
                    </>
                  ) : (
                    'Signup'
                  )}
                </button>

                <div className="gaurav-signup-link">
                  <button
                    type="button"
                    onClick={() => setMode('login')}
                  >
                    login
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>

      </main>

      {/* Footer */}
      <footer className="w-full bg-[#151d2a]/80 border-t border-[#2c4766] py-3.5 px-4 text-center font-mono text-xs text-slate-400 z-20">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>© 2026 TetherPlus Cyber Web3 Protocol</span>
          <div className="flex items-center gap-3 text-[11px]">
            <span className="text-emerald-400 font-semibold flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> SSL Encrypted Node
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
};
