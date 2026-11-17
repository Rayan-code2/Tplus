import React from 'react';
import {
  LayoutDashboard,
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
  Rocket,
  Sparkles,
  Layers,
  Footprints,
  Crown,
} from 'lucide-react';
import { User, SystemSettings } from '../types';
import { getMainWalletUsdt, isGameEnabled, isGameRouteTab } from '../utils/subdomainRouter';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  user: User;
  settings?: SystemSettings | null;
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
  settings,
  isAdminView,
  isMobileDrawerOpen,
  onCloseMobileDrawer,
  onOpenTournament,
  onLogout,
}) => {
  const allGameNavItems = [
    {
      id: 'dashboard',
      label: 'Casino Lobby',
      icon: LayoutDashboard,
      badge: 'LOBBY',
    },
    {
      id: 'cricket',
      label: 'Cricket Fantasy 11',
      icon: Trophy,
      badge: 'DREAM 11',
      highlight: true,
    },
    {
      id: 'aviator',
      label: 'Aviator Crash',
      icon: Rocket,
      badge: '100X HOT',
      highlight: true,
    },
    {
      id: 'colorprediction',
      label: 'Color Win Go',
      icon: Dices,
      badge: '9X WIN',
      highlight: true,
    },
    {
      id: 'dragontiger',
      label: 'Dragon vs Tiger',
      icon: Flame,
      badge: '2X LIVE',
      highlight: true,
    },
    {
      id: 'luckydraw',
      label: 'Lucky Draw',
      icon: Ticket,
      badge: 'JACKPOT',
      highlight: true,
    },
    {
      id: 'spinwheel',
      label: 'Spin & Win',
      icon: Disc,
      badge: `${user?.spinCredits || 0} SPINS`,
      highlight: true,
    },
    {
      id: 'slot777',
      label: '777 Vegas Slots',
      icon: Sparkles,
      badge: '50X MEGA',
      highlight: true,
    },
    {
      id: 'rummy',
      label: 'Indian Rummy',
      icon: Layers,
      badge: '13-CARD',
      highlight: true,
    },
    {
      id: 'chickenroad',
      label: 'Chicken Road',
      icon: Footprints,
      badge: '55X CRASH',
      highlight: true,
    },
    {
      id: 'tournament',
      label: 'Daily Tournament',
      icon: Trophy,
      badge: '₹25K+ POT',
      highlight: true,
      customAction: true,
    },
  ];

  const gameNavItems = allGameNavItems.filter(
    (item) => !isGameRouteTab(item.id) || isGameEnabled(item.id, settings)
  );

  const financialNavItems = [
    {
      id: 'account',
      label: 'My Account',
      icon: Users,
      badge: 'PROFILE',
      highlight: true,
    },
    {
      id: 'finance',
      label: 'Wallet & Cashier',
      icon: ArrowLeftRight,
      badge: 'INSTANT',
    },
    {
      id: 'vip',
      label: 'VIP Privileges',
      icon: Crown,
      badge: 'CLUB',
      highlight: true,
    },
  ];

  const affiliateNavItems = [
    {
      id: 'agency',
      label: '5-Level Agent Agency',
      icon: Users,
      badge: 'COMMISSION',
      highlight: true,
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

  const renderNavGroup = (items: typeof gameNavItems, title: string) => (
    <div className="space-y-1">
      <div className="text-[10px] text-slate-500 uppercase tracking-widest px-3 mb-1 font-bold">
        {title}
      </div>
      {items.map((item) => {
        const Icon = item.icon;
        const isActive = activeTab === item.id && !isAdminView;
        return (
          <button
            key={item.id}
            onClick={() => handleSelect(item.id)}
            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition duration-200 group ${
              isActive
                ? 'bg-gradient-to-r from-amber-500/20 via-yellow-500/15 to-orange-500/10 border border-amber-500/50 text-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.25)]'
                : 'hover:bg-slate-800/60 text-slate-300 hover:text-white border border-transparent'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <Icon
                className={`w-4 h-4 transition ${
                  isActive
                    ? 'text-amber-400 scale-110'
                    : 'text-slate-400 group-hover:text-amber-400'
                }`}
              />
              <span className="font-bold text-xs">{item.label}</span>
            </div>
            {item.badge && (
              <span
                className={`text-[9px] px-2 py-0.5 rounded-full font-black border ${
                  item.highlight
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-[0_0_8px_rgba(245,158,11,0.25)]'
                    : isActive
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                    : 'bg-slate-800 text-slate-400 border-slate-700'
                }`}
              >
                {item.badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );

  const renderContent = () => (
    <div className="flex flex-col justify-between h-full space-y-4">
      <div className="space-y-4 overflow-y-auto pr-1">
        {/* VIP Gamer Profile Summary Card */}
        <div className="bg-gradient-to-br from-[#121927] to-[#0a101a] border border-amber-500/30 rounded-2xl p-3.5 relative overflow-hidden shadow-[0_0_20px_rgba(0,0,0,0.5)]">
          <div className="absolute top-0 right-0 w-20 h-20 bg-amber-500/10 rounded-full blur-xl pointer-events-none" />
          
          <div
            onClick={() => handleSelect('account')}
            className="flex items-center gap-2.5 mb-2.5 cursor-pointer hover:opacity-90 transition"
            title="Open My Account"
          >
            <div className="relative">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 via-yellow-500 to-orange-600 p-[1.5px] shadow-[0_0_10px_rgba(245,158,11,0.4)]">
                <div className="w-full h-full bg-[#0d1420] rounded-[10px] flex items-center justify-center text-amber-300 font-black text-xs">
                  👑
                </div>
              </div>
              <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-emerald-500 border-2 border-[#09111c] rounded-full" />
            </div>

            <div className="truncate">
              <div className="flex items-center gap-1.5">
                <span className="text-white font-extrabold text-xs">#{user?.nodeId || 'VIP-01'}</span>
                <span className="text-[9px] bg-amber-500/20 border border-amber-500/40 text-amber-300 px-1.5 py-0.2 rounded font-black">
                  VIP
                </span>
              </div>
              <div className="text-slate-400 text-[11px] truncate">
                {user?.name || 'Pro Gamer'}
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs">
            <div>
              <span className="text-[9px] text-slate-400 uppercase block font-semibold">Main Wallet</span>
              <span className="text-sm font-black text-amber-300 font-mono">
                ₹{getMainWalletUsdt(user).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
            <button
              onClick={() => handleSelect('finance')}
              className="px-2.5 py-1 rounded-lg bg-amber-500/20 border border-amber-500/40 text-amber-300 hover:bg-amber-500/30 font-bold text-[10px] transition"
            >
              + Deposit
            </button>
          </div>
        </div>

        {/* Navigation Categories */}
        <nav className="space-y-4">
          {renderNavGroup(gameNavItems, 'Casino & Games')}
          {renderNavGroup(financialNavItems, 'Cashier & Wallet')}
          {renderNavGroup(affiliateNavItems, 'Affiliate Partner')}
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
                SportX Menu
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

