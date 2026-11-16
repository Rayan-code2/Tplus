import React, { useState } from 'react';
import { TetherPlusLogo } from './TetherPlusLogo';
import { JalwaLogo } from './JalwaLogo';
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
  Eye,
  EyeOff,
  Menu,
  PlusCircle,
  ArrowUpRight,
} from 'lucide-react';
import { User, SystemSettings } from '../types';
import { getMainWalletUsdt } from '../utils/subdomainRouter';

interface HeaderBarProps {
  user?: User | null;
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
    if (!user?.nodeId) return;
    navigator.clipboard.writeText(user.nodeId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleChangePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setPassError('');
    setPassSuccess('');
    try {
      const res = await fetch('/api/user/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user.id,
        },
        body: JSON.stringify({
          userId: user.id,
          currentPassword: currentPassInput,
          newPassword: newPassInput,
        }),
      });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || 'Failed to change password');
      user.password = newPassInput.trim();
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
    <header className="sticky top-0 z-40 bg-[#090e17]/95 backdrop-blur-md border-b border-amber-500/20 shadow-[0_4px_25px_rgba(0,0,0,0.6)]">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-14 md:h-16 flex items-center justify-between gap-2">
        {/* Mobile Menu Button & Brand Logo */}
        <div className="flex items-center gap-2 sm:gap-3">
          {onToggleMobileDrawer && (
            <button
              onClick={onToggleMobileDrawer}
              className="md:hidden p-2 rounded-xl bg-slate-800/80 border border-slate-700 text-amber-400 hover:bg-slate-700 transition"
              title="Open Navigation Menu"
            >
              <Menu className="w-5 h-5" />
            </button>
          )}

          <div className="cursor-pointer" onClick={() => onSelectTab?.('dashboard')}>
            <JalwaLogo size="md" />
          </div>
        </div>


        {/* Action Controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Quick Back to Shared Front Page Button */}
          {onSelectTab && (
            <button
              onClick={() => onSelectTab('dashboard')}
              className="hidden sm:flex items-center gap-1 bg-[#0b1430] border border-slate-700 hover:border-cyan-500/50 rounded-xl px-2.5 py-1 text-[11px] font-bold text-slate-200 hover:text-cyan-300 transition active:scale-95"
              title="Return to Shared Front Page Lobby"
            >
              <span>🏠 Front Page</span>
            </button>
          )}

          {/* Unified Main Wallet Balance Pill */}
          {user && onOpenDeposit && (
            <div
              onClick={onOpenDeposit}
              className="bg-[#0b1430] border border-cyan-500/40 rounded-xl px-2.5 py-1 text-xs font-mono font-bold text-cyan-300 flex items-center gap-1.5 cursor-pointer hover:border-cyan-400 transition active:scale-95 shadow-sm"
              title="Unified Main Wallet Balance (Deposit + Winning + Bonus)"
            >
              <Wallet className="w-3.5 h-3.5 text-cyan-400" />
              <span>₹{getMainWalletUsdt(user).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
          )}

          {/* Admin Switcher Toggle (Visible for Admin and Sub-Admin Nodes) */}
          {(user?.isAdmin || user?.isSubAdmin || user?.nodeId === 'NX-ROOT01') && (
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

          {/* Account Security Key Button */}
          {user && (
            <button
              onClick={() => setShowPasswordModal(true)}
              className="p-1.5 rounded-xl bg-slate-800/80 border border-slate-700 text-slate-300 hover:text-amber-300 hover:border-amber-500/40 transition flex items-center justify-center"
              title="Change Account Password"
            >
              <Key className="w-4 h-4 text-amber-400" />
            </button>
          )}

          {/* Logout Button */}
          {onLogout && (
            <button
              onClick={onLogout}
              className="flex items-center gap-1 text-[11px] sm:text-xs font-bold px-2 py-1.5 sm:px-3 sm:py-1.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/40 transition shadow-[0_0_10px_rgba(239,68,68,0.15)] active:scale-95"
              title="Logout"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          )}
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
