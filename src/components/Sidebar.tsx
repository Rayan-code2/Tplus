import React from 'react';
import {
  LayoutDashboard,
  GitFork,
  ArrowLeftRight,
  Disc,
  Shield,
  Award,
  Users,
  ChevronRight,
  ShoppingBag,
  Ticket,
  Dices,
  Flame,
  X,
  Trophy,
  LogOut,
} from 'lucide-react';
import { User } from '../types';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  user: User;
  isAdminView: boolean;
  isMobileDrawerOpen?: boolean;
  onCloseMobileDrawer?: () => void;
  onOpenTournament?: () => void;
  onLogout?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  user,
  isAdminView,
  isMobileDrawerOpen,
  onCloseMobileDrawer,
  onOpenTournament,
  onLogout,
}) => {
  const navItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      badge: 'Mine ROI',
    },
    {
      id: 'tournament',
      label: 'Daily Tournament',
      icon: Trophy,
      badge: '$250+ Pot',
      highlight: true,
      customAction: true,
    },
    {
      id: 'matrix',
      label: 'Matrix Network',
      icon: GitFork,
      badge: `${user?.directReferralsCount || 0} Directs`,
    },
    {
      id: 'agency',
      label: '5-Level Referral',
      icon: Users,
      badge: 'Agent Income',
      highlight: true,
    },
    {
      id: 'luckydraw',
      label: 'Lucky Draw',
      icon: Ticket,
      badge: 'Win USDT',
      highlight: true,
    },
    {
      id: 'dragontiger',
      label: 'Dragon vs Tiger',
      icon: Flame,
      badge: '2X / 8X',
      highlight: true,
    },
    {
      id: 'colorprediction',
      label: 'Color Prediction',
      icon: Dices,
      badge: 'Win Go 9x',
      highlight: true,
    },
    {
      id: 'spinwheel',
      label: 'Spin Wheel',
      icon: Disc,
      badge: `${user?.spinCredits || 0} Spins`,
      highlight: true,
    },
    {
      id: 'store',
      label: 'TetherMart Store',
      icon: ShoppingBag,
      badge: 'Discounts',
      highlight: true,
    },
    {
      id: 'finance',
      label: 'Deposit & Withdraw',
      icon: ArrowLeftRight,
    },
    {
      id: 'rankrewards',
      label: 'MLM Rank Rewards',
      icon: Award,
      badge: user?.rank && !['None', 'Unranked', 'No Rank', ''].includes(user.rank) ? user.rank : 'MLM Ranks',
    },
  ];

  const handleSelect = (tabId: string) => {
    if (tabId === 'tournament') {
      if (onOpenTournament) onOpenTournament();
      if (onCloseMobileDrawer) onCloseMobileDrawer();
      return;
    }
    setActiveTab(tabId);
    if (onCloseMobileDrawer) onCloseMobileDrawer();
  };

  const renderContent = () => (
    <div className="flex flex-col justify-between h-full space-y-6">
      <div className="space-y-6">
        {/* Node Profile Summary Card */}
        <div className="bg-[#0c1524] border border-cyan-500/30 rounded-2xl p-4 relative overflow-hidden shadow-[0_0_15px_rgba(6,182,212,0.1)]">
          <div className="absolute top-0 right-0 w-16 h-16 bg-cyan-500/10 rounded-full blur-xl pointer-events-none" />
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 via-indigo-600 to-emerald-500 flex items-center justify-center text-white font-bold text-sm shadow-[0_0_10px_rgba(6,182,212,0.4)]">
              #{user?.nodeId ? user.nodeId.substring(3, 5) : '00'}
            </div>
            <div>
              <div className="text-cyan-300 font-bold text-sm flex items-center gap-1">
                <span>#{user?.nodeId || 'N/A'}</span>
              </div>
              <div className="text-slate-400 text-xs truncate max-w-[140px]">
                {user?.name || 'User'}
              </div>
            </div>
          </div>
          <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs">
            <span className="text-slate-400">Rank:</span>
            {user?.rank && !['None', 'Unranked', 'No Rank', ''].includes(user.rank) ? (
              <span className="text-amber-400 font-bold flex items-center gap-1">
                <Award className="w-3.5 h-3.5" />
                {user.rank}
              </span>
            ) : (
              <span className="text-slate-500 font-medium">None</span>
            )}
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="space-y-1.5">
          <div className="text-[10px] text-slate-500 uppercase tracking-widest px-3 mb-2 font-semibold">
            Protocol Navigation
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id && !isAdminView;
            return (
              <button
                key={item.id}
                onClick={() => handleSelect(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl transition duration-200 group ${
                  isActive
                    ? 'bg-gradient-to-r from-cyan-500/20 to-indigo-500/10 border border-cyan-500/50 text-cyan-300 shadow-[0_0_15px_rgba(6,182,212,0.2)]'
                    : 'hover:bg-slate-800/50 text-slate-400 hover:text-slate-200 border border-transparent'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={`w-4 h-4 transition ${
                      isActive
                        ? 'text-cyan-400 scale-110'
                        : 'text-slate-500 group-hover:text-cyan-400'
                    }`}
                  />
                  <span className="font-semibold text-xs">{item.label}</span>
                </div>
                {item.badge && (
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${
                      item.highlight
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-[0_0_8px_rgba(245,158,11,0.2)]'
                        : isActive
                        ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30'
                        : 'bg-slate-800 text-slate-400 border-slate-700'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}

          {/* Admin Control Link (Only for Admins) */}
          {(user?.isAdmin || user?.nodeId === 'NX-ROOT01') && (
            <div className="pt-4">
              <div className="text-[10px] text-slate-500 uppercase tracking-widest px-3 mb-2 font-semibold">
                Administration
              </div>
              <button
                onClick={() => handleSelect('admin')}
                className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl transition duration-200 border ${
                  activeTab === 'admin' || isAdminView
                    ? 'bg-amber-500/20 border-amber-500/50 text-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.2)]'
                    : 'hover:bg-slate-800/50 text-slate-400 hover:text-slate-200 border border-transparent'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Shield className="w-4 h-4 text-amber-400" />
                  <span className="font-semibold text-xs">Admin Control Panel</span>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-500" />
              </button>
            </div>
          )}
        </nav>
      </div>

      {/* Network Status Footer & Logout */}
      <div className="pt-4 border-t border-slate-800/80 text-[11px] text-slate-500 space-y-2">
        <div className="flex justify-between items-center">
          <span>Uptime:</span>
          <span className="text-emerald-400 font-bold">99.99%</span>
        </div>
        <div className="flex justify-between items-center">
          <span>Contract:</span>
          <span className="text-cyan-400 truncate max-w-[100px]">Verified</span>
        </div>

        {onLogout && (
          <button
            onClick={() => {
              if (onCloseMobileDrawer) onCloseMobileDrawer();
              onLogout();
            }}
            className="w-full mt-2 flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 text-xs font-bold transition shadow-[0_0_10px_rgba(239,68,68,0.1)]"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Logout Account</span>
          </button>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <aside className="hidden md:flex md:w-64 bg-[#080d14]/90 border-r border-cyan-500/20 p-4 flex-col justify-between font-mono text-sm shrink-0">
        {renderContent()}
      </aside>

      {/* Mobile Slide-Over Drawer Modal */}
      {isMobileDrawerOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          {/* Backdrop Overlay */}
          <div
            className="fixed inset-0 bg-black/80 backdrop-blur-sm"
            onClick={onCloseMobileDrawer}
          />

          {/* Drawer Container */}
          <div className="relative w-4/5 max-w-xs bg-[#080d14] border-r border-cyan-500/40 p-5 flex flex-col justify-between z-10 font-mono shadow-2xl h-full overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <span className="text-xs font-bold text-cyan-300 uppercase tracking-widest">
                TetherPlus Menu
              </span>
              <button
                onClick={onCloseMobileDrawer}
                className="p-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            {renderContent()}
          </div>
        </div>
      )}
    </>
  );
};

