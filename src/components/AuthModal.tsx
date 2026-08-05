import React, { useState, useEffect } from 'react';
import { TetherPlusLogo } from './TetherPlusLogo';
import { User as UserIcon, LogIn, UserPlus, Shield, Sparkles, CheckCircle2, AlertCircle, ArrowRight, Wallet, UserCheck } from 'lucide-react';
import { User } from '../types';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  users: User[];
  onLoginSuccess: () => void;
  showToast: (msg: string, type?: 'success' | 'error') => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  users,
  onLoginSuccess,
  showToast,
}) => {
  const [mode, setMode] = useState<'login' | 'register' | 'forgot'>('login');

  // Login Form
  const [loginInput, setLoginInput] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Forgot Password
  const [forgotInput, setForgotInput] = useState('');
  const [resetOtp, setResetOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [forgotStep, setForgotStep] = useState<1 | 2>(1);
  const [forgotTargetEmail, setForgotTargetEmail] = useState('');
  const [isForgotLoading, setIsForgotLoading] = useState(false);

  // Register Form
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regWallet, setRegWallet] = useState('');
  const [regSponsorNodeId, setRegSponsorNodeId] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);

  // Prevent background page scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      const prevHtmlOverflow = document.documentElement.style.overflow;
      const prevBodyOverflow = document.body.style.overflow;
      document.documentElement.style.overflow = 'hidden';
      document.body.style.overflow = 'hidden';

      return () => {
        document.documentElement.style.overflow = prevHtmlOverflow;
        document.body.style.overflow = prevBodyOverflow;
      };
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginInput.trim()) {
      showToast('Please enter Node ID or Email', 'error');
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
      onClose();
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
    if (!regPassword.trim() || regPassword.trim().length < 4) {
      showToast('Password is required (Minimum 4 characters)', 'error');
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
          password: regPassword.trim(),
          walletAddress: regWallet.trim() || undefined,
          sponsorNodeId: regSponsorNodeId.trim() || 'NX-ROOT01',
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Registration failed');
      }

      showToast(`Account Created Successfully! Your Node ID is #${data.user.nodeId}`, 'success');
      onLoginSuccess();
      onClose();
    } catch (err: any) {
      showToast(err.message || 'Registration failed', 'error');
    } finally {
      setIsRegistering(false);
    }
  };

  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotInput.trim()) {
      showToast('Please enter your registered Email or Node ID', 'error');
      return;
    }

    setIsForgotLoading(true);
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input: forgotInput.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Request failed');

      if (data.email) {
        setForgotTargetEmail(data.email);
      }

      if (data.otpDemo) {
        showToast(`OTP Code: ${data.otpDemo} (Auto-filled)`, 'success');
        setResetOtp(data.otpDemo);
      } else {
        showToast(data.message || 'OTP Code sent to your registered email!', 'success');
      }
      setForgotStep(2);
    } catch (err: any) {
      showToast(err.message || 'Failed to request password reset', 'error');
    } finally {
      setIsForgotLoading(false);
    }
  };

  const handleResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetOtp.trim() || !newPassword.trim()) {
      showToast('Please enter OTP code and new password', 'error');
      return;
    }

    setIsForgotLoading(true);
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          input: forgotInput.trim(),
          otp: resetOtp.trim(),
          newPassword: newPassword.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Reset failed');

      showToast('Password reset successfully! Please login with your new password.', 'success');
      setMode('login');
      setForgotStep(1);
      setForgotInput('');
      setResetOtp('');
      setNewPassword('');
    } catch (err: any) {
      showToast(err.message || 'Failed to reset password', 'error');
    } finally {
      setIsForgotLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md overflow-y-auto p-3 sm:p-4 font-mono overscroll-contain">
      <div className="min-h-full w-full flex items-center justify-center py-6 sm:py-10">
        <div className="bg-[#0b1320] border border-cyan-500/40 rounded-2xl w-full max-w-md p-5 sm:p-6 space-y-4 sm:space-y-5 shadow-[0_0_50px_rgba(6,182,212,0.25)] relative my-auto">
        {/* Brand Logo Header */}
        <div className="flex items-center justify-center pt-1 pb-1">
          <TetherPlusLogo size="md" showTagline={true} />
        </div>

        {/* Header Tabs */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex gap-2 bg-[#050911] p-1 rounded-xl border border-slate-800">
            <button
              type="button"
              onClick={() => setMode('login')}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                mode === 'login'
                  ? 'bg-cyan-500 text-black shadow-[0_0_10px_rgba(6,182,212,0.4)]'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Login</span>
            </button>
            <button
              type="button"
              onClick={() => setMode('register')}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                mode === 'register'
                  ? 'bg-emerald-500 text-black shadow-[0_0_10px_rgba(16,185,129,0.4)]'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Sign Up</span>
            </button>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white font-bold text-sm p-1 rounded-lg hover:bg-slate-800"
          >
            ✕
          </button>
        </div>

        {/* LOGIN MODE */}
        {mode === 'login' && (
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1">
              <h3 className="text-base font-bold text-cyan-300 flex items-center gap-2">
                <Shield className="w-4 h-4 text-cyan-400" />
                <span>Login to Cyber Node</span>
              </h3>
              <p className="text-[11px] text-slate-400">
                Enter your assigned Node ID (e.g. NX-1002) or registered email address.
              </p>
            </div>

            <div>
              <label className="text-xs text-slate-300 font-bold block mb-1">
                Node ID or Email Address
              </label>
              <input
                type="text"
                value={loginInput}
                onChange={(e) => setLoginInput(e.target.value)}
                placeholder="e.g. NX-1002 or user@domain.com"
                className="w-full bg-[#050911] border border-slate-700 rounded-xl px-3 py-2.5 text-cyan-300 font-mono text-xs focus:outline-none focus:border-cyan-500"
                required
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs text-slate-300 font-bold block">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setMode('forgot');
                    setForgotStep(1);
                    if (loginInput) setForgotInput(loginInput);
                  }}
                  className="text-[11px] text-cyan-400 hover:underline font-semibold"
                >
                  Forgot password?
                </button>
              </div>
              <input
                type="password"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                placeholder="Enter your account password"
                className="w-full bg-[#050911] border border-slate-700 rounded-xl px-3 py-2.5 text-cyan-300 font-mono text-xs focus:outline-none focus:border-cyan-500"
                required
              />
            </div>

            {/* Quick Select Existing Demo Accounts */}
            <div className="space-y-1.5 pt-1">
              <span className="text-[10px] text-slate-500 uppercase font-bold block">
                Quick Select Node Account:
              </span>
              <div className="grid grid-cols-2 gap-1.5 max-h-28 overflow-y-auto pr-1">
                {users.slice(0, 6).map((u) => (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => setLoginInput(u.nodeId)}
                    className="text-left px-2 py-1 bg-[#050911] hover:bg-slate-800 border border-slate-800 rounded-lg text-[10px] text-slate-300 truncate transition"
                  >
                    <span className="text-cyan-400 font-bold">#{u.nodeId}</span>
                    <span className="text-slate-500 ml-1">({u.name.split(' ')[0]})</span>
                  </button>
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoggingIn}
              className="w-full py-3 bg-gradient-to-r from-cyan-500 to-emerald-500 text-black font-extrabold text-xs rounded-xl shadow-[0_0_20px_rgba(6,182,212,0.3)] hover:brightness-110 transition flex items-center justify-center gap-2"
            >
              {isLoggingIn ? 'Authenticating...' : 'Access Account Node'}
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        )}

        {/* FORGOT PASSWORD MODE */}
        {mode === 'forgot' && (
          <div className="space-y-4">
            <div className="space-y-1">
              <h3 className="text-base font-bold text-amber-300 flex items-center gap-2">
                <Shield className="w-4 h-4 text-amber-400" />
                <span>Reset Account Password</span>
              </h3>
              <p className="text-[11px] text-slate-400">
                {forgotStep === 1
                  ? 'Enter your registered Node ID or email address to receive a 6-digit OTP code.'
                  : `Enter the 6-digit OTP code sent to ${forgotTargetEmail || forgotInput} and set your new password.`}
              </p>
            </div>

            {forgotStep === 1 ? (
              <form onSubmit={handleRequestOtp} className="space-y-3">
                <div>
                  <label className="text-xs text-slate-300 font-bold block mb-1">
                    Node ID or Email Address
                  </label>
                  <input
                    type="text"
                    value={forgotInput}
                    onChange={(e) => setForgotInput(e.target.value)}
                    placeholder="e.g. NX-1002 or user@domain.com"
                    className="w-full bg-[#050911] border border-slate-700 rounded-xl px-3 py-2.5 text-amber-300 font-mono text-xs focus:outline-none focus:border-amber-500"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={isForgotLoading}
                  className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-xs rounded-xl shadow-[0_0_15px_rgba(245,158,11,0.3)] transition flex items-center justify-center gap-2"
                >
                  {isForgotLoading ? 'Sending Reset Code...' : 'Request 6-Digit OTP'}
                  <ArrowRight className="w-4 h-4" />
                </button>

                <div className="text-center pt-1">
                  <button
                    type="button"
                    onClick={() => setMode('login')}
                    className="text-xs text-slate-400 hover:text-white underline font-medium"
                  >
                    ← Back to Login
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleResetPasswordSubmit} className="space-y-3">
                <div>
                  <label className="text-xs text-slate-300 font-bold block mb-1">
                    6-Digit OTP Code
                  </label>
                  <input
                    type="text"
                    value={resetOtp}
                    onChange={(e) => setResetOtp(e.target.value)}
                    placeholder="Enter 6-digit code"
                    className="w-full bg-[#050911] border border-slate-700 rounded-xl px-3 py-2.5 text-amber-300 font-mono text-xs focus:outline-none focus:border-amber-500 text-center tracking-widest font-extrabold"
                    required
                  />
                </div>

                <div>
                  <label className="text-xs text-slate-300 font-bold block mb-1">
                    New Password
                  </label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password (min 4 chars)"
                    className="w-full bg-[#050911] border border-slate-700 rounded-xl px-3 py-2.5 text-amber-300 font-mono text-xs focus:outline-none focus:border-amber-500"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={isForgotLoading}
                  className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold text-xs rounded-xl shadow-[0_0_15px_rgba(16,185,129,0.3)] transition flex items-center justify-center gap-2"
                >
                  {isForgotLoading ? 'Updating Password...' : 'Confirm & Update Password'}
                  <CheckCircle2 className="w-4 h-4" />
                </button>

                <div className="flex items-center justify-between text-xs pt-1">
                  <button
                    type="button"
                    onClick={() => setForgotStep(1)}
                    className="text-slate-400 hover:text-white underline"
                  >
                    Resend Code
                  </button>
                  <button
                    type="button"
                    onClick={() => setMode('login')}
                    className="text-slate-400 hover:text-white underline"
                  >
                    Back to Login
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        {/* REGISTER MODE */}
        {mode === 'register' && (
          <form onSubmit={handleRegister} className="space-y-3.5">
            <div className="space-y-1">
              <h3 className="text-base font-bold text-emerald-300 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-400" />
                <span>Register New Member Node</span>
              </h3>
              <p className="text-[11px] text-slate-400">
                Join the TetherPlus matrix protocol under your sponsor.
              </p>
            </div>

            <div>
              <label className="text-xs text-slate-300 font-bold block mb-1">
                Full Name *
              </label>
              <input
                type="text"
                value={regName}
                onChange={(e) => setRegName(e.target.value)}
                placeholder="e.g. Rahul Sharma"
                className="w-full bg-[#050911] border border-slate-700 rounded-xl px-3 py-2 text-white font-sans text-xs focus:outline-none focus:border-emerald-500"
                required
              />
            </div>

            <div>
              <label className="text-xs text-slate-300 font-bold block mb-1">
                Email Address *
              </label>
              <input
                type="email"
                value={regEmail}
                onChange={(e) => setRegEmail(e.target.value)}
                placeholder="e.g. rahul@gmail.com"
                className="w-full bg-[#050911] border border-slate-700 rounded-xl px-3 py-2 text-cyan-300 font-mono text-xs focus:outline-none focus:border-emerald-500"
                required
              />
            </div>

            <div>
              <label className="text-xs text-slate-300 font-bold block mb-1">
                Create Custom Password *
              </label>
              <input
                type="password"
                value={regPassword}
                onChange={(e) => setRegPassword(e.target.value)}
                placeholder="Set custom password (min. 4 characters)"
                className="w-full bg-[#050911] border border-slate-700 rounded-xl px-3 py-2 text-cyan-300 font-mono text-xs focus:outline-none focus:border-emerald-500"
                required
              />
              <span className="text-[10px] text-emerald-400/90 mt-1 block">
                • Minimum 4 characters (Letters, Numbers & Special Symbols allowed, up to 64 chars)
              </span>
            </div>

            <div>
              <label className="text-xs text-slate-300 font-bold block mb-1">
                Sponsor Node ID (Referrer)
              </label>
              <input
                type="text"
                value={regSponsorNodeId}
                onChange={(e) => setRegSponsorNodeId(e.target.value)}
                placeholder="Defaults to NX-ROOT01"
                className="w-full bg-[#050911] border border-slate-700 rounded-xl px-3 py-2 text-amber-300 font-mono text-xs focus:outline-none focus:border-emerald-500"
              />
              <span className="text-[10px] text-slate-500 mt-0.5 block">
                Leave empty for root node placement.
              </span>
            </div>

            <div>
              <label className="text-xs text-slate-300 font-bold block mb-1">
                BEP-20 Wallet Address (Optional)
              </label>
              <input
                type="text"
                value={regWallet}
                onChange={(e) => setRegWallet(e.target.value)}
                placeholder="0x..."
                className="w-full bg-[#050911] border border-slate-700 rounded-xl px-3 py-2 text-slate-300 font-mono text-xs focus:outline-none focus:border-emerald-500"
              />
            </div>

            <button
              type="submit"
              disabled={isRegistering}
              className="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-black font-extrabold text-xs rounded-xl shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:brightness-110 transition flex items-center justify-center gap-2 pt-1"
            >
              {isRegistering ? 'Generating Node...' : 'Complete Sign Up & Generate Node'}
              <UserCheck className="w-4 h-4" />
            </button>
          </form>
        )}
      </div>
    </div>
  </div>
);
};
