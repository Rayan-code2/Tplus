import React from 'react';
import {
  Heart,
  Gift,
  Gamepad2,
  Wallet,
  User as UserIcon,
} from 'lucide-react';

import { SystemSettings } from '../types';
import { isGameEnabled } from '../utils/subdomainRouter';

interface MobileBottomNavProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  setIsAdminView: (isAdmin: boolean) => void;
  user: any;
  settings?: SystemSettings | null;
  onToggleMobileDrawer?: () => void;
  onOpenTournament?: () => void;
  onOpenDeposit?: () => void;
  onOpenWithdraw?: () => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  activeTab,
  setActiveTab,
  setIsAdminView,
  user,
  settings,
  onToggleMobileDrawer,
  onOpenTournament,
}) => {
  const isHomeActive = activeTab === 'dashboard' || activeTab === 'home';
  const isPromoActive = activeTab === 'agency' || activeTab === 'matrix';
  const isActivityActive = activeTab === 'tournament' || activeTab === 'rewards' || activeTab === 'spinwheel';
  const isWalletActive = activeTab === 'finance' || activeTab === 'wallet';
  const isAccountActive = activeTab === 'account' || activeTab === 'profile';
  const spinWheelOn = isGameEnabled('spinwheel', settings);

  return (
    <nav
      aria-label="Bottom Navigation"
      className="fixed bottom-0 left-0 right-0 z-50 bg-[#070b1a]/98 backdrop-blur-xl border-t border-cyan-500/20 px-2 py-1 shadow-[0_-10px_35px_rgba(0,0,0,0.95)]"
    >
      <div className="max-w-md mx-auto flex items-end justify-around relative">
        {/* 1. Promotion (Heart) */}
        <button
          onClick={() => {
            setActiveTab('agency');
            setIsAdminView(false);
          }}
          className={`flex-1 flex flex-col items-center justify-center py-1 transition-all duration-200 group ${
            isPromoActive ? 'text-[#22d3ee]' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <div className="relative">
            <Heart
              className={`w-5 h-5 transition-transform ${
                isPromoActive ? 'scale-110 fill-[#22d3ee]/20 stroke-[#22d3ee]' : 'stroke-current'
              }`}
            />
            <span className="absolute -top-1 -right-2 w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
          </div>
          <span className={`text-[10px] mt-1 font-medium ${isPromoActive ? 'font-bold text-[#22d3ee]' : ''}`}>
            Promotion
          </span>
        </button>

        {/* 2. Activity / Tournament or Spin Wheel (Gift) */}
        <button
          onClick={() => {
            if (spinWheelOn) {
              setActiveTab('spinwheel');
              setIsAdminView(false);
            } else if (onOpenTournament) {
              onOpenTournament();
            } else {
              setActiveTab('finance');
              setIsAdminView(false);
            }
          }}
          className={`flex-1 flex flex-col items-center justify-center py-1 transition-all duration-200 group ${
            isActivityActive ? 'text-[#22d3ee]' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Gift
            className={`w-5 h-5 transition-transform ${
              isActivityActive ? 'scale-110 text-[#22d3ee]' : 'stroke-current'
            }`}
          />
          <span className={`text-[10px] mt-1 font-medium ${isActivityActive ? 'font-bold text-[#22d3ee]' : ''}`}>
            Activity
          </span>
        </button>

        {/* 3. Center Elevated Home (Gaming Controller in Teal Dome) */}
        <div className="relative -top-3.5 flex flex-col items-center justify-center px-1">
          <button
            onClick={() => {
              setActiveTab('dashboard');
              setIsAdminView(false);
            }}
            className={`w-14 h-14 rounded-full flex items-center justify-center transition-all duration-300 shadow-[0_4px_20px_rgba(6,182,212,0.45)] border-2 ${
              isHomeActive
                ? 'bg-gradient-to-b from-[#0f434c] to-[#082a32] border-[#22d3ee] scale-105'
                : 'bg-gradient-to-b from-[#0c3138] to-[#061e24] border-cyan-500/50 hover:border-cyan-400'
            }`}
          >
            <div className="w-11 h-11 rounded-full bg-gradient-to-b from-[#155e69] to-[#0a353d] flex items-center justify-center">
              <Gamepad2
                className={`w-6 h-6 transition-transform ${
                  isHomeActive ? 'text-[#22d3ee] scale-110' : 'text-cyan-300'
                }`}
              />
            </div>
          </button>
          <span
            className={`text-[10px] mt-0.5 font-bold tracking-tight ${
              isHomeActive ? 'text-[#22d3ee]' : 'text-cyan-300/80'
            }`}
          >
            Home
          </span>
        </div>

        {/* 4. Wallet (Wallet) */}
        <button
          onClick={() => {
            setActiveTab('finance');
            setIsAdminView(false);
          }}
          className={`flex-1 flex flex-col items-center justify-center py-1 transition-all duration-200 group ${
            isWalletActive ? 'text-[#22d3ee]' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Wallet
            className={`w-5 h-5 transition-transform ${
              isWalletActive ? 'scale-110 text-[#22d3ee]' : 'stroke-current'
            }`}
          />
          <span className={`text-[10px] mt-1 font-medium ${isWalletActive ? 'font-bold text-[#22d3ee]' : ''}`}>
            Wallet
          </span>
        </button>

        {/* 5. Account (User) */}
        <button
          onClick={() => {
            setActiveTab('account');
            setIsAdminView(false);
          }}
          className={`flex-1 flex flex-col items-center justify-center py-1 transition-all duration-200 group ${
            isAccountActive ? 'text-[#22d3ee]' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <div className="relative">
            <UserIcon
              className={`w-5 h-5 transition-transform ${
                isAccountActive ? 'scale-110 text-[#22d3ee]' : 'stroke-current'
              }`}
            />
          </div>
          <span className={`text-[10px] mt-1 font-medium ${isAccountActive ? 'font-bold text-[#22d3ee]' : ''}`}>
            Account
          </span>
        </button>
      </div>
    </nav>
  );
};
