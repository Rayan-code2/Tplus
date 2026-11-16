import React, { useState, useEffect } from 'react';
import {
  Volume2,
  Trophy,
  Rocket,
  Dices,
  Flame,
  Ticket,
  Coins,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Sparkles,
  Download,
  X,
  ExternalLink,
  Info,
  CheckCircle2,
  ArrowUp,
  ArrowDown,
  RotateCw,
} from 'lucide-react';
import { User, Transaction, SystemSettings } from '../types';
import { JalwaLogo } from './JalwaLogo';
import { getMainWalletUsdt, isGameEnabled, GameRouteKey } from '../utils/subdomainRouter';
import heroAviatorImg from '../assets/images/hero_sportx_aviator_1794764892729.jpg';
import heroCricketImg from '../assets/images/hero_sportx_cricket_1794764892947.jpg';
import heroWingoImg from '../assets/images/hero_sportx_wingo_1794764892920.jpg';
import heroCasinoImg from '../assets/images/hero_sportx_casino_1794764893513.jpg';

interface DashboardViewProps {
  user: User | null;
  settings: SystemSettings | null;
  transactions?: Transaction[];
  onBuyPackage?: (pkgId: string) => Promise<void>;
  onClaimRoi?: () => Promise<void>;
  onOpenDeposit: () => void;
  onOpenWithdraw: () => void;
  onSelectTab?: (tab: string) => void;
  onDailyCheckin?: () => Promise<void>;
  onOpenTournament?: () => void;
  onOpenAuthModal?: () => void;
  onToggleMobileDrawer?: () => void;
  onRefreshUser?: () => Promise<void>;
}

// 8 Category 3D SVGs matching reference image
const LotteryIcon = () => (
  <svg viewBox="0 0 80 80" className="w-12 h-12 drop-shadow-[0_4px_8px_rgba(0,0,0,0.5)]">
    <defs>
      <radialGradient id="ball8Grad" cx="35%" cy="35%" r="65%">
        <stop offset="0%" stopColor="#ff8a80" />
        <stop offset="40%" stopColor="#e53935" />
        <stop offset="100%" stopColor="#7f1d1d" />
      </radialGradient>
      <radialGradient id="ball1Grad" cx="35%" cy="35%" r="65%">
        <stop offset="0%" stopColor="#a7f3d0" />
        <stop offset="40%" stopColor="#10b981" />
        <stop offset="100%" stopColor="#064e3b" />
      </radialGradient>
    </defs>
    <circle cx="36" cy="34" r="24" fill="url(#ball8Grad)" />
    <circle cx="36" cy="34" r="11" fill="#ffffff" />
    <text x="36" y="39" textAnchor="middle" fontSize="13" fontWeight="900" fill="#1e1e1e" fontFamily="sans-serif">8</text>
    <ellipse cx="28" cy="22" rx="7" ry="3.5" fill="#ffffff" opacity="0.4" transform="rotate(-30 28 22)" />
    <circle cx="56" cy="52" r="18" fill="url(#ball1Grad)" />
    <circle cx="56" cy="52" r="8" fill="#ffffff" />
    <text x="56" y="56" textAnchor="middle" fontSize="10" fontWeight="900" fill="#064e3b" fontFamily="sans-serif">1</text>
    <ellipse cx="50" cy="44" rx="5" ry="2.5" fill="#ffffff" opacity="0.5" transform="rotate(-30 50 44)" />
  </svg>
);

const MiniGamesIcon = () => (
  <svg viewBox="0 0 80 80" className="w-12 h-12 drop-shadow-[0_4px_8px_rgba(0,0,0,0.5)]">
    <defs>
      <linearGradient id="trophyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#e0f2fe" />
        <stop offset="40%" stopColor="#7dd3fc" />
        <stop offset="100%" stopColor="#0284c7" />
      </linearGradient>
      <linearGradient id="goldCoinGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#fef08a" />
        <stop offset="60%" stopColor="#f59e0b" />
        <stop offset="100%" stopColor="#b45309" />
      </linearGradient>
    </defs>
    <path d="M 22 28 C 12 30 12 46 24 48" fill="none" stroke="url(#trophyGrad)" strokeWidth="4" strokeLinecap="round" />
    <path d="M 58 28 C 68 30 68 46 56 48" fill="none" stroke="url(#trophyGrad)" strokeWidth="4" strokeLinecap="round" />
    <path d="M 22 22 L 58 22 L 52 50 C 50 56 46 60 40 60 C 34 60 30 56 28 50 Z" fill="url(#trophyGrad)" />
    <rect x="36" y="60" width="8" height="8" fill="#0369a1" />
    <path d="M 28 68 L 52 68 L 56 74 L 24 74 Z" fill="url(#trophyGrad)" />
    <circle cx="34" cy="20" r="7" fill="url(#goldCoinGrad)" stroke="#fef08a" strokeWidth="1" />
    <circle cx="46" cy="18" r="8" fill="url(#goldCoinGrad)" stroke="#fef08a" strokeWidth="1" />
    <circle cx="40" cy="24" r="6.5" fill="url(#goldCoinGrad)" stroke="#fef08a" strokeWidth="1" />
    <circle cx="58" cy="54" r="6" fill="url(#goldCoinGrad)" stroke="#fef08a" strokeWidth="1" />
  </svg>
);

const AviatorIcon = () => (
  <svg viewBox="0 0 80 80" className="w-12 h-12 drop-shadow-[0_4px_10px_rgba(239,68,68,0.6)]">
    <defs>
      <linearGradient id="aviatorBody" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#ff5252" />
        <stop offset="50%" stopColor="#dc2626" />
        <stop offset="100%" stopColor="#991b1b" />
      </linearGradient>
      <radialGradient id="aviatorGlow" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="#ef4444" stopOpacity="0.4" />
        <stop offset="100%" stopColor="#ef4444" stopOpacity="0" />
      </radialGradient>
    </defs>
    <circle cx="40" cy="40" r="34" fill="url(#aviatorGlow)" />
    {/* Red Aviator Jet in climbing flight */}
    <g transform="translate(14, 18) rotate(-18 24 22)">
      {/* Fuselage */}
      <path
        d="M 46 20 C 50 18 53 16 54 15 C 50 23 40 25 30 26 L 12 27 C 8 27 6 25 6 21 C 7 18 10 19 14 20 L 30 20 Z"
        fill="url(#aviatorBody)"
      />
      {/* Upper Main Wing */}
      <path
        d="M 28 20 L 40 4 L 46 4 L 33 20 Z"
        fill="#ff4d4f"
        stroke="#fecaca"
        strokeWidth="0.8"
      />
      {/* Lower Wing */}
      <path
        d="M 26 26 L 18 40 L 12 40 L 20 26 Z"
        fill="#7f1d1d"
      />
      {/* Tail Rudder */}
      <path
        d="M 10 20 L 4 7 L 11 7 L 15 20 Z"
        fill="#b91c1c"
      />
      {/* Cockpit Window */}
      <ellipse cx="32" cy="18" rx="4" ry="2.2" fill="#38bdf8" />
      {/* Propeller Blade */}
      <circle cx="53" cy="17" r="2.5" fill="#ffffff" />
      <line x1="53" y1="9" x2="53" y2="25" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" opacity="0.9" />
      {/* Jet Exhaust Trail */}
      <path d="M 6 23 Q -4 28 -12 36" stroke="#f43f5e" strokeWidth="2.5" strokeDasharray="3 2" fill="none" opacity="0.9" />
    </g>
  </svg>
);

const HotSlotsIcon = () => (
  <svg viewBox="0 0 80 80" className="w-12 h-12 drop-shadow-[0_4px_8px_rgba(0,0,0,0.5)]">
    <defs>
      <radialGradient id="slimeGrad" cx="35%" cy="30%" r="70%">
        <stop offset="0%" stopColor="#bae6fd" />
        <stop offset="50%" stopColor="#38bdf8" />
        <stop offset="100%" stopColor="#0284c7" />
      </radialGradient>
      <radialGradient id="heartGrad" cx="30%" cy="30%" r="70%">
        <stop offset="0%" stopColor="#fca5a5" />
        <stop offset="50%" stopColor="#ef4444" />
        <stop offset="100%" stopColor="#991b1b" />
      </radialGradient>
    </defs>
    <path d="M 20 16 L 16 12" stroke="#f43f5e" strokeWidth="3" strokeLinecap="round" />
    <path d="M 28 12 L 28 7" stroke="#f43f5e" strokeWidth="3" strokeLinecap="round" />
    <ellipse cx="38" cy="44" rx="26" ry="24" fill="url(#slimeGrad)" />
    <ellipse cx="30" cy="28" rx="8" ry="4" fill="#ffffff" opacity="0.6" transform="rotate(-20 30 28)" />
    <ellipse cx="28" cy="38" rx="3.5" ry="5" fill="#0c4a6e" />
    <circle cx="27" cy="36" r="1.5" fill="#ffffff" />
    <ellipse cx="44" cy="38" rx="3.5" ry="5" fill="#0c4a6e" />
    <circle cx="43" cy="36" r="1.5" fill="#ffffff" />
    <path d="M 31 46 Q 36 52 41 46" fill="#0c4a6e" stroke="#0c4a6e" strokeWidth="2" strokeLinecap="round" />
    <ellipse cx="22" cy="44" rx="4" ry="2" fill="#f43f5e" opacity="0.6" />
    <ellipse cx="48" cy="44" rx="4" ry="2" fill="#f43f5e" opacity="0.6" />
    <g transform="translate(46, 44) scale(0.95)">
      <path
        d="M 12,3 C 7, -3, 0, 1, 0, 7 C 0, 14, 12, 22, 12, 22 C 12, 22, 24, 14, 24, 7 C 24, 1, 17, -3, 12, 3 Z"
        fill="url(#heartGrad)"
      />
    </g>
  </svg>
);

const SlotsIcon = () => (
  <svg viewBox="0 0 80 80" className="w-12 h-12 drop-shadow-[0_4px_8px_rgba(0,0,0,0.5)]">
    <defs>
      <linearGradient id="slotCabinet" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#f472b6" />
        <stop offset="40%" stopColor="#db2777" />
        <stop offset="100%" stopColor="#831843" />
      </linearGradient>
      <linearGradient id="goldTrim" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="#fef08a" />
        <stop offset="50%" stopColor="#f59e0b" />
        <stop offset="100%" stopColor="#d97706" />
      </linearGradient>
    </defs>
    <rect x="18" y="24" width="44" height="34" rx="8" fill="url(#slotCabinet)" stroke="url(#goldTrim)" strokeWidth="2.5" />
    <rect x="22" y="28" width="36" height="20" rx="4" fill="#ffffff" />
    <text x="27" y="43" fontSize="13" fontWeight="900" fill="#ef4444" fontFamily="sans-serif">7</text>
    <text x="38" y="43" fontSize="13" fontWeight="900" fill="#f59e0b" fontFamily="sans-serif">7</text>
    <text x="49" y="43" fontSize="13" fontWeight="900" fill="#ef4444" fontFamily="sans-serif">7</text>
    <line x1="62" y1="36" x2="70" y2="24" stroke="url(#goldTrim)" strokeWidth="3" strokeLinecap="round" />
    <circle cx="71" cy="22" r="5" fill="#ef4444" />
    <g transform="translate(42, 48) rotate(10)">
      <rect x="0" y="0" width="16" height="16" rx="3" fill="#fdf2f8" stroke="#f472b6" strokeWidth="1" />
      <circle cx="4" cy="4" r="1.5" fill="#db2777" />
      <circle cx="8" cy="8" r="1.5" fill="#db2777" />
      <circle cx="12" cy="12" r="1.5" fill="#db2777" />
    </g>
  </svg>
);

const FishingIcon = () => (
  <svg viewBox="0 0 80 80" className="w-12 h-12 drop-shadow-[0_4px_8px_rgba(0,0,0,0.5)]">
    <defs>
      <radialGradient id="fishGrad" cx="35%" cy="35%" r="65%">
        <stop offset="0%" stopColor="#fde047" />
        <stop offset="35%" stopColor="#fb923c" />
        <stop offset="100%" stopColor="#ea580c" />
      </radialGradient>
      <linearGradient id="goggleGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#38bdf8" />
        <stop offset="100%" stopColor="#0369a1" />
      </linearGradient>
    </defs>
    <path d="M 60 40 L 72 28 C 72 40 72 40 72 52 Z" fill="url(#fishGrad)" />
    <ellipse cx="40" cy="42" rx="22" ry="18" fill="url(#fishGrad)" />
    <path d="M 38 48 C 34 56 46 56 44 48" fill="#f97316" />
    <circle cx="28" cy="38" r="9" fill="url(#goggleGrad)" stroke="#0c4a6e" strokeWidth="2.5" />
    <circle cx="28" cy="38" r="6" fill="#38bdf8" opacity="0.8" />
    <circle cx="26" cy="35" r="2.5" fill="#ffffff" />
    <ellipse cx="18" cy="44" rx="3" ry="4" fill="#9a3412" />
    <circle cx="16" cy="24" r="3" fill="#bae6fd" opacity="0.6" />
    <circle cx="22" cy="18" r="4.5" fill="#bae6fd" opacity="0.6" />
  </svg>
);

const PvcIcon = () => (
  <svg viewBox="0 0 80 80" className="w-12 h-12 drop-shadow-[0_4px_8px_rgba(0,0,0,0.5)]">
    <defs>
      <linearGradient id="cardGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#ffffff" />
        <stop offset="100%" stopColor="#f1f5f9" />
      </linearGradient>
      <radialGradient id="chipGrad" cx="35%" cy="35%" r="65%">
        <stop offset="0%" stopColor="#93c5fd" />
        <stop offset="50%" stopColor="#3b82f6" />
        <stop offset="100%" stopColor="#1e40af" />
      </radialGradient>
    </defs>
    <g transform="translate(24, 20) rotate(-16)">
      <rect x="0" y="0" width="22" height="32" rx="3" fill="url(#cardGrad)" stroke="#cbd5e1" strokeWidth="1" />
      <text x="3" y="10" fontSize="7" fontWeight="bold" fill="#ef4444">♥</text>
    </g>
    <g transform="translate(34, 18) rotate(4)">
      <rect x="0" y="0" width="22" height="32" rx="3" fill="url(#cardGrad)" stroke="#cbd5e1" strokeWidth="1" />
      <text x="3" y="10" fontSize="7" fontWeight="bold" fill="#0f172a">♠</text>
    </g>
    <circle cx="48" cy="52" r="14" fill="url(#chipGrad)" stroke="#ffffff" strokeWidth="2.5" strokeDasharray="5,2" />
    <circle cx="48" cy="52" r="7" fill="#ffffff" />
    <circle cx="48" cy="52" r="4" fill="#3b82f6" />
  </svg>
);

const CasinoIcon = () => (
  <svg viewBox="0 0 80 80" className="w-12 h-12 drop-shadow-[0_4px_8px_rgba(0,0,0,0.5)]">
    <defs>
      <linearGradient id="brassOuter" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#fef08a" />
        <stop offset="50%" stopColor="#eab308" />
        <stop offset="100%" stopColor="#854d0e" />
      </linearGradient>
      <radialGradient id="wheelCenter" cx="35%" cy="35%" r="65%">
        <stop offset="0%" stopColor="#6ee7b7" />
        <stop offset="50%" stopColor="#10b981" />
        <stop offset="100%" stopColor="#047857" />
      </radialGradient>
    </defs>
    <circle cx="40" cy="40" r="28" fill="url(#brassOuter)" stroke="#713f12" strokeWidth="1" />
    <circle cx="40" cy="40" r="23" fill="#1e293b" />
    <circle cx="40" cy="40" r="17" fill="url(#wheelCenter)" stroke="#fef08a" strokeWidth="2" />
    <line x1="40" y1="20" x2="40" y2="60" stroke="#fef08a" strokeWidth="2.5" strokeLinecap="round" />
    <line x1="20" y1="40" x2="60" y2="40" stroke="#fef08a" strokeWidth="2.5" strokeLinecap="round" />
    <circle cx="40" cy="40" r="4" fill="#ffffff" stroke="#854d0e" strokeWidth="1" />
  </svg>
);

const SportsIcon = () => (
  <svg viewBox="0 0 80 80" className="w-12 h-12 drop-shadow-[0_4px_8px_rgba(0,0,0,0.5)]">
    <defs>
      <linearGradient id="batWood" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#fde047" />
        <stop offset="30%" stopColor="#d97706" />
        <stop offset="100%" stopColor="#92400e" />
      </linearGradient>
      <radialGradient id="cricketBall" cx="35%" cy="35%" r="65%">
        <stop offset="0%" stopColor="#f87171" />
        <stop offset="40%" stopColor="#dc2626" />
        <stop offset="100%" stopColor="#7f1d1d" />
      </radialGradient>
    </defs>
    <g transform="translate(14, 26)">
      <path d="M 12 18 C 12 8 28 8 28 18 L 28 24 L 12 24 Z" fill="#047857" stroke="#065f46" strokeWidth="1.5" />
      <path d="M 10 24 L 30 24" stroke="#94a3b8" strokeWidth="2" />
      <path d="M 14 24 L 14 30 L 26 30 L 26 24" fill="none" stroke="#94a3b8" strokeWidth="1.5" />
    </g>
    <g transform="translate(24, 12) rotate(42)">
      <rect x="2" y="-14" width="4" height="16" rx="2" fill="#3b82f6" stroke="#1d4ed8" strokeWidth="0.8" />
      <rect x="0" y="2" width="8" height="42" rx="3" fill="url(#batWood)" stroke="#78350f" strokeWidth="1" />
    </g>
    <circle cx="56" cy="50" r="11" fill="url(#cricketBall)" stroke="#991b1b" strokeWidth="1" />
    <path d="M 47 44 Q 56 50 65 56" fill="none" stroke="#ffffff" strokeWidth="1.5" strokeDasharray="2,1.5" />
  </svg>
);

export const DashboardView: React.FC<DashboardViewProps> = ({
  user,
  settings,
  onOpenDeposit,
  onOpenWithdraw,
  onSelectTab,
  onOpenTournament,
  onOpenAuthModal,
  onToggleMobileDrawer,
  onRefreshUser,
}) => {
  const [activeCategory, setActiveCategory] = useState<string>('lottery');
  const [activeSlide, setActiveSlide] = useState<number>(0);
  const [isCarouselPaused, setIsCarouselPaused] = useState<boolean>(false);
  const [failedBannerIds, setFailedBannerIds] = useState<Record<string, boolean>>({});
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showInstallModal, setShowInstallModal] = useState(false);
  const [countdownSeconds, setCountdownSeconds] = useState(42);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Live Active Players counts with dynamic periodic fluctuations (fluctuating up & down)
  const [activePlayers, setActivePlayers] = useState({
    wingo: 2842,
    aviator: 4195,
    racing: 1728,
    dragon: 2364,
    cricket: 3890,
    wheel: 1475,
  });

  useEffect(() => {
    const playerInterval = setInterval(() => {
      setActivePlayers((prev) => {
        const fluctuate = (val: number, min: number, max: number) => {
          const delta = Math.floor(Math.random() * 25) - 11; // -11 to +13 drift
          const updated = val + delta;
          if (updated < min) return min + Math.floor(Math.random() * 12);
          if (updated > max) return max - Math.floor(Math.random() * 12);
          return updated;
        };

        return {
          wingo: fluctuate(prev.wingo, 2400, 3200),
          aviator: fluctuate(prev.aviator, 3600, 4800),
          racing: fluctuate(prev.racing, 1400, 2100),
          dragon: fluctuate(prev.dragon, 2000, 2900),
          cricket: fluctuate(prev.cricket, 3200, 4600),
          wheel: fluctuate(prev.wheel, 1200, 1900),
        };
      });
    }, 2800);

    return () => clearInterval(playerInterval);
  }, []);

  const handleRefreshBalance = async () => {
    setIsRefreshing(true);
    try {
      if (onRefreshUser) {
        await onRefreshUser();
      }
    } catch (e) {
      // Ignore network errors on refresh
    } finally {
      setTimeout(() => {
        setIsRefreshing(false);
      }, 600);
    }
  };

  // Live total balance formatted natively in ₹ INR
  const totalBalanceInr = (user?.balance || 0) + (user?.winningBalance || 0) + (user?.depositBalance || 0);
  const inrBalance = totalBalanceInr.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  // Live countdown ticker for Win Go
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdownSeconds((prev) => (prev > 0 ? prev - 1 : 59));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const allCategories: Array<{
    id: string;
    label: string;
    icon: React.FC;
    defaultTab: string;
    gameKey: GameRouteKey;
    isHot?: boolean;
  }> = [
    { id: 'lottery', label: 'Lottery', icon: LotteryIcon, defaultTab: 'luckydraw', gameKey: 'luckydraw' },
    { id: 'aviator', label: 'Aviator', icon: AviatorIcon, defaultTab: 'aviator', gameKey: 'aviator', isHot: true },
    { id: 'minigames', label: 'Chicken Road', icon: MiniGamesIcon, defaultTab: 'chickenroad', gameKey: 'chickenroad', isHot: true },
    { id: 'hotslots', label: 'Hot Slots', icon: HotSlotsIcon, defaultTab: 'slot777', gameKey: 'slot777' },
    { id: 'slots', label: '777 Slots', icon: SlotsIcon, defaultTab: 'slot777', gameKey: 'slot777' },
    { id: 'pvc', label: 'Rummy', icon: PvcIcon, defaultTab: 'rummy', gameKey: 'rummy' },
    { id: 'casino', label: 'Casino', icon: CasinoIcon, defaultTab: 'dragontiger', gameKey: 'dragontiger' },
    { id: 'sports', label: 'Sports', icon: SportsIcon, defaultTab: 'cricket', gameKey: 'cricket' },
  ];

  const categories = allCategories.filter((cat) => isGameEnabled(cat.gameKey, settings));

  const spinWheelOn = isGameEnabled('spinwheel', settings);
  const spinRewardsList = settings?.spinWheelRewards || [];
  const maxSpinPrizeInr =
    spinRewardsList.length > 0
      ? Math.max(...spinRewardsList.map((r) => Number(r.amount) || 0))
      : 2500;

  const heroBanners: Array<{
    id: string;
    gameKey: GameRouteKey;
    kicker: string;
    title: string;
    subtitle: string;
    ctaLabel: string;
    imageSrc: string;
    imageAlt: string;
    fallbackGradient: string;
    accentClass: string;
  }> = [
    {
      id: 'hero-aviator',
      gameKey: 'aviator',
      kicker: 'SportX Crash · Up to 100x Multiplier',
      title: 'Aviator Jet Crash',
      subtitle: 'Watch the multiplier climb and cash out before takeoff.',
      ctaLabel: 'Play Aviator',
      imageSrc: heroAviatorImg,
      imageAlt: 'SportX Aviator Crash jet ascending at night',
      fallbackGradient: 'from-rose-950 via-slate-900 to-[#070e1d]',
      accentClass: 'bg-rose-500 hover:bg-rose-400 text-white',
    },
    {
      id: 'hero-wingo',
      gameKey: 'colorprediction',
      kicker: 'Win Go Arena · 9x Instant Payout',
      title: 'Color Prediction Live',
      subtitle: 'Pick Green, Red, Violet or exact numbers every 60s.',
      ctaLabel: 'Play Win Go',
      imageSrc: heroWingoImg,
      imageAlt: 'SportX Color Prediction Win Go spheres on slate table',
      fallbackGradient: 'from-emerald-950 via-slate-900 to-[#070e1d]',
      accentClass: 'bg-emerald-500 hover:bg-emerald-400 text-slate-950',
    },
    {
      id: 'hero-cricket',
      gameKey: 'cricket',
      kicker: 'SportX Fantasy 11 · Mega Prize Pools',
      title: 'Cricket Match League',
      subtitle: 'Build your winning 11 squad and climb live leaderboards.',
      ctaLabel: 'Play Cricket',
      imageSrc: heroCricketImg,
      imageAlt: 'SportX Cricket Fantasy stadium night match action',
      fallbackGradient: 'from-sky-950 via-slate-900 to-[#070e1d]',
      accentClass: 'bg-cyan-400 hover:bg-cyan-300 text-slate-950',
    },
    {
      id: 'hero-casino',
      gameKey: 'dragontiger',
      kicker: 'Live Card Arena · 2x & 8x Tie Payout',
      title: 'Dragon vs Tiger',
      subtitle: 'Fast 25-second duels with direct Main Wallet settlement.',
      ctaLabel: 'Play Live Table',
      imageSrc: heroCasinoImg,
      imageAlt: 'SportX Dragon vs Tiger gold and silver medallions with cards',
      fallbackGradient: 'from-amber-950 via-slate-900 to-[#070e1d]',
      accentClass: 'bg-amber-400 hover:bg-amber-300 text-slate-950',
    },
  ];

  const visibleHeroBanners = heroBanners.filter((b) => isGameEnabled(b.gameKey, settings));

  useEffect(() => {
    if (visibleHeroBanners.length > 0 && activeSlide >= visibleHeroBanners.length) {
      setActiveSlide(0);
    }
  }, [visibleHeroBanners.length, activeSlide]);

  useEffect(() => {
    if (visibleHeroBanners.length <= 1 || isCarouselPaused) return;
    const prefersReduced =
      typeof window !== 'undefined' &&
      window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) return;

    const timer = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % visibleHeroBanners.length);
    }, 4800);
    return () => clearInterval(timer);
  }, [visibleHeroBanners.length, isCarouselPaused]);

  const visibleGameKeys: GameRouteKey[] = ([
    'colorprediction',
    'aviator',
    'luckydraw',
    'dragontiger',
    'cricket',
    'spinwheel',
    'slot777',
    'rummy',
    'chickenroad',
  ] as GameRouteKey[]).filter((k) => isGameEnabled(k, settings));

  // If currently selected sub-category's game was turned OFF by Admin, reset to main sequenced games lobby
  useEffect(() => {
    if (activeCategory !== 'lottery' && !categories.some((c) => c.id === activeCategory)) {
      setActiveCategory('lottery');
    }
  }, [settings?.enabledGames, activeCategory]);

  const categoryGridColsClass =
    categories.length === 1
      ? 'grid-cols-1'
      : categories.length === 2
      ? 'grid-cols-2'
      : categories.length === 3
      ? 'grid-cols-3'
      : 'grid-cols-4';

  const cardGridColsClass =
    visibleGameKeys.length === 1
      ? 'grid-cols-1'
      : visibleGameKeys.length === 2 || visibleGameKeys.length === 4
      ? 'grid-cols-2'
      : 'grid-cols-3';

  return (
    <div className="w-full max-w-md sm:max-w-xl md:max-w-2xl mx-auto space-y-4 pb-1 text-slate-100 font-sans selection:bg-cyan-500 selection:text-black">
      {/* 1. TOP BRAND HEADER (Jalwa.Game, Log in, Register) */}
      <header className="flex items-center justify-between pt-1 pb-2 px-1">
        <div className="cursor-pointer" onClick={() => onSelectTab?.('dashboard')}>
          <JalwaLogo size="md" />
        </div>

        <div className="flex items-center gap-2">
          {/* Cloud App Download button (matching reference) */}
          <button
            onClick={() => setShowInstallModal(true)}
            className="w-7 h-7 rounded-lg bg-[#08182b] border border-emerald-500/40 text-emerald-400 flex items-center justify-center hover:bg-emerald-500/10 active:scale-95 transition shadow-sm"
            title="Download App"
          >
            <Download className="w-3.5 h-3.5" />
          </button>

          {/* Language badge (🇺🇸 EN matching reference) */}
          <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-[#08122a] border border-blue-900/40 text-[11px] font-bold text-slate-300">
            <span>🇺🇸</span>
            <span className="text-[#22d3ee]">EN</span>
          </div>

          {user ? (
            <div
              onClick={onOpenDeposit}
              className="bg-[#0b1430] border border-cyan-500/40 rounded-lg px-2.5 py-1 text-xs font-mono font-bold text-cyan-300 flex items-center gap-1 cursor-pointer hover:border-cyan-400 transition"
              title="Unified Main Wallet Balance"
            >
              <Coins className="w-3.5 h-3.5 text-cyan-400" />
              <span>₹{getMainWalletUsdt(user).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
          ) : (
            <>
              <button
                onClick={onOpenAuthModal}
                className="px-3 py-1.5 rounded-lg bg-[#0b1430] border border-cyan-500/30 hover:border-cyan-400 text-white text-xs font-semibold tracking-wide transition active:scale-95 shadow-sm"
              >
                Log in
              </button>
              <button
                onClick={onOpenAuthModal}
                className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-[#22d3ee] to-[#38bdf8] hover:from-[#38bdf8] hover:to-[#67e8f9] text-[#070b19] text-xs font-black tracking-wide transition active:scale-95 shadow-[0_0_15px_rgba(34,211,238,0.45)]"
              >
                Register
              </button>
            </>
          )}
        </div>
      </header>

      {/* 2. DUAL TOP SPORTX FEATURE CARDS (Wheel of Fortune + VIP Privileges in unified SportX dark navy/teal/gold theme) */}
      <div className={`grid ${spinWheelOn ? 'grid-cols-2' : 'grid-cols-1'} gap-2.5 sm:gap-3`}>
        {spinWheelOn && (
          <button
            type="button"
            onClick={() => onSelectTab?.('spinwheel')}
            title="Play Wheel of Fortune"
            className="group relative overflow-hidden rounded-2xl p-3 sm:p-4 text-left bg-gradient-to-br from-[#071f3e] via-[#081530] to-[#050a18] border border-[#2dd4bf]/35 hover:border-[#2dd4bf]/75 shadow-[0_10px_28px_rgba(6,182,212,0.14)] hover:shadow-[0_12px_32px_rgba(45,212,191,0.28)] transition-all duration-200 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
          >
            {/* Subtle top-right radial glow matching SportX teal/cyan accent */}
            <div className="pointer-events-none absolute -right-6 -top-6 w-24 h-24 rounded-full bg-cyan-400/15 blur-xl group-hover:bg-teal-400/25 transition-colors duration-200" />
            <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#2dd4bf]/60 to-transparent" />

            <div className="relative z-10 flex items-center justify-between gap-2 sm:gap-3">
              <div className="min-w-0 flex-1 space-y-1">
                <div className="text-[10px] sm:text-[11px] font-bold text-[#2dd4bf] tracking-wide truncate">
                  SportX Daily Spin
                </div>
                <div className="text-[13px] sm:text-base font-black text-white leading-tight tracking-tight">
                  Wheel of Fortune
                </div>
                <div className="flex items-center gap-0.5 text-[10px] sm:text-xs font-semibold text-cyan-200/90 tabular-nums truncate pt-0.5">
                  <span className="truncate">Win ₹{maxSpinPrizeInr.toLocaleString('en-IN')}</span>
                  <ChevronRight className="w-3.5 h-3.5 text-[#2dd4bf] shrink-0 transition-transform duration-150 group-hover:translate-x-0.5" />
                </div>
              </div>

              {/* Bespoke SportX Rotating Fortune Wheel SVG */}
              <div className="relative w-11 h-11 sm:w-14 sm:h-14 shrink-0 flex items-center justify-center">
                {/* Top pointer pin */}
                <svg viewBox="0 0 16 14" className="w-3 h-2.5 absolute -top-1 left-1/2 -translate-x-1/2 z-20 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                  <path d="M8 13 L1 2 Q8 0 15 2 Z" fill="#fbbf24" stroke="#050a18" strokeWidth="1.2" />
                </svg>
                <svg
                  viewBox="0 0 64 64"
                  className="w-full h-full drop-shadow-[0_4px_12px_rgba(45,212,191,0.35)] animate-[spin_18s_linear_infinite] group-hover:animate-[spin_4s_linear_infinite] motion-reduce:animate-none"
                >
                  <defs>
                    <linearGradient id="wheelRim" x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0%" stopColor="#2dd4bf" />
                      <stop offset="50%" stopColor="#06b6d4" />
                      <stop offset="100%" stopColor="#0284c7" />
                    </linearGradient>
                  </defs>
                  {/* Outer Rim */}
                  <circle cx="32" cy="32" r="29" fill="#071533" stroke="url(#wheelRim)" strokeWidth="3.5" />
                  {/* 6 Alternated Segments */}
                  <path d="M32 32 L32 6 A26 26 0 0 1 54.5 19 Z" fill="#14b8a6" />
                  <path d="M32 32 L54.5 19 A26 26 0 0 1 54.5 45 Z" fill="#0b1d42" />
                  <path d="M32 32 L54.5 45 A26 26 0 0 1 32 58 Z" fill="#06b6d4" />
                  <path d="M32 32 L32 58 A26 26 0 0 1 9.5 45 Z" fill="#0f2752" />
                  <path d="M32 32 L9.5 45 A26 26 0 0 1 9.5 19 Z" fill="#f59e0b" />
                  <path d="M32 32 L9.5 19 A26 26 0 0 1 32 6 Z" fill="#0b1d42" />
                  {/* Segment Spoke Lines */}
                  <circle cx="32" cy="32" r="26" fill="none" stroke="#050a18" strokeWidth="1" opacity="0.65" />
                  {/* Rim studs */}
                  <circle cx="32" cy="4.5" r="1.4" fill="#fde68a" />
                  <circle cx="56" cy="18.2" r="1.4" fill="#fde68a" />
                  <circle cx="56" cy="45.8" r="1.4" fill="#fde68a" />
                  <circle cx="32" cy="59.5" r="1.4" fill="#fde68a" />
                  <circle cx="8" cy="45.8" r="1.4" fill="#fde68a" />
                  <circle cx="8" cy="18.2" r="1.4" fill="#fde68a" />
                  {/* Center Cap */}
                  <circle cx="32" cy="32" r="8" fill="#050a18" stroke="#2dd4bf" strokeWidth="2" />
                  <circle cx="32" cy="32" r="3.2" fill="#fbbf24" />
                </svg>
              </div>
            </div>
          </button>
        )}

        {/* Right: VIP Privileges Card */}
        <button
          type="button"
          onClick={() => onSelectTab?.('vip')}
          title="Open VIP Privileges"
          className="group relative overflow-hidden rounded-2xl p-3 sm:p-4 text-left bg-gradient-to-br from-[#161a39] via-[#0c142e] to-[#050a18] border border-amber-400/35 hover:border-amber-300/75 shadow-[0_10px_28px_rgba(245,158,11,0.12)] hover:shadow-[0_12px_32px_rgba(251,191,36,0.24)] transition-all duration-200 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
        >
          {/* Subtle Champagne-Gold & Navy Ambient Glow */}
          <div className="pointer-events-none absolute -right-6 -top-6 w-24 h-24 rounded-full bg-amber-400/15 blur-xl group-hover:bg-amber-400/25 transition-colors duration-200" />
          <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-amber-400/60 to-transparent" />

          <div className="relative z-10 flex items-center justify-between gap-2 sm:gap-3">
            <div className="min-w-0 flex-1 space-y-1">
              <div className="text-[10px] sm:text-[11px] font-bold text-amber-300 tracking-wide truncate">
                SportX Royal Club
              </div>
              <div className="text-[13px] sm:text-base font-black text-white leading-tight tracking-tight">
                VIP Privileges
              </div>
              <div className="flex items-center gap-0.5 text-[10px] sm:text-xs font-semibold text-amber-100/85 truncate pt-0.5">
                <span className="truncate">
                  {user?.rank ? `${user.rank} · Cashback` : 'Cashback · Fast Payout'}
                </span>
                <ChevronRight className="w-3.5 h-3.5 text-amber-300 shrink-0 transition-transform duration-150 group-hover:translate-x-0.5" />
              </div>
            </div>

            {/* Bespoke SportX Metallic Crown Shield SVG */}
            <div className="relative w-11 h-11 sm:w-14 sm:h-14 shrink-0 flex items-center justify-center">
              <svg
                viewBox="0 0 64 64"
                className="w-full h-full drop-shadow-[0_4px_12px_rgba(251,191,36,0.3)] transition-transform duration-200 group-hover:scale-105"
              >
                <defs>
                  <linearGradient id="vipGoldGrad" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#fef08a" />
                    <stop offset="45%" stopColor="#f59e0b" />
                    <stop offset="100%" stopColor="#b45309" />
                  </linearGradient>
                  <linearGradient id="vipShieldBg" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#172554" />
                    <stop offset="100%" stopColor="#070e24" />
                  </linearGradient>
                </defs>
                {/* Crest Hex/Shield Backing */}
                <path
                  d="M32 5 L55 15 V33 C55 46 44 55 32 59 C20 55 9 46 9 33 V15 Z"
                  fill="url(#vipShieldBg)"
                  stroke="url(#vipGoldGrad)"
                  strokeWidth="2.2"
                />
                <path
                  d="M32 9.5 L50.5 17.5 V32.5 C50.5 43 41.5 50.5 32 54 C22.5 50.5 13.5 43 13.5 32.5 V17.5 Z"
                  fill="none"
                  stroke="#f59e0b"
                  strokeWidth="0.8"
                  opacity="0.35"
                />
                {/* Metallic Crown */}
                <path
                  d="M19 39 L16 24 L25 30 L32 19 L39 30 L48 24 L45 39 Z"
                  fill="url(#vipGoldGrad)"
                  stroke="#fef3c7"
                  strokeWidth="0.9"
                  strokeLinejoin="round"
                />
                {/* Crown Base Band */}
                <rect x="19" y="40.5" width="26" height="4" rx="1.5" fill="url(#vipGoldGrad)" />
                {/* Crown Gem Highlights */}
                <circle cx="16" cy="22.5" r="1.8" fill="#fde68a" />
                <circle cx="32" cy="17.5" r="2.2" fill="#22d3ee" stroke="#fef08a" strokeWidth="0.8" />
                <circle cx="48" cy="22.5" r="1.8" fill="#fde68a" />
                <polygon points="32,30 35,34 32,37.5 29,34" fill="#22d3ee" />
              </svg>
            </div>
          </div>
        </button>
      </div>

      {/* 3. SPORTX CRUCIAL GAMES HERO BANNER SLIDER (Auto-filtered by Admin ON/OFF settings) */}
      {visibleHeroBanners.length > 0 && (
        <div
          className="space-y-2.5"
          onMouseEnter={() => setIsCarouselPaused(true)}
          onMouseLeave={() => setIsCarouselPaused(false)}
          onTouchStart={(e) => setTouchStartX(e.touches[0]?.clientX ?? null)}
          onTouchEnd={(e) => {
            if (touchStartX === null || visibleHeroBanners.length <= 1) return;
            const endX = e.changedTouches[0]?.clientX ?? touchStartX;
            const diff = touchStartX - endX;
            if (Math.abs(diff) > 36) {
              setActiveSlide((prev) =>
                diff > 0
                  ? (prev + 1) % visibleHeroBanners.length
                  : (prev - 1 + visibleHeroBanners.length) % visibleHeroBanners.length
              );
            }
            setTouchStartX(null);
          }}
        >
          <div className="relative w-full aspect-[16/9] max-h-64 rounded-2xl overflow-hidden shadow-2xl border border-slate-800/80 bg-[#071022]">
            <div
              className="flex h-full w-full transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]"
              style={{ transform: `translateX(-${activeSlide * 100}%)` }}
            >
              {visibleHeroBanners.map((banner) => {
                const isImgBroken = Boolean(failedBannerIds[banner.id]);
                return (
                  <div
                    key={banner.id}
                    onClick={() => onSelectTab?.(banner.gameKey)}
                    className="relative w-full h-full shrink-0 cursor-pointer group select-none"
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        onSelectTab?.(banner.gameKey);
                      }
                    }}
                  >
                    {!isImgBroken ? (
                      <img
                        src={banner.imageSrc}
                        alt={banner.imageAlt}
                        referrerPolicy="no-referrer"
                        onError={() =>
                          setFailedBannerIds((prev) => ({ ...prev, [banner.id]: true }))
                        }
                        className="w-full h-full object-cover object-center transition-transform duration-700 group-hover:scale-[1.03]"
                      />
                    ) : (
                      <div
                        className={`w-full h-full bg-gradient-to-br ${banner.fallbackGradient} flex items-center justify-end pr-8`}
                      >
                        <Trophy className="w-16 h-16 text-white/15" />
                      </div>
                    )}

                    {/* Measured Contrast Scrim for WCAG AA Legibility */}
                    <div className="absolute inset-0 bg-gradient-to-r from-[#050b18]/95 via-[#050b18]/70 to-transparent pointer-events-none" />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#050b18]/85 via-transparent to-transparent pointer-events-none" />

                    {/* Left-Aligned Headline & Primary CTA */}
                    <div className="absolute inset-0 flex flex-col justify-end sm:justify-center p-4 sm:p-6 max-w-[78%] sm:max-w-[66%] space-y-1.5 sm:space-y-2">
                      <div className="text-[11px] sm:text-xs font-semibold text-cyan-300/95 tracking-wide truncate">
                        {banner.kicker}
                      </div>
                      <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight leading-tight">
                        {banner.title}
                      </h2>
                      <p className="text-xs sm:text-sm text-slate-200/90 leading-snug line-clamp-2">
                        {banner.subtitle}
                      </p>
                      <div className="pt-1">
                        <span
                          className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-extrabold shadow-lg transition-transform duration-150 group-hover:translate-x-0.5 whitespace-nowrap ${banner.accentClass}`}
                        >
                          <span>{banner.ctaLabel}</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Prev / Next Controls (Bottom-Right so left headline is never overlapped) */}
            {visibleHeroBanners.length > 1 && (
              <div className="hidden sm:flex items-center gap-1.5 absolute bottom-3.5 right-3.5 z-10">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveSlide(
                      (prev) => (prev - 1 + visibleHeroBanners.length) % visibleHeroBanners.length
                    );
                  }}
                  className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-xl bg-black/55 hover:bg-black/80 text-white border border-white/15 backdrop-blur-sm transition"
                  aria-label="Previous game banner"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveSlide((prev) => (prev + 1) % visibleHeroBanners.length);
                  }}
                  className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-xl bg-black/55 hover:bg-black/80 text-white border border-white/15 backdrop-blur-sm transition"
                  aria-label="Next game banner"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {/* Interactive Pagination Controls */}
          {visibleHeroBanners.length > 1 && (
            <div className="flex items-center justify-center gap-1">
              {visibleHeroBanners.map((banner, index) => {
                const isActive = index === activeSlide;
                return (
                  <button
                    key={banner.id}
                    type="button"
                    onClick={() => setActiveSlide(index)}
                    className="min-h-[28px] px-1 flex items-center justify-center group"
                    aria-label={`Show ${banner.title} banner`}
                  >
                    <span
                      className={`h-2 rounded-full transition-all duration-300 ${
                        isActive
                          ? 'w-7 bg-[#22d3ee] shadow-[0_0_8px_rgba(34,211,238,0.7)]'
                          : 'w-2 bg-slate-600/80 group-hover:bg-slate-400'
                      }`}
                    />
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* 4. MARQUEE ANNOUNCEMENT BAR (Matching Reference Image) */}
      <div className="flex items-center gap-2.5 px-3 py-2 rounded-2xl bg-[#08122a] border border-[#1b2a54] shadow-inner overflow-hidden">
        <div className="w-6 h-6 rounded-full bg-cyan-500/15 flex items-center justify-center text-cyan-400 shrink-0">
          <Volume2 className="w-3.5 h-3.5" />
        </div>

        <div className="flex-1 overflow-hidden whitespace-nowrap text-xs text-slate-200 font-medium">
          <div className="animate-marquee flex items-center">
            <span>🎉 Welcome to join the SportX platform. We provide a brand new gaming experience with 100% fair games and instant withdrawals! 🔥&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span>
            <span>🎉 Welcome to join the SportX platform. We provide a brand new gaming experience with 100% fair games and instant withdrawals! 🔥&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span>
          </div>
        </div>

        <button
          onClick={() => setShowDetailModal(true)}
          className="shrink-0 px-3 py-1 rounded-full bg-gradient-to-r from-[#4ee2c4] to-[#22d3ee] hover:brightness-110 active:scale-95 text-[#071b26] text-[11px] font-extrabold shadow-sm transition-all"
        >
          Detail
        </button>
      </div>

      {/* 4.5. WALLET BALANCE & ACTION BUTTONS (Exact Match to Reference Image) */}
      <div className="flex items-center justify-between px-1.5 py-1">
        {/* Left: Gold coin + "Wallet balance" + ₹0.00 + Refresh icon */}
        <div className="flex flex-col justify-center">
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-gradient-to-tr from-amber-400 to-yellow-200 shadow-[0_0_8px_rgba(250,204,21,0.7)] shrink-0 border border-amber-300" />
            <span className="text-[#9aaac8] text-xs font-semibold tracking-wide">Wallet balance</span>
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-xl sm:text-2xl font-black text-white tracking-tight leading-none">
              ₹{inrBalance}
            </span>
            <button
              onClick={handleRefreshBalance}
              className="p-0.5 text-[#64748b] hover:text-white transition-colors active:scale-90"
              title="Refresh balance"
            >
              <RotateCw
                className={`w-3.5 h-3.5 transition-transform duration-500 ${
                  isRefreshing ? 'animate-spin text-cyan-400' : ''
                }`}
              />
            </button>
          </div>
        </div>

        {/* Right: Withdraw & Deposit squircle buttons */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          {/* Withdraw Button */}
          <button
            onClick={onOpenWithdraw}
            className="flex flex-col items-center justify-center min-w-[70px] sm:min-w-[80px] h-10 px-2.5 rounded-xl bg-gradient-to-b from-[#ffad5a] to-[#ff7e2e] hover:brightness-105 active:scale-95 text-white shadow-md shadow-orange-500/25 transition-all"
            title="Withdraw funds"
          >
            <ArrowUp className="w-3.5 h-3.5 stroke-[3] mb-0.5 text-white" />
            <span className="text-[11px] sm:text-xs font-bold leading-none">Withdraw</span>
          </button>

          {/* Deposit Button */}
          <button
            onClick={onOpenDeposit}
            className="flex flex-col items-center justify-center min-w-[70px] sm:min-w-[80px] h-10 px-2.5 rounded-xl bg-gradient-to-b from-[#ff6b76] to-[#f43f5e] hover:brightness-105 active:scale-95 text-white shadow-md shadow-rose-500/25 transition-all"
            title="Deposit funds"
          >
            <ArrowDown className="w-3.5 h-3.5 stroke-[3] mb-0.5 text-white" />
            <span className="text-[11px] sm:text-xs font-bold leading-none">Deposit</span>
          </button>
        </div>
      </div>

      {/* 5. SEQUENCED GAME CATEGORY GRID (Auto-compacts with zero blank slots) */}
      {categories.length > 0 && (
        <div className={`grid ${categoryGridColsClass} gap-2.5 sm:gap-3 my-3`}>
          {categories.map((cat) => {
            const Icon = cat.icon;
            const isSelected = activeCategory === cat.id;

            return (
              <button
                key={cat.id}
                onClick={() => {
                  setActiveCategory(cat.id);
                  if (cat.defaultTab && onSelectTab) {
                    onSelectTab(cat.defaultTab);
                  }
                }}
                className={`relative rounded-2xl p-2 sm:p-2.5 flex flex-col items-center justify-center transition-all duration-200 active:scale-95 ${
                  isSelected
                    ? 'bg-[#0d1d46] border-2 border-[#22d3ee] shadow-[0_0_18px_rgba(34,211,238,0.4)]'
                    : 'bg-[#0b1430] border border-blue-900/40 hover:border-cyan-500/30'
                }`}
              >
                <div className="relative w-12 h-12 flex items-center justify-center mb-1">
                  <Icon />
                  {cat.isHot && (
                    <span className="absolute -top-1 -right-2 px-1.5 py-0.5 bg-gradient-to-r from-red-500 to-rose-600 text-white text-[9px] font-black rounded-full shadow-md animate-pulse">
                      HOT
                    </span>
                  )}
                </div>
                <span
                  className={`text-[11px] sm:text-xs font-bold leading-tight ${
                    isSelected ? 'text-[#22d3ee]' : 'text-slate-300'
                  }`}
                >
                  {cat.label}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* 6. CATEGORY CONTENT & SEQUENCED GAME CARDS */}
      <div className="space-y-3 pt-1">
        {/* Category Header */}
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <span className="text-xl">
              {activeCategory === 'lottery' && (isGameEnabled('luckydraw', settings) ? '🎱' : '🎮')}
              {activeCategory === 'aviator' && '✈️'}
              {activeCategory === 'sports' && '🏏'}
              {activeCategory === 'minigames' && '🚀'}
              {activeCategory === 'casino' && '🧭'}
              {activeCategory === 'pvc' && '🃏'}
              {activeCategory === 'hotslots' && '🔥'}
              {activeCategory === 'slots' && '🎰'}
            </span>
            <h2 className="text-lg font-black text-white tracking-tight capitalize">
              {activeCategory === 'lottery'
                ? (isGameEnabled('luckydraw', settings) ? 'Lottery' : 'Featured Games')
                : categories.find((c) => c.id === activeCategory)?.label}
            </h2>
          </div>
          <span className="text-xs text-cyan-400 font-mono">
            {activeCategory === 'lottery' && (isGameEnabled('luckydraw', settings) ? '● 1M Rapid Draw' : '● Live Arena')}
            {activeCategory === 'aviator' && '● Live 100X Multiplier'}
            {activeCategory === 'sports' && '● Dream11 Live XI'}
            {activeCategory === 'minigames' && '● 100X Multiplier'}
            {activeCategory === 'casino' && '● 2X / 8X Payout'}
          </span>
        </div>

        {/* Game Cards Section - Auto-sequenced grid (only enabled games appear, zero blank slots) */}
        {activeCategory === 'lottery' && (
          visibleGameKeys.length === 0 ? (
            <div className="rounded-2xl p-6 bg-[#0b1430] border border-slate-800 text-center space-y-2">
              <div className="text-2xl">🛠️</div>
              <div className="text-sm font-black text-white">Games Under Scheduled Maintenance</div>
              <p className="text-xs text-slate-400">
                Admin has temporarily paused all games. Your Main Wallet funds remain 100% safe.
              </p>
            </div>
          ) : (
          <div className={`grid ${cardGridColsClass} gap-2 sm:gap-3`}>
            {/* 1. Win Go 1M / Color Guess */}
            {isGameEnabled('colorprediction', settings) && (
            <div
              onClick={() => onSelectTab?.('colorprediction')}
              className="relative overflow-hidden rounded-2xl p-2.5 sm:p-3 bg-gradient-to-br from-[#4f46e5] via-[#3730a3] to-[#1e1b4b] border border-indigo-400/30 shadow-lg cursor-pointer group hover:border-indigo-400 hover:shadow-indigo-500/30 transition flex flex-col justify-between min-h-[155px] sm:min-h-[170px]"
            >
              <div>
                <div className="flex items-center justify-between gap-1">
                  <span className="text-sm sm:text-base font-black italic tracking-tight text-white">WIN GO</span>
                  <span className="text-[8px] sm:text-[9px] font-mono bg-indigo-950/80 text-indigo-200 border border-indigo-500/40 px-1.5 py-0.5 rounded-full font-bold">
                    {`00:${countdownSeconds < 10 ? '0' : ''}${countdownSeconds}`}
                  </span>
                </div>
                <div className="text-[9px] sm:text-[10px] font-bold text-indigo-200 mt-0.5 truncate">Color Guess</div>
              </div>

              {/* Numbered lottery balls */}
              <div className="flex items-center justify-center gap-1 my-1">
                <span className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-gradient-to-tr from-rose-500 to-pink-400 flex items-center justify-center text-[10px] sm:text-xs font-black text-white shadow-sm">
                  1
                </span>
                <span className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-[10px] sm:text-xs font-black text-white shadow-sm">
                  3
                </span>
                <span className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-gradient-to-tr from-violet-500 to-purple-400 flex items-center justify-center text-[10px] sm:text-xs font-black text-white shadow-sm">
                  7
                </span>
              </div>

              <div>
                <button className="w-full py-1 sm:py-1.5 rounded-lg sm:rounded-xl bg-white text-indigo-950 font-black text-[10px] sm:text-xs shadow-md group-hover:bg-indigo-100 transition text-center">
                  Play Now
                </button>

                {/* Live Playing Indicator with Blinking Green Dot */}
                <div className="flex items-center justify-center gap-1 mt-1.5 text-[8px] sm:text-[9.5px] font-mono leading-none">
                  <span className="relative flex h-2 w-2 shrink-0">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-80" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.9)]" />
                  </span>
                  <span className="font-bold text-emerald-300">
                    {activePlayers.wingo.toLocaleString()}
                  </span>
                  <span className="text-slate-300 font-medium">Playing</span>
                </div>
              </div>
            </div>
            )}

            {/* 2. AVIATOR (100X Multiplier Crash Game) */}
            {isGameEnabled('aviator', settings) && (
            <div
              onClick={() => onSelectTab?.('aviator')}
              className="relative overflow-hidden rounded-2xl p-2.5 sm:p-3 bg-gradient-to-br from-[#dc2626] via-[#991b1b] to-[#450a0a] border border-rose-500/40 shadow-lg cursor-pointer group hover:border-rose-400 hover:shadow-rose-500/30 transition flex flex-col justify-between min-h-[155px] sm:min-h-[170px]"
            >
              <div>
                <div className="flex items-center justify-between gap-1">
                  <span className="text-sm sm:text-base font-black italic tracking-tight text-white">AVIATOR</span>
                  <span className="text-[8px] sm:text-[9px] font-mono bg-rose-950/80 text-rose-200 border border-rose-500/50 px-1.5 py-0.5 rounded-full font-bold animate-pulse">
                    🚀 100X
                  </span>
                </div>
                <div className="text-[9px] sm:text-[10px] font-bold text-rose-200 mt-0.5 truncate">Crash Jet</div>
              </div>

              {/* Live Aviator Jet Status */}
              <div className="flex items-center justify-center gap-1 my-1">
                <span className="text-base sm:text-lg animate-pulse">✈️</span>
                <span className="text-[9px] sm:text-[10px] font-mono font-black text-yellow-300 bg-black/50 px-1.5 py-0.5 rounded border border-yellow-400/30">
                  2.64x
                </span>
              </div>

              <div>
                <button className="w-full py-1 sm:py-1.5 rounded-lg sm:rounded-xl bg-white text-rose-950 font-black text-[10px] sm:text-xs shadow-md group-hover:bg-rose-100 transition text-center">
                  Play Aviator
                </button>

                {/* Live Playing Indicator with Blinking Green Dot */}
                <div className="flex items-center justify-center gap-1 mt-1.5 text-[8px] sm:text-[9.5px] font-mono leading-none">
                  <span className="relative flex h-2 w-2 shrink-0">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-80" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.9)]" />
                  </span>
                  <span className="font-bold text-emerald-300">
                    {activePlayers.aviator.toLocaleString()}
                  </span>
                  <span className="text-slate-300 font-medium">Playing</span>
                </div>
              </div>
            </div>
            )}

            {/* 3. LOTTERY / Mega Lucky Draw */}
            {isGameEnabled('luckydraw', settings) && (
            <div
              onClick={() => onSelectTab?.('luckydraw')}
              className="relative overflow-hidden rounded-2xl p-2.5 sm:p-3 bg-gradient-to-br from-[#ea580c] via-[#c2410c] to-[#7c2d12] border border-orange-400/30 shadow-lg cursor-pointer group hover:border-orange-400 hover:shadow-orange-500/30 transition flex flex-col justify-between min-h-[155px] sm:min-h-[170px]"
            >
              <div>
                <div className="flex items-center justify-between gap-1">
                  <span className="text-sm sm:text-base font-black italic tracking-tight text-white">LOTTERY</span>
                  <span className="text-[8px] sm:text-[9px] font-mono bg-amber-950/70 text-amber-200 border border-amber-500/40 px-1.5 py-0.5 rounded-full font-bold">
                    🎟️ ₹25K+
                  </span>
                </div>
                <div className="text-[9px] sm:text-[10px] font-bold text-orange-200 mt-0.5 truncate">Mega Lucky Draw</div>
              </div>

              {/* Lottery graphic snippet */}
              <div className="flex items-center justify-center gap-1 text-base sm:text-lg my-1">
                <span>🎟️</span>
                <span>🎱</span>
                <span>🏆</span>
              </div>

              <div>
                <button className="w-full py-1 sm:py-1.5 rounded-lg sm:rounded-xl bg-white text-orange-950 font-black text-[10px] sm:text-xs shadow-md group-hover:bg-orange-100 transition text-center">
                  Play Lottery
                </button>

                {/* Live Playing Indicator with Blinking Green Dot */}
                <div className="flex items-center justify-center gap-1 mt-1.5 text-[8px] sm:text-[9.5px] font-mono leading-none">
                  <span className="relative flex h-2 w-2 shrink-0">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-80" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.9)]" />
                  </span>
                  <span className="font-bold text-emerald-300">
                    {activePlayers.racing.toLocaleString()}
                  </span>
                  <span className="text-slate-300 font-medium">Playing</span>
                </div>
              </div>
            </div>
            )}

            {/* 4. DRAGON VS TIGER (Live 2X / 8X Card Arena) */}
            {isGameEnabled('dragontiger', settings) && (
            <div
              onClick={() => onSelectTab?.('dragontiger')}
              className="relative overflow-hidden rounded-2xl p-2.5 sm:p-3 bg-gradient-to-br from-[#b45309] via-[#854d0e] to-[#451a03] border border-amber-500/40 shadow-lg cursor-pointer group hover:border-amber-400 hover:shadow-amber-500/30 transition flex flex-col justify-between min-h-[155px] sm:min-h-[170px]"
            >
              <div>
                <div className="flex items-center justify-between gap-1">
                  <span className="text-sm sm:text-base font-black italic tracking-tight text-white">DRAGON</span>
                  <span className="text-[8px] sm:text-[9px] font-mono bg-amber-950/70 text-yellow-200 border border-amber-500/40 px-1.5 py-0.5 rounded-full font-bold">
                    2X • 8X
                  </span>
                </div>
                <div className="text-[9px] sm:text-[10px] font-bold text-amber-200 mt-0.5 truncate">Dragon vs Tiger</div>
              </div>

              {/* Card clash graphic snippet */}
              <div className="flex items-center justify-center gap-1 text-base sm:text-lg my-1">
                <span>🐉</span>
                <span className="text-[10px] font-black text-rose-400">VS</span>
                <span>🐅</span>
              </div>

              <div>
                <button className="w-full py-1 sm:py-1.5 rounded-lg sm:rounded-xl bg-white text-amber-950 font-black text-[10px] sm:text-xs shadow-md group-hover:bg-amber-100 transition text-center">
                  Play Now
                </button>

                {/* Live Playing Indicator with Blinking Green Dot */}
                <div className="flex items-center justify-center gap-1 mt-1.5 text-[8px] sm:text-[9.5px] font-mono leading-none">
                  <span className="relative flex h-2 w-2 shrink-0">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-80" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.9)]" />
                  </span>
                  <span className="font-bold text-emerald-300">
                    {activePlayers.dragon.toLocaleString()}
                  </span>
                  <span className="text-slate-300 font-medium">Playing</span>
                </div>
              </div>
            </div>
            )}

            {/* 5. CRICKET (IPL Fantasy & Real Time Contest) */}
            {isGameEnabled('cricket', settings) && (
            <div
              onClick={() => onSelectTab?.('cricket')}
              className="relative overflow-hidden rounded-2xl p-2.5 sm:p-3 bg-gradient-to-br from-[#059669] via-[#047857] to-[#064e3b] border border-emerald-400/30 shadow-lg cursor-pointer group hover:border-emerald-400 hover:shadow-emerald-500/30 transition flex flex-col justify-between min-h-[155px] sm:min-h-[170px]"
            >
              <div>
                <div className="flex items-center justify-between gap-1">
                  <span className="text-sm sm:text-base font-black italic tracking-tight text-white">CRICKET</span>
                  <span className="text-[8px] sm:text-[9px] font-mono bg-emerald-950/80 text-emerald-200 border border-emerald-500/40 px-1.5 py-0.5 rounded-full font-bold animate-pulse">
                    🏏 LIVE
                  </span>
                </div>
                <div className="text-[9px] sm:text-[10px] font-bold text-emerald-200 mt-0.5 truncate">Dream11 League</div>
              </div>

              {/* Cricket graphic snippet */}
              <div className="flex items-center justify-center gap-1 text-base sm:text-lg my-1">
                <span>🏏</span>
                <span className="text-sm">⚡</span>
                <span>🏆</span>
              </div>

              <div>
                <button className="w-full py-1 sm:py-1.5 rounded-lg sm:rounded-xl bg-white text-emerald-950 font-black text-[10px] sm:text-xs shadow-md group-hover:bg-emerald-100 transition text-center">
                  Play Cricket
                </button>

                {/* Live Playing Indicator with Blinking Green Dot */}
                <div className="flex items-center justify-center gap-1 mt-1.5 text-[8px] sm:text-[9.5px] font-mono leading-none">
                  <span className="relative flex h-2 w-2 shrink-0">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-80" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.9)]" />
                  </span>
                  <span className="font-bold text-emerald-300">
                    {activePlayers.cricket.toLocaleString()}
                  </span>
                  <span className="text-slate-300 font-medium">Playing</span>
                </div>
              </div>
            </div>
            )}

            {/* 6. WHEEL OF FORTUNE (Daily Lucky Spin & Multipliers) */}
            {isGameEnabled('spinwheel', settings) && (
            <div
              onClick={() => onSelectTab?.('spinwheel')}
              className="relative overflow-hidden rounded-2xl p-2.5 sm:p-3 bg-gradient-to-br from-[#7c3aed] via-[#6d28d9] to-[#4c1d95] border border-purple-400/40 shadow-lg cursor-pointer group hover:border-purple-300 hover:shadow-purple-500/40 transition flex flex-col justify-between min-h-[155px] sm:min-h-[170px]"
            >
              <div>
                <div className="flex items-center justify-between gap-1">
                  <span className="text-sm sm:text-base font-black italic tracking-tight text-white">WHEEL</span>
                  <span className="text-[8px] sm:text-[9px] font-mono bg-purple-950/80 text-purple-200 border border-purple-500/40 px-1.5 py-0.5 rounded-full font-bold">
                    🎡 100%
                  </span>
                </div>
                <div className="text-[9px] sm:text-[10px] font-bold text-purple-200 mt-0.5 truncate">Lucky Fortune</div>
              </div>

              {/* Wheel graphic snippet */}
              <div className="flex items-center justify-center gap-1 text-base sm:text-lg my-1">
                <span className="animate-spin" style={{ animationDuration: '6s' }}>🎡</span>
                <span>💎</span>
              </div>

              <div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectTab?.('spinwheel');
                  }}
                  className="w-full py-1 sm:py-1.5 rounded-lg sm:rounded-xl bg-white text-purple-950 font-black text-[10px] sm:text-xs shadow-md group-hover:bg-purple-100 transition text-center"
                >
                  Spin Wheel
                </button>

                {/* Live Playing Indicator with Blinking Green Dot */}
                <div className="flex items-center justify-center gap-1 mt-1.5 text-[8px] sm:text-[9.5px] font-mono leading-none">
                  <span className="relative flex h-2 w-2 shrink-0">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-80" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.9)]" />
                  </span>
                  <span className="font-bold text-emerald-300">
                    {activePlayers.wheel.toLocaleString()}
                  </span>
                  <span className="text-slate-300 font-medium">Playing</span>
                </div>
              </div>
            </div>
            )}

            {/* 7. 777 VEGAS SLOTS (50X Jackpot Slot Machine) */}
            {isGameEnabled('slot777', settings) && (
            <div
              onClick={() => onSelectTab?.('slot777')}
              className="relative overflow-hidden rounded-2xl p-2.5 sm:p-3 bg-gradient-to-br from-[#831843] via-[#701a75] to-[#4c0519] border border-pink-400/40 shadow-lg cursor-pointer group hover:border-pink-300 hover:shadow-pink-500/40 transition flex flex-col justify-between min-h-[155px] sm:min-h-[170px]"
            >
              <div>
                <div className="flex items-center justify-between gap-1">
                  <span className="text-sm sm:text-base font-black italic tracking-tight text-white">777 SLOTS</span>
                  <span className="text-[8px] sm:text-[9px] font-mono bg-pink-950/80 text-pink-200 border border-pink-500/40 px-1.5 py-0.5 rounded-full font-bold">
                    🎰 50X
                  </span>
                </div>
                <div className="text-[9px] sm:text-[10px] font-bold text-pink-200 mt-0.5 truncate">Vegas Gold 777</div>
              </div>

              {/* 777 Reel Graphic */}
              <div className="flex items-center justify-center gap-1 text-base sm:text-lg my-1">
                <span>7️⃣</span>
                <span>💎</span>
                <span>🔔</span>
              </div>

              <div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectTab?.('slot777');
                  }}
                  className="w-full py-1 sm:py-1.5 rounded-lg sm:rounded-xl bg-white text-pink-950 font-black text-[10px] sm:text-xs shadow-md group-hover:bg-pink-100 transition text-center"
                >
                  Spin 777
                </button>

                <div className="flex items-center justify-center gap-1 mt-1.5 text-[8px] sm:text-[9.5px] font-mono leading-none">
                  <span className="relative flex h-2 w-2 shrink-0">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-80" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.9)]" />
                  </span>
                  <span className="font-bold text-emerald-300">3,120</span>
                  <span className="text-slate-300 font-medium">Playing</span>
                </div>
              </div>
            </div>
            )}

            {/* 8. INDIAN RUMMY (13-Card Points Table) */}
            {isGameEnabled('rummy', settings) && (
            <div
              onClick={() => onSelectTab?.('rummy')}
              className="relative overflow-hidden rounded-2xl p-2.5 sm:p-3 bg-gradient-to-br from-[#064e3b] via-[#065f46] to-[#022c22] border border-emerald-400/40 shadow-lg cursor-pointer group hover:border-emerald-300 hover:shadow-emerald-500/40 transition flex flex-col justify-between min-h-[155px] sm:min-h-[170px]"
            >
              <div>
                <div className="flex items-center justify-between gap-1">
                  <span className="text-sm sm:text-base font-black italic tracking-tight text-white">RUMMY</span>
                  <span className="text-[8px] sm:text-[9px] font-mono bg-emerald-950/80 text-emerald-200 border border-emerald-500/40 px-1.5 py-0.5 rounded-full font-bold">
                    🃏 13-CARD
                  </span>
                </div>
                <div className="text-[9px] sm:text-[10px] font-bold text-emerald-200 mt-0.5 truncate">Points Rummy</div>
              </div>

              {/* Cards clash graphic */}
              <div className="flex items-center justify-center gap-1 text-base sm:text-lg my-1">
                <span>♠️</span>
                <span>♥️</span>
                <span>♦️</span>
              </div>

              <div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectTab?.('rummy');
                  }}
                  className="w-full py-1 sm:py-1.5 rounded-lg sm:rounded-xl bg-white text-emerald-950 font-black text-[10px] sm:text-xs shadow-md group-hover:bg-emerald-100 transition text-center"
                >
                  Play Rummy
                </button>

                <div className="flex items-center justify-center gap-1 mt-1.5 text-[8px] sm:text-[9.5px] font-mono leading-none">
                  <span className="relative flex h-2 w-2 shrink-0">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-80" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.9)]" />
                  </span>
                  <span className="font-bold text-emerald-300">4,890</span>
                  <span className="text-slate-300 font-medium">Playing</span>
                </div>
              </div>
            </div>
            )}

            {/* 9. CHICKEN ROAD (Crossing Crash Game) */}
            {isGameEnabled('chickenroad', settings) && (
            <div
              onClick={() => onSelectTab?.('chickenroad')}
              className="relative overflow-hidden rounded-2xl p-2.5 sm:p-3 bg-gradient-to-br from-[#9a3412] via-[#7c2d12] to-[#431407] border border-amber-400/40 shadow-lg cursor-pointer group hover:border-amber-300 hover:shadow-amber-500/40 transition flex flex-col justify-between min-h-[155px] sm:min-h-[170px]"
            >
              <div>
                <div className="flex items-center justify-between gap-1">
                  <span className="text-sm sm:text-base font-black italic tracking-tight text-white">CHICKEN</span>
                  <span className="text-[8px] sm:text-[9px] font-mono bg-amber-950/80 text-amber-200 border border-amber-500/40 px-1.5 py-0.5 rounded-full font-bold">
                    🐔 55X
                  </span>
                </div>
                <div className="text-[9px] sm:text-[10px] font-bold text-amber-200 mt-0.5 truncate">Chicken Road</div>
              </div>

              {/* Chicken Road graphic */}
              <div className="flex items-center justify-center gap-1 text-base sm:text-lg my-1">
                <span>🐔</span>
                <span>🛣️</span>
                <span>💰</span>
              </div>

              <div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectTab?.('chickenroad');
                  }}
                  className="w-full py-1 sm:py-1.5 rounded-lg sm:rounded-xl bg-white text-amber-950 font-black text-[10px] sm:text-xs shadow-md group-hover:bg-amber-100 transition text-center"
                >
                  Cross Road
                </button>

                <div className="flex items-center justify-center gap-1 mt-1.5 text-[8px] sm:text-[9.5px] font-mono leading-none">
                  <span className="relative flex h-2 w-2 shrink-0">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-80" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.9)]" />
                  </span>
                  <span className="font-bold text-emerald-300">5,430</span>
                  <span className="text-slate-300 font-medium">Playing</span>
                </div>
              </div>
            </div>
            )}
          </div>
          )
        )}

        {/* When Sports is selected */}
        {activeCategory === 'sports' && isGameEnabled('cricket', settings) && (
          <div
            onClick={() => onSelectTab?.('cricket')}
            className="rounded-2xl p-4 bg-gradient-to-br from-[#1a080c] via-[#140b17] to-[#090d1a] border border-red-500/40 shadow-xl cursor-pointer hover:border-red-400 transition"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-black text-red-400 bg-red-500/20 border border-red-500/40 px-2.5 py-0.5 rounded-full">
                🏏 DREAM11 STYLE FANTASY
              </span>
              <span className="text-xs font-mono font-bold text-amber-300">Prize: ₹5,00,000+ INR</span>
            </div>
            <div className="flex items-center justify-between py-2 border-y border-slate-800">
              <div className="text-center">
                <div className="text-lg font-black text-yellow-400">CSK</div>
                <div className="text-[10px] text-slate-400">Chennai Super Kings</div>
              </div>
              <div className="text-center">
                <div className="text-xs font-black text-rose-500 uppercase">VS</div>
                <div className="text-[10px] font-mono text-emerald-400 animate-pulse">● LIVE 18.4 OVERS</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-black text-blue-400">MI</div>
                <div className="text-[10px] text-slate-400">Mumbai Indians</div>
              </div>
            </div>
            <button className="w-full mt-3 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-amber-600 text-white font-black text-xs shadow-lg">
              Draft Dream 11 & Join Contest →
            </button>
          </div>
        )}

        {/* When Mini Games (Chicken Road) is selected */}
        {activeCategory === 'minigames' && isGameEnabled('chickenroad', settings) && (
          <div
            onClick={() => onSelectTab?.('chickenroad')}
            className="rounded-2xl p-4 bg-gradient-to-br from-[#2a0e05] via-[#1a0a04] to-[#090d1a] border border-amber-500/40 shadow-xl cursor-pointer hover:border-amber-400 transition"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-black text-amber-300 bg-amber-500/20 border border-amber-500/40 px-2.5 py-0.5 rounded-full">
                🐔 55X CHICKEN ROAD CROSS
              </span>
              <span className="text-xs font-mono font-bold text-emerald-400">5,430 Active Players</span>
            </div>
            <div className="text-2xl font-black text-amber-300 font-mono py-1">Chicken Road Cross & Cashout</div>
            <p className="text-xs text-slate-300">
              Cross lanes safely, avoid frying traps, watch multipliers multiply with every step, and Cash Out anytime!
            </p>
            <button className="w-full mt-3 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 via-yellow-400 to-orange-500 text-slate-950 font-black text-xs shadow-lg">
              Cross Chicken Road (55X) →
            </button>
          </div>
        )}

        {/* When Aviator is selected */}
        {activeCategory === 'aviator' && isGameEnabled('aviator', settings) && (
          <div
            onClick={() => onSelectTab?.('aviator')}
            className="rounded-2xl p-4 bg-gradient-to-br from-[#1c0817] via-[#140c1e] to-[#090d1a] border border-rose-500/40 shadow-xl cursor-pointer hover:border-rose-400 transition"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-black text-rose-400 bg-rose-500/20 border border-rose-500/40 px-2.5 py-0.5 rounded-full">
                🚀 100X MULTIPLIER CRASH
              </span>
              <span className="text-xs font-mono font-bold text-emerald-400">2,420 Online</span>
            </div>
            <div className="text-2xl font-black text-rose-300 font-mono py-1">Aviator Rocket Takeoff</div>
            <p className="text-xs text-slate-300">
              Watch the multiplier soar up to 100X in real-time. Hit Cash Out before the jet flies away!
            </p>
            <button className="w-full mt-3 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-pink-600 text-white font-black text-xs shadow-lg">
              Launch Aviator 100X →
            </button>
          </div>
        )}

        {/* When PVC (Rummy) is selected */}
        {activeCategory === 'pvc' && isGameEnabled('rummy', settings) && (
          <div
            onClick={() => onSelectTab?.('rummy')}
            className="rounded-2xl p-4 bg-gradient-to-br from-[#062414] via-[#051c0f] to-[#020a06] border border-emerald-500/40 shadow-xl cursor-pointer hover:border-emerald-400 transition"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-black text-emerald-300 bg-emerald-500/20 border border-emerald-500/40 px-2.5 py-0.5 rounded-full">
                🃏 INDIAN 13-CARD RUMMY
              </span>
              <span className="text-xs font-mono font-bold text-amber-300">Live 2P / 6P Tables</span>
            </div>
            <div className="text-2xl font-black text-emerald-200 font-mono py-1">Points Rummy Classic</div>
            <p className="text-xs text-slate-300">
              Form Pure Sequences, Sets & Melds with Wild Jokers! Fast-paced Indian Rummy with instant wallet settlement.
            </p>
            <button className="w-full mt-3 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 text-slate-950 font-black text-xs shadow-lg">
              Join Rummy Table →
            </button>
          </div>
        )}

        {/* When Casino is selected */}
        {activeCategory === 'casino' && isGameEnabled('dragontiger', settings) && (
          <div
            onClick={() => onSelectTab?.('dragontiger')}
            className="rounded-2xl p-4 bg-gradient-to-br from-[#1a1105] via-[#130f1d] to-[#090d1a] border border-amber-500/40 shadow-xl cursor-pointer hover:border-amber-400 transition"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-black text-amber-400 bg-amber-500/20 border border-amber-500/40 px-2.5 py-0.5 rounded-full">
                🐅 2-CARD LIVE CLASH
              </span>
              <span className="text-xs font-mono font-bold text-yellow-300">Dragon 2X • Tie 8X</span>
            </div>
            <div className="text-2xl font-black text-amber-300 font-mono py-1">Dragon vs Tiger</div>
            <p className="text-xs text-slate-300">
              High card wins between Dragon and Tiger! Ultra-fast 20-second rounds with instant wallet settlement.
            </p>
            <button className="w-full mt-3 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 text-black font-black text-xs shadow-lg">
              Enter Table Arena →
            </button>
          </div>
        )}

        {/* When Slots or Hot Slots is selected */}
        {(activeCategory === 'slots' || activeCategory === 'hotslots') && isGameEnabled('slot777', settings) && (
          <div
            onClick={() => onSelectTab?.('slot777')}
            className="rounded-2xl p-4 bg-gradient-to-br from-[#1a0a20] via-[#120b1e] to-[#090d1a] border border-pink-500/40 shadow-xl cursor-pointer hover:border-pink-400 transition"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-black text-pink-300 bg-pink-500/20 border border-pink-500/40 px-2.5 py-0.5 rounded-full">
                🎰 777 JACKPOT REELS
              </span>
              <span className="text-xs font-mono font-bold text-yellow-300">50X Grand Jackpot</span>
            </div>
            <div className="text-2xl font-black text-pink-200 font-mono py-1">777 Vegas Slots</div>
            <p className="text-xs text-slate-300">
              Hit Lucky 7s, Diamonds, and Golden Bells on 3 mechanical reels with instant payout celebration!
            </p>
            <button className="w-full mt-3 py-2.5 rounded-xl bg-gradient-to-r from-pink-600 via-rose-500 to-amber-500 text-slate-950 font-black text-xs shadow-lg">
              Spin 777 Vegas Reels →
            </button>
          </div>
        )}

        {/* When Fishing is selected */}
        {activeCategory === 'fishing' && (
          <div
            onClick={() => onSelectTab?.('aviator')}
            className="rounded-2xl p-4 bg-gradient-to-br from-[#051c20] via-[#091522] to-[#090d1a] border border-cyan-500/40 shadow-xl cursor-pointer hover:border-cyan-400 transition"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-black text-cyan-300 bg-cyan-500/20 border border-cyan-500/40 px-2.5 py-0.5 rounded-full">
                🎣 OCEAN KING HUNTER
              </span>
              <span className="text-xs font-mono font-bold text-emerald-400">Cannon Multiplier 300X</span>
            </div>
            <div className="text-2xl font-black text-cyan-200 font-mono py-1">Ocean King Fish Hunter</div>
            <p className="text-xs text-slate-300">
              Arcade fish shooting game. Aim powerful lasers at golden dragons and deep sea creatures for massive coin bursts!
            </p>
            <button className="w-full mt-3 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-black font-black text-xs shadow-lg">
              Start Fishing Arcade →
            </button>
          </div>
        )}
      </div>

      {/* DETAIL MODAL (Hindi Official Advisory) */}
      {showDetailModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#0b1430] border border-cyan-500/40 rounded-3xl max-w-sm w-full p-6 shadow-2xl relative">
            <button
              onClick={() => setShowDetailModal(false)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-800 text-slate-300 hover:text-white flex items-center justify-center"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="w-12 h-12 rounded-2xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400 mb-4">
              <ShieldCheck className="w-6 h-6" />
            </div>

            <h3 className="text-lg font-black text-white mb-2">Important Security Notice</h3>
            <div className="space-y-3 text-xs text-slate-300 leading-relaxed font-sans">
              <p className="bg-[#080d20] p-3 rounded-xl border border-cyan-500/20 text-cyan-200">
                Our official customer service team will never send unauthorized external links or direct messages asking for deposits outside the app.
              </p>
              <p>
                Please do not click on unverified links or share your password, login PIN, or wallet credentials with anyone claiming to represent support.
              </p>
              <p className="text-slate-400">
                Official SportX Security Shield • 24/7 Verified Gateway • 100% Provably Fair.
              </p>
            </div>

            <button
              onClick={() => setShowDetailModal(false)}
              className="w-full mt-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-black font-black text-xs shadow-lg"
            >
              Understood
            </button>
          </div>
        </div>
      )}

      {/* ADD TO DESKTOP MODAL */}
      {showInstallModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#0b1430] border border-cyan-500/40 rounded-3xl max-w-sm w-full p-6 shadow-2xl relative text-center">
            <button
              onClick={() => setShowInstallModal(false)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-800 text-slate-300 hover:text-white flex items-center justify-center"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-tr from-[#082046] to-[#0e3b6d] border border-cyan-400 flex items-center justify-center mb-4 shadow-[0_0_20px_rgba(34,211,238,0.4)]">
              <JalwaLogo size="sm" />
            </div>

            <h3 className="text-lg font-black text-white mb-1">Install SportX</h3>
            <p className="text-xs text-slate-300 mb-4">
              Add SportX directly to your phone or desktop home screen for ultra-fast, 1-tap gaming!
            </p>

            <div className="text-left bg-[#080e22] p-3.5 rounded-2xl border border-blue-900/40 text-xs text-slate-300 space-y-2 mb-4">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>On Chrome/Android: Tap three dots (⋮) & select "Install App".</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>On Safari/iOS: Tap Share button (⎙) & select "Add to Home Screen".</span>
              </div>
            </div>

            <button
              onClick={() => setShowInstallModal(false)}
              className="w-full py-2.5 rounded-xl bg-[#22d3ee] text-black font-black text-xs shadow-lg hover:bg-cyan-300 transition"
            >
              Got it!
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
