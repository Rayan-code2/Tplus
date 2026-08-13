import React, { useState } from 'react';
import { TetherPlusLogo } from './TetherPlusLogo';
import {
  Wallet,
  Shield,
  Activity,
  User as UserIcon,
  Copy,
  Check,
  LogOut,
  Sliders,
  Bell,
  ExternalLink,
  ChevronDown,
  LogIn,
  UserPlus,
  Key,
  Disc,
  Eye,
  EyeOff,
  Menu,
  PlusCircle,
  ArrowUpRight,
} from 'lucide-react';
import { User, SystemSettings } from '../types';

interface HeaderBarProps {
  user: User;
  users: User[];
  settings: SystemSettings;
  isAdminView: boolean;
  setIsAdminView: (val: boolean) => void;
  onSwitchUser: (userId: string) => void;
  onOpenDeposit: () => void;
  onOpenWithdraw: () => void;
  onOpenAuthModal: () => void;
  onLogout?: () => void;
  onSelectTab?: (tab: string) => void;
  onToggleMobileDrawer?: () => void;
}

export const HeaderBar: React.FC<HeaderBarProps> = ({
  user,
  users,
  settings,
  isAdminView,
  setIsAdminView,
  onSwitchUser,
  onOpenDeposit,
  onOpenWithdraw,
  onOpenAuthModal,
  onLogout,
  onSelectTab,
  onToggleMobileDrawer,
}) => {
  const [copied, setCopied] = useState(false);

  // Change Password Modal State
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [currentPassInput, setCurrentPassInput] = useState('');
  const [newPassInput, setNewPassInput] = useState('');
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [passError, setPassError] = useState('');
  const [passSuccess, setPassSuccess] = useState('');

  const handleCopyNodeId = () => {
    navigator.clipboard.writeText(user.nodeId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleChangePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPassError('');
    setPassSuccess('');
    try {
      const res = await fetch('/api/user/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword: currentPassInput,
          newPassword: newPassInput,
        }),
      });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || 'Failed to change password');
      setPassSuccess(data.message || 'Password changed successfully!');
      setTimeout(() => {
        setShowPasswordModal(false);
        setCurrentPassInput('');
        setNewPassInput('');
        setPassSuccess('');
      }, 1500);
    } catch (err: any) {
      setPassError(err.message || 'Failed to change password');
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-[#0b1320]/95 backdrop-blur-md border-b border-cyan-500/20 shadow-[0_4px_20px_rgba(0,0,0,0.5)]">
      {/* Dynamic Marquee Ticker */}
      <div className="bg-[#050911] border-b border-cyan-500/10 py-1.5 px-3 overflow-hidden text-[11px] text-cyan-400 font-mono flex items-center gap-2">
        <span className="bg-cyan-500/10 border border-cyan-500/30 px-2 py-0.5 rounded text-[9px] font-bold text-cyan-300 uppercase tracking-wider shrink-0 flex items-center gap-1.5 z-10 shadow-[0_0_10px_rgba(6,182,212,0.2)]">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          Live
        </span>
        <div className="overflow-hidden relative w-full flex items-center">
          <div className="animate-marquee flex items-center gap-8 text-slate-300 shrink-0">
            <span className="font-bold text-cyan-300">
              {(settings?.tickerText || '⚡ LIVE TETHERPLUS NETWORK: BTC/USDT $96,420 (+4.2%) | ETH/USDT $3,450 (+2.8%) | 🚀 GLOBAL YIELD POOL: $1,485,200 USDT ⚡').replace(/CRYPTOSPIRAL/gi, 'TETHERPLUS')}
            </span>
            <span>•</span>
            <span className="text-emerald-400 font-semibold">BEP-20 Gas: 3 Gwei</span>
            <span>•</span>
            <span className="text-cyan-400 font-bold">LIVE TETHERPLUS NETWORK</span>
            <span>•</span>
            <span className="text-amber-400 font-bold">24/7 AUTOMATED SMART CONTRACT YIELD</span>
            <span>•</span>
            <span className="font-bold text-cyan-300">
              {(settings?.tickerText || '⚡ LIVE TETHERPLUS NETWORK: BTC/USDT $96,420 (+4.2%) | ETH/USDT $3,450 (+2.8%) | 🚀 GLOBAL YIELD POOL: $1,485,200 USDT ⚡').replace(/CRYPTOSPIRAL/gi, 'TETHERPLUS')}
            </span>
            <span>•</span>
            <span className="text-emerald-400 font-semibold">BEP-20 Gas: 3 Gwei</span>
            <span>•</span>
            <span className="text-cyan-400 font-bold">LIVE TETHERPLUS NETWORK</span>
            <span>•</span>
            <span className="text-amber-400 font-bold">24/7 AUTOMATED SMART CONTRACT YIELD</span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-14 md:h-16 flex items-center justify-between gap-2">
        {/* Mobile Menu Button & Brand Logo */}
        <div className="flex items-center gap-2 sm:gap-3">
          {onToggleMobileDrawer && (
            <button
              onClick={onToggleMobileDrawer}
              className="md:hidden p-2 rounded-xl bg-slate-800/80 border border-slate-700 text-cyan-400 hover:bg-slate-700 transition"
              title="Open Navigation Menu"
            >
              <Menu className="w-5 h-5" />
            </button>
          )}

          <TetherPlusLogo size="md" showTagline={true} />
          <span className="hidden xl:inline-block text-[10px] bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 px-2 py-0.5 rounded-full font-mono font-semibold self-center">
            v3.8 WEB3
          </span>
        </div>

        {/* Desktop Network & Wallet Quick Status */}
        <div className="hidden lg:flex items-center gap-2 bg-[#0d1726] border border-cyan-500/20 px-3 py-1.5 rounded-xl font-mono text-xs">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#10b981]" />
            <span className="text-slate-300">BSC</span>
          </div>
          <span className="text-slate-600">|</span>
          <div className="text-cyan-300 font-semibold flex items-center gap-1" title="Deposit Wallet for buying packages & bets">
            <Wallet className="w-3.5 h-3.5 text-[#0ef]" />
            <span className="text-[10px] text-slate-400 uppercase">Deposit:</span>
            <span className="text-[#0ef] font-bold">${(user?.depositBalance || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
          </div>
          <span className="text-slate-600">|</span>
          <div className="text-amber-300 font-semibold flex items-center gap-1" title="Game Winning Wallet (10% Fee, No MLM limits)">
            <span className="text-[10px] text-amber-400 uppercase font-bold">🎮 Winning:</span>
            <span className="text-amber-300 font-bold">${(user?.winningBalance || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
          </div>
          <span className="text-slate-600">|</span>
          <div className="text-emerald-400 font-semibold flex items-center gap-1" title="Withdrawable MLM Network Balance">
            <span className="text-[10px] text-slate-400 uppercase">MLM Earned:</span>
            <span>${(user?.balance || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2.5">
          {/* Quick Deposit & Withdraw Buttons (Desktop) */}
          <button
            onClick={onOpenDeposit}
            className="hidden sm:flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 transition shadow-[0_0_10px_rgba(16,185,129,0.15)]"
          >
            Deposit
          </button>
          <button
            onClick={onOpenWithdraw}
            className="hidden sm:flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 transition"
          >
            Withdraw
          </button>

          {/* Admin Switcher Toggle (Only visible for Admin Nodes) */}
          {(user?.isAdmin || user?.nodeId === 'NX-ROOT01') && (
            <button
              onClick={() => setIsAdminView(!isAdminView)}
              className={`flex items-center gap-1 text-[11px] sm:text-xs font-semibold px-2 py-1 sm:px-3 sm:py-1.5 rounded-lg transition border font-mono ${
                isAdminView
                  ? 'bg-amber-500/20 border-amber-500/60 text-amber-300 shadow-[0_0_12px_rgba(245,158,11,0.3)]'
                  : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:text-white'
              }`}
            >
              <Shield className="w-3.5 h-3.5 text-amber-400" />
              <span>{isAdminView ? 'User' : 'Admin'}</span>
            </button>
          )}

          {/* Account Security & Logout Button */}
          <div className="flex items-center gap-1.5 font-mono text-xs">
            <button
              onClick={() => setShowPasswordModal(true)}
              className="p-1.5 rounded-xl bg-slate-800/80 border border-slate-700 text-slate-300 hover:text-cyan-300 hover:border-cyan-500/40 transition flex items-center justify-center"
              title="Change Account Password"
            >
              <Key className="w-4 h-4 text-cyan-400" />
            </button>

            {onLogout && (
              <button
                onClick={onLogout}
                className="flex items-center gap-1 text-[11px] sm:text-xs font-bold px-2 py-1.5 sm:px-3 sm:py-1.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/40 transition shadow-[0_0_10px_rgba(239,68,68,0.15)]"
                title="Logout"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Wallet Balance Bar (Visible on Mobile Screens < 1024px) */}
      <div className="lg:hidden bg-[#070e1b] border-t border-cyan-500/10 px-2 py-1.5 flex items-center justify-between text-[11px] font-mono overflow-x-auto">
        <div className="flex items-center gap-2 shrink-0">
          <div className="flex items-center gap-1 text-cyan-300">
            <span className="text-[9px] text-slate-400">Dep:</span>
            <strong className="text-cyan-400 font-bold">${(user?.depositBalance || 0).toFixed(2)}</strong>
          </div>
          <div className="h-3 w-[1px] bg-slate-800" />
          <div className="flex items-center gap-1 text-amber-300">
            <span className="text-[9px] text-amber-400 font-bold">🎮 Win:</span>
            <strong className="text-amber-300 font-bold">${(user?.winningBalance || 0).toFixed(2)}</strong>
          </div>
          <div className="h-3 w-[1px] bg-slate-800" />
          <div className="flex items-center gap-1 text-emerald-400">
            <span className="text-[9px] text-slate-400">MLM:</span>
            <strong className="text-emerald-400 font-bold">${(user?.balance || 0).toFixed(2)}</strong>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={onOpenDeposit}
            className="px-2 py-0.5 rounded-md bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-[10px] font-bold"
          >
            + Dep
          </button>
          <button
            onClick={onOpenWithdraw}
            className="px-2 py-0.5 rounded-md bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 text-[10px] font-bold"
          >
            ↑ With
          </button>
        </div>
      </div>

      {/* Change Password Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 font-mono">
          <div className="bg-[#0b1320] border border-cyan-500/40 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-[0_0_50px_rgba(6,182,212,0.3)] relative">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-cyan-300 flex items-center gap-2">
                <Key className="w-4 h-4 text-cyan-400" />
                <span>Change Account Password</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowPasswordModal(false)}
                className="text-slate-400 hover:text-white font-bold text-sm"
              >
                ✕
              </button>
            </div>

            {passError && (
              <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-xs text-red-400">
                {passError}
              </div>
            )}

            {passSuccess && (
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-xs text-emerald-400">
                {passSuccess}
              </div>
            )}

            <form onSubmit={handleChangePasswordSubmit} className="space-y-4">
              <div>
                <label className="text-xs text-slate-300 font-bold block mb-1">
                  Current Password
                </label>
                <div className="relative">
                  <input
                    type={showCurrentPass ? 'text' : 'password'}
                    value={currentPassInput}
                    onChange={(e) => setCurrentPassInput(e.target.value)}
                    placeholder="Enter current password"
                    className="w-full bg-[#050911] border border-slate-700 rounded-xl pl-3 pr-10 py-2 text-cyan-300 text-xs focus:outline-none focus:border-cyan-500 font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPass(!showCurrentPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-cyan-400 transition-colors"
                  >
                    {showCurrentPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-300 font-bold block mb-1">
                  New Password
                </label>
                <div className="relative">
                  <input
                    type={showNewPass ? 'text' : 'password'}
                    value={newPassInput}
                    onChange={(e) => setNewPassInput(e.target.value)}
                    placeholder="Enter new password (min 4 chars)"
                    className="w-full bg-[#050911] border border-slate-700 rounded-xl pl-3 pr-10 py-2 text-cyan-300 text-xs focus:outline-none focus:border-cyan-500 font-mono"
                    required
                    minLength={4}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPass(!showNewPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-cyan-400 transition-colors"
                  >
                    {showNewPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowPasswordModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-black font-extrabold rounded-xl text-xs shadow-[0_0_15px_rgba(6,182,212,0.4)]"
                >
                  Save New Password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </header>
  );
};
