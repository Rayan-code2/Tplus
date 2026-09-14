import React from 'react';
import {
  LayoutDashboard,
  Flame,
  Dices,
  Ticket,
  Users,
  Disc,
  Rocket,
  Menu,
} from 'lucide-react';

interface MobileBottomNavProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  setIsAdminView: (isAdmin: boolean) => void;
  user: any;
  onToggleMobileDrawer?: () => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  activeTab,
  setActiveTab,
  setIsAdminView,
  user,
  onToggleMobileDrawer,
}) => {
  const navItems = [
    {
      id: 'dashboard',
      label: 'Lobby',
      icon: LayoutDashboard,
    },
    {
      id: 'luckydraw',
      label: 'Draw',
      icon: Ticket,
      badge: 'JACKPOT',
      isGold: true,
    },
    {
      id: 'aviator',
      label: 'Aviator',
      icon: Rocket,
      badge: '100X',
      isGold: true,
    },
    {
      id: 'colorprediction',
      label: 'WinGo',
      icon: Dices,
      badge: '9X',
    },
    {
      id: 'dragontiger',
      label: 'Dragon/Tiger',
      icon: Flame,
      badge: '2X',
    },
    {
      id: 'spinwheel',
      label: 'Spin',
      icon: Disc,
      badge: user?.spinCredits ? `${user.spinCredits} SP` : 'WIN',
    },
    {
      id: 'agency',
      label: 'Agency',
      icon: Users,
      badge: '5-Lvl',
    },
  ];

  const handleTabClick = (tabId: string) => {
    setActiveTab(tabId);
    setIsAdminView(false);
  };

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#080d14]/98 backdrop-blur-xl border-t border-cyan-500/30 px-1 py-1.5 shadow-[0_-8px_30px_rgba(0,0,0,0.9)]">
      <div className="flex items-center justify-between max-w-lg mx-auto gap-0.5 overflow-x-auto no-scrollbar">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            activeTab === item.id ||
            (item.id === 'spinwheel' && activeTab === 'rewards');

          return (
            <button
              key={item.id}
              onClick={() => handleTabClick(item.id)}
              className={`flex flex-col items-center justify-center py-1 px-1 rounded-xl transition-all duration-200 relative min-w-[50px] flex-1 min-h-[44px] ${
                isActive
                  ? item.isGold
                    ? 'text-amber-300 font-bold bg-amber-500/15 scale-105'
                    : 'text-[#0ef] font-bold bg-[#0ef]/15 scale-105'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {/* Top Active Highlight Line */}
              {isActive && (
                <span
                  className={`absolute -top-1.5 w-6 h-1 rounded-full ${
                    item.isGold
                      ? 'bg-amber-400 shadow-[0_0_12px_#f59e0b]'
                      : 'bg-[#0ef] shadow-[0_0_12px_#00eeff]'
                  }`}
                />
              )}

              <div className="relative flex items-center justify-center mb-0.5">
                <Icon
                  className={`w-4 h-4 transition-transform ${
                    isActive ? 'scale-110' : ''
                  }`}
                />
                
                {/* Badge if present */}
                {item.badge && (
                  <span
                    className={`absolute -top-1.5 -right-3 text-[7px] font-extrabold px-1 py-0.2 rounded-full border leading-none ${
                      item.isGold
                        ? 'bg-amber-500 text-black border-amber-300 shadow-[0_0_8px_rgba(245,158,11,0.5)]'
                        : 'bg-cyan-500 text-black border-cyan-300'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </div>

              <span className="text-[9px] leading-tight truncate tracking-tight">
                {item.label}
              </span>
            </button>
          );
        })}

        {/* Menu Drawer Trigger */}
        <button
          onClick={onToggleMobileDrawer}
          className="flex flex-col items-center justify-center py-1 px-1 rounded-xl text-slate-400 hover:text-cyan-300 hover:bg-slate-800/40 transition-all duration-200 min-w-[46px] flex-1 min-h-[44px]"
        >
          <Menu className="w-4 h-4 mb-0.5 text-cyan-400" />
          <span className="text-[9px] leading-tight tracking-tight text-cyan-300 font-bold">
            Menu
          </span>
        </button>
      </div>
    </div>
  );
};

