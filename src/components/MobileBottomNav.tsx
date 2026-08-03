import React from 'react';
import {
  LayoutDashboard,
  GitFork,
  Zap,
  ShoppingBag,
  Disc,
} from 'lucide-react';

interface MobileBottomNavProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  setIsAdminView: (isAdmin: boolean) => void;
  user: any;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  activeTab,
  setActiveTab,
  setIsAdminView,
  user,
}) => {
  const navItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
    },
    {
      id: 'matrix',
      label: 'Matrix',
      icon: GitFork,
    },
    {
      id: 'boosting',
      label: 'Gold Boost',
      icon: Zap,
      isGold: true,
      badge: '$50',
    },
    {
      id: 'store',
      label: 'Amazon Mall',
      icon: ShoppingBag,
      badge: 'Hot',
    },
    {
      id: 'rewards',
      label: 'Spin & Rank',
      icon: Disc,
      badge: user?.spinCredits ? `${user.spinCredits}` : undefined,
    },
  ];

  const handleTabClick = (tabId: string) => {
    setActiveTab(tabId);
    setIsAdminView(false);
  };

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#080d14]/95 backdrop-blur-xl border-t border-cyan-500/30 px-1 py-1.5 shadow-[0_-8px_30px_rgba(0,0,0,0.9)]">
      <div className="grid grid-cols-5 items-center justify-between max-w-md mx-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => handleTabClick(item.id)}
              className={`flex flex-col items-center justify-center py-1 px-0.5 rounded-xl transition-all duration-200 relative ${
                isActive
                  ? item.isGold
                    ? 'text-amber-300 font-bold bg-amber-500/15 scale-105'
                    : 'text-[#0ef] font-bold bg-[#0ef]/15 scale-105'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
              }`}
            >
              {/* Top Active Highlight Line */}
              {isActive && (
                <span
                  className={`absolute -top-1.5 w-7 h-1 rounded-full ${
                    item.isGold
                      ? 'bg-amber-400 shadow-[0_0_12px_#f59e0b]'
                      : 'bg-[#0ef] shadow-[0_0_12px_#00eeff]'
                  }`}
                />
              )}

              <div className="relative flex items-center justify-center mb-0.5">
                <Icon
                  className={`w-5 h-5 transition-transform ${
                    isActive ? 'scale-110' : ''
                  }`}
                />
                
                {/* Badge if present */}
                {item.badge && (
                  <span
                    className={`absolute -top-1.5 -right-2.5 text-[8px] font-extrabold px-1 py-0.2 rounded-full border leading-none ${
                      item.isGold
                        ? 'bg-amber-500 text-black border-amber-300 shadow-[0_0_8px_rgba(245,158,11,0.5)]'
                        : item.id === 'store'
                        ? 'bg-red-500 text-white border-red-300 animate-pulse'
                        : 'bg-cyan-500 text-black border-cyan-300'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </div>

              <span className="text-[10px] leading-tight truncate max-w-[68px] tracking-tight">
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
