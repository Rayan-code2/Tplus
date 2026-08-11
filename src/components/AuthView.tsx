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
  Eye,
  EyeOff,
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
  const [mode, setMode] = useState<'login' | 'register' | 'forgot'>('login');

  // Password Visibility States
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  // Login Form
  const [loginInput, setLoginInput] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Forgot / Reset Password Form
  const [forgotInput, setForgotInput] = useState('');
  const [resetOtp, setResetOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [forgotStep, setForgotStep] = useState<1 | 2>(1);
  const [isForgotLoading, setIsForgotLoading] = useState(false);

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

      if (data.user?.id) {
        localStorage.setItem('tp_user_id', data.user.id);
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

      if (data.user?.id) {
        localStorage.setItem('tp_user_id', data.user.id);
      }

      showToast(`Account Created! Node ID is #${data.user.nodeId}`, 'success');
      onLoginSuccess();
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

      if (data.otpDemo) {
        showToast(`OTP Code sent! Demo OTP: ${data.otpDemo}`, 'success');
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

                <div className="gaurav-input-box relative">
                  <input
                    type={showLoginPassword ? 'text' : 'password'}
                    required
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    className={loginPassword ? 'has-value pr-10' : 'pr-10'}
                  />
                  <label>Password</label>
                  <button
                    type="button"
                    onClick={() => setShowLoginPassword(!showLoginPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-cyan-400 hover:text-cyan-300 z-10 p-1"
                  >
                    {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                <div className="gaurav-forgot-pass">
                  <a
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      setMode('forgot');
                      setForgotStep(1);
                      if (loginInput) setForgotInput(loginInput);
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
            ) : mode === 'forgot' ? (
              <div className="space-y-3 py-1">
                <h2 className="text-xl sm:text-2xl font-extrabold text-[#0ef] tracking-tight mb-1 text-center">
                  Reset Password
                </h2>

                {forgotStep === 1 ? (
                  <form onSubmit={handleRequestOtp} className="space-y-3">
                    <p className="text-[11px] text-slate-300 text-center leading-snug">
                      Enter your Node ID or GoDaddy custom email address to receive a 6-digit verification OTP.
                    </p>

                    <div className="gaurav-input-box">
                      <input
                        type="text"
                        required
                        value={forgotInput}
                        onChange={(e) => setForgotInput(e.target.value)}
                        className={forgotInput ? 'has-value' : ''}
                      />
                      <label>Email / Node ID</label>
                    </div>

                    <button
                      type="submit"
                      disabled={isForgotLoading}
                      className="gaurav-btn flex items-center justify-center gap-2 mt-2"
                    >
                      {isForgotLoading ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin text-[#1f293a]" />
                          <span>Sending OTP...</span>
                        </>
                      ) : (
                        'Send Reset Code'
                      )}
                    </button>

                    <div className="gaurav-signup-link">
                      <button type="button" onClick={() => setMode('login')}>
                        Back to Login
                      </button>
                    </div>
                  </form>
                ) : (
                  <form onSubmit={handleResetPasswordSubmit} className="space-y-3">
                    <p className="text-[11px] text-emerald-300 text-center leading-snug font-mono">
                      Enter the 6-digit OTP sent to {forgotInput} and set your new password.
                    </p>

                    <div className="gaurav-input-box">
                      <input
                        type="text"
                        required
                        value={resetOtp}
                        onChange={(e) => setResetOtp(e.target.value)}
                        className={resetOtp ? 'has-value' : ''}
                      />
                      <label>6-Digit OTP Code</label>
                    </div>

                    <div className="gaurav-input-box relative">
                      <input
                        type={showNewPassword ? 'text' : 'password'}
                        required
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className={newPassword ? 'has-value pr-10' : 'pr-10'}
                      />
                      <label>New Password</label>
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-cyan-400 hover:text-cyan-300 z-10 p-1"
                      >
                        {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>

                    <button
                      type="submit"
                      disabled={isForgotLoading}
                      className="gaurav-btn flex items-center justify-center gap-2 mt-2"
                    >
                      {isForgotLoading ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin text-[#1f293a]" />
                          <span>Updating...</span>
                        </>
                      ) : (
                        'Update Password'
                      )}
                    </button>

                    <div className="gaurav-signup-link">
                      <button
                        type="button"
                        onClick={() => {
                          setForgotStep(1);
                        }}
                      >
                        Resend OTP Code
                      </button>
                    </div>
                  </form>
                )}
              </div>
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

                <div className="gaurav-input-box relative">
                  <input
                    type={showRegPassword ? 'text' : 'password'}
                    required
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    className={regPassword ? 'has-value pr-10' : 'pr-10'}
                  />
                  <label>Password</label>
                  <button
                    type="button"
                    onClick={() => setShowRegPassword(!showRegPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-cyan-400 hover:text-cyan-300 z-10 p-1"
                  >
                    {showRegPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
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
