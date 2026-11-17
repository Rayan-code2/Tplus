import React, { useState } from 'react';
import {
  ArrowLeft,
  Crown,
  ShieldCheck,
  Zap,
  Gift,
  TrendingUp,
  ChevronDown,
  ChevronUp,
  Check,
  ArrowRight,
  Wallet,
  Clock,
  Headphones,
  Sparkles,
  Trophy,
  Flame,
} from 'lucide-react';
import { User, SystemSettings } from '../types';
import vipCrownHeroImg from '../assets/images/vip_sovereign_crown_emblem_1794821149503.jpg';
import vipChestImg from '../assets/images/vip_royal_chest_reward_1794821150620.jpg';
import vipShieldImg from '../assets/images/vip_cashback_shield_1794821150738.jpg';
import vipVaultImg from '../assets/images/vip_express_payout_vault_1794821153573.jpg';
import vipWheelImg from '../assets/images/vip_lucky_spin_tickets_1794821154017.jpg';
import heroAviatorImg from '../assets/images/hero_sportx_aviator_1794764892729.jpg';
import heroWingoImg from '../assets/images/hero_sportx_wingo_1794764892920.jpg';
import heroCasinoImg from '../assets/images/hero_sportx_casino_1794764893513.jpg';

interface VipPrivilegeViewProps {
  user: User | null;
  settings: SystemSettings | null;
  onBack: () => void;
  onOpenDeposit: () => void;
  onSelectTab: (tab: string) => void;
}

interface VipTier {
  level: number;
  name: string;
  requiredXpInr: number;
  levelUpBonusInr: number;
  monthlyGiftInr: number;
  dailyCheckinInr: number;
  cashbackPercent: number;
  withdrawalLimitInr: string;
  withdrawalSpeed: string;
  feeDiscount: string;
  badgeColors: {
    primary: string;
    secondary: string;
    glow: string;
    textAccent: string;
    borderAccent: string;
  };
  cardThumb: string;
  perks: string[];
}

const VIP_TIERS: VipTier[] = [
  {
    level: 1,
    name: 'Bronze Striker',
    requiredXpInr: 1000,
    levelUpBonusInr: 50,
    monthlyGiftInr: 200,
    dailyCheckinInr: 5,
    cashbackPercent: 0.5,
    withdrawalLimitInr: '₹25,000 / day',
    withdrawalSpeed: 'Under 30 mins',
    feeDiscount: 'Standard',
    badgeColors: {
      primary: '#d97706',
      secondary: '#78350f',
      glow: 'rgba(217,119,6,0.2)',
      textAccent: 'text-amber-300',
      borderAccent: 'border-amber-500/35',
    },
    cardThumb: vipChestImg,
    perks: [
      'Instant ₹50 Level-Up Reward credited on reaching 1,000 XP',
      '₹200 Monthly VIP Loyalty Gift every month',
      '0.5% Daily Loss Cashback across all live games',
      '1 Extra Lucky Spin Ticket unlocked every week',
    ],
  },
  {
    level: 2,
    name: 'Silver Vanguard',
    requiredXpInr: 5000,
    levelUpBonusInr: 150,
    monthlyGiftInr: 500,
    dailyCheckinInr: 10,
    cashbackPercent: 1.0,
    withdrawalLimitInr: '₹50,000 / day',
    withdrawalSpeed: 'Under 20 mins',
    feeDiscount: '10% Fee Rebate',
    badgeColors: {
      primary: '#94a3b8',
      secondary: '#334155',
      glow: 'rgba(148,163,184,0.22)',
      textAccent: 'text-slate-200',
      borderAccent: 'border-slate-400/35',
    },
    cardThumb: vipShieldImg,
    perks: [
      '₹150 Level-Up Reward + ₹500 Monthly VIP Gift',
      '1.0% Daily Betting Rebate on Win Go, Aviator & Dragon Tiger',
      '10% discount on Winning Wallet withdrawal charges',
      'Priority queue for UPI & Bank IMPS payouts',
    ],
  },
  {
    level: 3,
    name: 'Gold Warlord',
    requiredXpInr: 20000,
    levelUpBonusInr: 500,
    monthlyGiftInr: 1500,
    dailyCheckinInr: 20,
    cashbackPercent: 1.5,
    withdrawalLimitInr: '₹1,00,000 / day',
    withdrawalSpeed: 'Under 15 mins',
    feeDiscount: '20% Fee Rebate',
    badgeColors: {
      primary: '#fbbf24',
      secondary: '#b45309',
      glow: 'rgba(251,191,36,0.25)',
      textAccent: 'text-amber-300',
      borderAccent: 'border-amber-400/40',
    },
    cardThumb: vipVaultImg,
    perks: [
      '₹500 Level-Up Cash + ₹1,500 Monthly VIP Salary',
      '1.5% Instant Daily Rebate on total game turnover',
      '2 Free Weekly Mega Lucky Draw Coupons',
      'Dedicated Telegram / WhatsApp Priority Support',
    ],
  },
  {
    level: 4,
    name: 'Platinum Titan',
    requiredXpInr: 50000,
    levelUpBonusInr: 1500,
    monthlyGiftInr: 4000,
    dailyCheckinInr: 40,
    cashbackPercent: 2.0,
    withdrawalLimitInr: '₹2,50,000 / day',
    withdrawalSpeed: 'Under 10 mins',
    feeDiscount: '30% Fee Rebate',
    badgeColors: {
      primary: '#38bdf8',
      secondary: '#0369a1',
      glow: 'rgba(56,189,248,0.25)',
      textAccent: 'text-cyan-300',
      borderAccent: 'border-cyan-400/40',
    },
    cardThumb: vipWheelImg,
    perks: [
      '₹1,500 Level-Up Reward + ₹4,000 Monthly VIP Gift',
      '2.0% Daily Loss Shield & Cashback Rebate',
      '30% lower withdrawal fee on every winning payout',
      'Early access to High-Roller Tournament pools',
    ],
  },
  {
    level: 5,
    name: 'Diamond Conqueror',
    requiredXpInr: 150000,
    levelUpBonusInr: 4000,
    monthlyGiftInr: 10000,
    dailyCheckinInr: 75,
    cashbackPercent: 2.5,
    withdrawalLimitInr: '₹5,00,000 / day',
    withdrawalSpeed: 'Instant (5 mins)',
    feeDiscount: '40% Fee Rebate',
    badgeColors: {
      primary: '#22d3ee',
      secondary: '#0e7490',
      glow: 'rgba(34,211,238,0.28)',
      textAccent: 'text-cyan-200',
      borderAccent: 'border-cyan-300/45',
    },
    cardThumb: vipChestImg,
    perks: [
      '₹4,000 Level-Up Reward + ₹10,000 Monthly Cash Gift',
      '2.5% Daily Rebate credited directly without rollover',
      'Personal VIP Account Manager 24/7',
      'Birthday & Festival Special Gift Hamper',
    ],
  },
  {
    level: 6,
    name: 'Emerald Monarch',
    requiredXpInr: 500000,
    levelUpBonusInr: 12000,
    monthlyGiftInr: 25000,
    dailyCheckinInr: 150,
    cashbackPercent: 3.5,
    withdrawalLimitInr: '₹10,00,000 / day',
    withdrawalSpeed: 'Instant Express',
    feeDiscount: '50% Fee Rebate',
    badgeColors: {
      primary: '#34d399',
      secondary: '#047857',
      glow: 'rgba(52,211,153,0.28)',
      textAccent: 'text-emerald-300',
      borderAccent: 'border-emerald-400/45',
    },
    cardThumb: vipShieldImg,
    perks: [
      '₹12,000 Level-Up Bonus + ₹25,000 Monthly VIP Salary',
      '3.5% Daily Turnover & Loss Rebate',
      '50% discount on all withdrawal processing fees',
      'Exclusive invites to Private Jackpot Rounds',
    ],
  },
  {
    level: 7,
    name: 'Crown Grandmaster',
    requiredXpInr: 1500000,
    levelUpBonusInr: 35000,
    monthlyGiftInr: 60000,
    dailyCheckinInr: 300,
    cashbackPercent: 4.5,
    withdrawalLimitInr: '₹25,00,000 / day',
    withdrawalSpeed: 'Instant Zero-Wait',
    feeDiscount: '75% Fee Rebate',
    badgeColors: {
      primary: '#f43f5e',
      secondary: '#9f1239',
      glow: 'rgba(244,63,94,0.28)',
      textAccent: 'text-rose-300',
      borderAccent: 'border-rose-400/45',
    },
    cardThumb: vipVaultImg,
    perks: [
      '₹35,000 Level-Up Reward + ₹60,000 Monthly VIP Salary',
      '4.5% Daily Rebate on every single bet placed',
      '75% withdrawal fee waiver + unlimited express requests',
      'Custom high-limit tables on Dragon vs Tiger & Win Go',
    ],
  },
  {
    level: 8,
    name: 'Sovereign Legend',
    requiredXpInr: 5000000,
    levelUpBonusInr: 100000,
    monthlyGiftInr: 150000,
    dailyCheckinInr: 500,
    cashbackPercent: 6.0,
    withdrawalLimitInr: 'Unlimited',
    withdrawalSpeed: 'Instant VIP Desk',
    feeDiscount: '100% Free Withdrawals',
    badgeColors: {
      primary: '#fde047',
      secondary: '#ca8a04',
      glow: 'rgba(253,224,71,0.32)',
      textAccent: 'text-yellow-200',
      borderAccent: 'border-yellow-300/50',
    },
    cardThumb: vipCrownHeroImg,
    perks: [
      '₹1,00,000 Level-Up Cash + ₹1,50,000 Monthly Royalty',
      '6.0% Highest Cashback Rebate across all games',
      '0% Withdrawal Fee — 100% net payout every time',
      'Dedicated 1-on-1 Concierge & VIP Luxury Rewards',
    ],
  },
];

const VIP_PERK_CARDS = [
  {
    id: 'perk-treasury',
    kicker: 'Level-Up · Monthly Salary',
    title: 'Royal Treasury Cash',
    metric: 'Up to ₹1,50,000 / mo',
    desc: 'Har naya VIP rank khulne par instant Level-Up Cash aur har mahine fixed VIP Salary seedha wallet me.',
    image: vipChestImg,
    fallbackIcon: Gift,
    actionLabel: 'Deposit & Unlock',
    actionType: 'deposit' as const,
  },
  {
    id: 'perk-shield',
    kicker: 'Daily Rebate · All Games',
    title: '6% Loss & Bet Shield',
    metric: '0.5% to 6.0% Daily',
    desc: 'Win Go, Aviator, Dragon Tiger aur Slots ke rozana turnover par direct cashback bina kisi hidden शर्त ke.',
    image: vipShieldImg,
    fallbackIcon: TrendingUp,
    actionLabel: 'Play Win Go',
    actionType: 'colorprediction' as const,
  },
  {
    id: 'perk-vault',
    kicker: 'UPI & Bank IMPS · Priority',
    title: 'Express Zero-Fee Payout',
    metric: 'Up to 100% Fee Off',
    desc: 'VIP members ke liye fast-track withdrawal approval, higher daily limit aur 100% tak processing fee discount.',
    image: vipVaultImg,
    fallbackIcon: Clock,
    actionLabel: 'Wallet Center',
    actionType: 'finance' as const,
  },
  {
    id: 'perk-wheel',
    kicker: 'Weekly Spins · Golden Passes',
    title: 'VIP Wheel & Draw Passes',
    metric: 'Free Weekly Tickets',
    desc: 'Extra Wheel of Fortune spins, Mega Lucky Draw golden tickets aur 24/7 personal VIP host support.',
    image: vipWheelImg,
    fallbackIcon: Sparkles,
    actionLabel: 'Open Spin Wheel',
    actionType: 'spinwheel' as const,
  },
];

const QUEST_STEP_CARDS = [
  {
    step: '01. Recharge Wallet',
    title: 'Add INR via UPI / Bank',
    xpRule: '₹1 Deposit = 1 VIP XP',
    desc: 'Wallet recharge karte hi turant 1:1 VIP XP judta hai aur ₹1,000+ par extra Deposit Bonus bhi milta hai.',
    image: vipVaultImg,
    cta: 'Add Funds',
    target: 'deposit',
  },
  {
    step: '02. Play Live Arena',
    title: 'Win Go, Aviator & Casino',
    xpRule: '₹1 Bet Turnover = 1 VIP XP',
    desc: 'Har game round me lagayi gayi bet (win ya loss) aapke VIP XP bar ko tezi se upar badhati hai.',
    image: heroAviatorImg,
    cta: 'Play Aviator',
    target: 'aviator',
  },
  {
    step: '03. Claim Royal Chest',
    title: 'Instant Rank Promotion',
    xpRule: 'Auto Upgrade · 0 Fee',
    desc: 'Target XP pura hote hi naya VIP rank apne aap unlock ho jata hai aur cash perks active ho jaate hain.',
    image: vipChestImg,
    cta: 'Play Win Go',
    target: 'colorprediction',
  },
];

const VIP_FAQS = [
  {
    q: 'VIP banne ke liye sabse aasan tareeka kya hai?',
    a: 'Account me deposit karne aur koi bhi game (Win Go, Aviator, Dragon vs Tiger, Slots, Lucky Draw) khelne par aapka VIP XP apne aap badhta hai. Har ₹1 ke bet turnover par 1 XP aur har ₹1 ke approved deposit par 1 XP milta hai — jaise hi 1,000 XP complete hote hain, aap automatically VIP 1 ban jaate hain.',
  },
  {
    q: 'Kya VIP level unlock karne ke liye alag se fees lagti hai?',
    a: 'Bilkul nahi. VIP membership 100% free hai. Aapke normal deposits aur game khelne ke turnover se hi VIP levels apne aap unlock hote rehte hain.',
  },
  {
    q: 'VIP banne ke baad rewards aur cashback kaise milte hain?',
    a: 'Har level unlock hone par Level-Up Bonus, Monthly Gift, aur Daily Loss Cashback aapke account benefits me active ho jaate hain. Saath hi withdrawal limit aur payout speed bhi upgrade ho jati hai.',
  },
  {
    q: 'Kya ek baar VIP banne ke baad mera level kam ho sakta hai?',
    a: 'Nahi, aapka unlocked VIP tier aur lifetime XP safe rehta hai. Aap jitna zyada khelenge, utna upar ka VIP tier unlock hota jayega.',
  },
];

const TierCrestSvg: React.FC<{ level: number; primary: string; secondary: string }> = ({
  level,
  primary,
  secondary,
}) => (
  <svg viewBox="0 0 56 56" className="w-11 h-11 shrink-0 drop-shadow-[0_4px_10px_rgba(0,0,0,0.6)]">
    <defs>
      <linearGradient id={`crestGrad-${level}`} x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor={primary} />
        <stop offset="100%" stopColor={secondary} />
      </linearGradient>
    </defs>
    <path
      d="M28 4 L49 13 V28 C49 40 39 48 28 52 C17 48 7 40 7 28 V13 Z"
      fill="#071126"
      stroke={`url(#crestGrad-${level})`}
      strokeWidth="2.4"
    />
    <path
      d="M28 8.5 L44.5 15.5 V27.5 C44.5 37 36.5 43.5 28 47 C19.5 43.5 11.5 37 11.5 27.5 V15.5 Z"
      fill={`url(#crestGrad-${level})`}
      opacity="0.18"
    />
    <path
      d="M17 33 L15 21 L22.5 26 L28 17 L33.5 26 L41 21 L39 33 Z"
      fill={`url(#crestGrad-${level})`}
    />
    <rect x="17" y="34.5" width="22" height="3.2" rx="1.2" fill={primary} />
    <text
      x="28"
      y="31"
      textAnchor="middle"
      fill="#050a18"
      fontSize="9"
      fontWeight="900"
      fontFamily="monospace"
    >
      V{level}
    </text>
  </svg>
);

export const VipPrivilegeView: React.FC<VipPrivilegeViewProps> = ({
  user,
  onBack,
  onOpenDeposit,
  onSelectTab,
}) => {
  const [brokenImages, setBrokenImages] = useState<Record<string, boolean>>({});
  const totalTurnoverInr = Math.round(user?.totalBetTurnover || 0);
  const totalDepositedInr = Math.round(user?.totalDeposited || 0);
  const currentXpInr = totalTurnoverInr + totalDepositedInr;

  // Determine user's active VIP level
  const currentTier = [...VIP_TIERS].reverse().find((t) => currentXpInr >= t.requiredXpInr) || null;
  const currentLevel = currentTier ? currentTier.level : 0;
  const nextTier = VIP_TIERS.find((t) => t.level === currentLevel + 1) || VIP_TIERS[VIP_TIERS.length - 1];

  const prevThreshold = currentTier ? currentTier.requiredXpInr : 0;
  const targetThreshold = nextTier.requiredXpInr;
  const progressPercent =
    currentLevel >= VIP_TIERS.length
      ? 100
      : Math.min(100, Math.max(0, ((currentXpInr - prevThreshold) / Math.max(1, targetThreshold - prevThreshold)) * 100));
  const remainingXpInr = Math.max(0, targetThreshold - currentXpInr);

  const [selectedLevel, setSelectedLevel] = useState<number>(currentLevel > 0 ? currentLevel : 1);
  const [openFaqIdx, setOpenFaqIdx] = useState<number | null>(0);

  const activeShowcaseTier = VIP_TIERS.find((t) => t.level === selectedLevel) || VIP_TIERS[0];

  const markImgBroken = (key: string) => {
    setBrokenImages((prev) => ({ ...prev, [key]: true }));
  };

  return (
    <div className="min-h-screen bg-[#050a18] text-slate-100 pb-28 font-sans">
      {/* Compact Sticky Top App Bar */}
      <header className="sticky top-0 z-30 h-14 bg-[#060e22]/95 backdrop-blur-md border-b border-blue-950/70 px-4">
        <div className="max-w-5xl mx-auto h-full flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 min-w-0">
            <button
              type="button"
              onClick={onBack}
              className="min-h-[40px] min-w-[40px] -ml-1.5 flex items-center justify-center rounded-xl text-slate-300 hover:text-white hover:bg-slate-800/60 transition-colors"
              aria-label="Back to Lobby"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-base sm:text-lg font-black tracking-tight text-white truncate">
              SportX VIP Club
            </h1>
          </div>

          <button
            type="button"
            onClick={onOpenDeposit}
            className="min-h-[38px] px-4 py-2 rounded-xl bg-gradient-to-r from-[#2dd4bf] to-[#06b6d4] hover:brightness-105 text-[#042823] font-black text-xs sm:text-sm transition-all whitespace-nowrap shrink-0 flex items-center gap-1.5 shadow-md shadow-teal-500/20"
          >
            <Wallet className="w-4 h-4" />
            <span>Deposit Now</span>
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-3.5 sm:px-6 pt-5 space-y-8">
        {/* 1. GAMING HERO BANNER & LIVE XP HUD */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
          {/* Left 7-Col: Royal Gaming Banner Card with Measured Contrast Scrim */}
          <div className="lg:col-span-7 relative overflow-hidden rounded-2xl border border-amber-400/35 bg-[#08132c] min-h-[250px] flex flex-col justify-between p-5 sm:p-6 shadow-xl">
            {!brokenImages['hero-crown'] ? (
              <img
                src={vipCrownHeroImg}
                alt="SportX Royal VIP Crown Lounge"
                referrerPolicy="no-referrer"
                onError={() => markImgBroken('hero-crown')}
                className="absolute inset-0 w-full h-full object-cover object-center"
              />
            ) : (
              <div className="absolute inset-0 bg-gradient-to-br from-[#1b1638] via-[#0b1530] to-[#050a18]" />
            )}

            {/* Measured Contrast Scrims for WCAG AA legibility */}
            <div className="absolute inset-0 bg-gradient-to-r from-[#050a18]/95 via-[#050a18]/80 to-[#050a18]/35 pointer-events-none" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#050a18]/95 via-[#050a18]/40 to-transparent pointer-events-none" />

            <div className="relative z-10 space-y-3 max-w-lg">
              <div className="flex items-center gap-2 text-xs font-bold text-amber-300 tracking-wide">
                <span>SportX Royal Gaming Pass</span>
                <span aria-hidden="true">·</span>
                <span className="font-mono text-cyan-300 tabular-nums">ID: {user?.nodeId || 'PLAYER'}</span>
              </div>

              <div className="flex items-center gap-3.5">
                <TierCrestSvg
                  level={currentLevel > 0 ? currentLevel : 1}
                  primary={currentTier?.badgeColors.primary || '#fbbf24'}
                  secondary={currentTier?.badgeColors.secondary || '#b45309'}
                />
                <div>
                  <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight text-balance">
                    {currentTier ? `VIP ${currentTier.level} · ${currentTier.name}` : 'VIP 0 · Rookie Challenger'}
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-200/90 mt-0.5">
                    {currentTier
                      ? `${currentTier.cashbackPercent}% daily cashback · ${currentTier.withdrawalSpeed} payouts active`
                      : 'Sirf ₹1,000 deposit ya game turnover se VIP 1 Bronze Striker badge unlock karein.'}
                  </p>
                </div>
              </div>
            </div>

            {/* Live XP Progress Meter */}
            <div className="relative z-10 space-y-2 pt-4 mt-4 border-t border-white/10">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-200 font-bold">
                  Next Rank: VIP {nextTier.level} ({nextTier.name})
                </span>
                <span className="font-mono font-black text-amber-300 tabular-nums">
                  {progressPercent.toFixed(1)}%
                </span>
              </div>

              <div className="w-full h-2.5 bg-[#040814]/90 rounded-full overflow-hidden border border-amber-400/30">
                <div
                  className="h-full bg-gradient-to-r from-amber-400 via-yellow-300 to-[#2dd4bf] transition-all duration-300 rounded-full"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-300 font-mono tabular-nums">
                <span>Current XP: ₹{currentXpInr.toLocaleString('en-IN')}</span>
                {currentLevel < VIP_TIERS.length ? (
                  <span className="text-amber-200">
                    Need ₹{remainingXpInr.toLocaleString('en-IN')} XP for VIP {nextTier.level}
                  </span>
                ) : (
                  <span className="text-emerald-300 font-bold">Max Sovereign Rank Unlocked</span>
                )}
              </div>
            </div>
          </div>

          {/* Right 5-Col: Compact Gaming XP Telemetry & Quick Boost */}
          <div className="lg:col-span-5 bg-[#071533] border border-blue-900/50 rounded-2xl p-5 flex flex-col justify-between space-y-4 shadow-xl">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-[11px] font-bold text-[#2dd4bf] tracking-wide">
                  Player Combat Stats
                </div>
                <h3 className="text-base font-black text-white">Live VIP XP Meter</h3>
              </div>
              <Trophy className="w-5 h-5 text-amber-400 shrink-0" />
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div className="bg-[#050a18] border border-blue-950/80 rounded-xl p-3">
                <div className="text-[11px] text-slate-400">Deposit XP</div>
                <div className="text-sm sm:text-base font-black font-mono text-white tabular-nums mt-0.5">
                  ₹{totalDepositedInr.toLocaleString('en-IN')}
                </div>
              </div>
              <div className="bg-[#050a18] border border-blue-950/80 rounded-xl p-3">
                <div className="text-[11px] text-slate-400">Game Bet XP</div>
                <div className="text-sm sm:text-base font-black font-mono text-cyan-300 tabular-nums mt-0.5">
                  ₹{totalTurnoverInr.toLocaleString('en-IN')}
                </div>
              </div>
              <div className="bg-[#050a18] border border-blue-950/80 rounded-xl p-3">
                <div className="text-[11px] text-slate-400">Daily Cashback</div>
                <div className="text-sm sm:text-base font-black font-mono text-emerald-400 tabular-nums mt-0.5">
                  {currentTier ? `${currentTier.cashbackPercent}%` : '0.5% at VIP1'}
                </div>
              </div>
              <div className="bg-[#050a18] border border-blue-950/80 rounded-xl p-3">
                <div className="text-[11px] text-slate-400">Monthly Salary</div>
                <div className="text-sm sm:text-base font-black font-mono text-amber-300 tabular-nums mt-0.5">
                  ₹{(currentTier?.monthlyGiftInr || 200).toLocaleString('en-IN')}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2.5 pt-1">
              <button
                type="button"
                onClick={onOpenDeposit}
                className="min-h-[42px] px-3 py-2 rounded-xl bg-gradient-to-r from-[#2dd4bf] to-[#06b6d4] hover:brightness-105 text-[#042823] font-black text-xs transition-all flex items-center justify-center gap-1.5 shadow-md"
              >
                <span>Boost Deposit XP</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => onSelectTab('dashboard')}
                className="min-h-[42px] px-3 py-2 rounded-xl bg-[#0b1b42] hover:bg-[#10265c] border border-blue-800/50 text-white font-bold text-xs transition-colors whitespace-nowrap"
              >
                Play Arena Games
              </button>
            </div>
          </div>
        </section>

        {/* 2. COMPACT GAMING PRIVILEGE IMAGE CARDS (4 SMALL VISUAL CARDS) */}
        <section className="space-y-3.5">
          <div className="flex items-end justify-between gap-2">
            <div>
              <div className="text-xs font-bold text-[#2dd4bf] tracking-wide">
                Royal Gaming Perks
              </div>
              <h2 className="text-lg sm:text-xl font-black text-white tracking-tight">
                VIP Banne Par Kya-Kya Milega?
              </h2>
            </div>
            <span className="text-xs text-slate-400 hidden sm:inline">
              Tap any card to jump in
            </span>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {VIP_PERK_CARDS.map((card) => {
              const FallbackIcon = card.fallbackIcon;
              const isBroken = Boolean(brokenImages[card.id]);
              return (
                <div
                  key={card.id}
                  onClick={() => {
                    if (card.actionType === 'deposit') {
                      onOpenDeposit();
                    } else {
                      onSelectTab(card.actionType);
                    }
                  }}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      if (card.actionType === 'deposit') onOpenDeposit();
                      else onSelectTab(card.actionType);
                    }
                  }}
                  className="group cursor-pointer bg-[#071533] hover:bg-[#0a1d45] border border-blue-900/50 hover:border-cyan-400/50 rounded-2xl overflow-hidden flex flex-col justify-between transition-all duration-200 active:scale-[0.98] shadow-lg"
                >
                  <div>
                    {/* 4:3 Gaming Artwork Header */}
                    <div className="relative aspect-[4/3] w-full overflow-hidden bg-[#050a18]">
                      {!isBroken ? (
                        <img
                          src={card.image}
                          alt={card.title}
                          referrerPolicy="no-referrer"
                          onError={() => markImgBroken(card.id)}
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-[#0e224d] to-[#050a18] flex items-center justify-center">
                          <FallbackIcon className="w-10 h-10 text-amber-400/70" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-[#071533] via-[#071533]/25 to-transparent" />
                      <div className="absolute bottom-2 left-2.5 right-2.5 flex items-center justify-between gap-1">
                        <span className="text-[11px] font-mono font-black text-amber-300 tabular-nums drop-shadow">
                          {card.metric}
                        </span>
                      </div>
                    </div>

                    {/* Compact Card Body */}
                    <div className="p-3 space-y-1">
                      <div className="text-[10px] font-semibold text-cyan-300/90 truncate">
                        {card.kicker}
                      </div>
                      <h3 className="text-xs sm:text-sm font-black text-white leading-snug">
                        {card.title}
                      </h3>
                      <p className="text-[11px] text-slate-300/90 leading-relaxed line-clamp-3">
                        {card.desc}
                      </p>
                    </div>
                  </div>

                  <div className="px-3 pb-3 pt-1">
                    <span className="inline-flex items-center gap-1 text-[11px] font-extrabold text-[#2dd4bf] group-hover:text-cyan-300">
                      <span>{card.actionLabel}</span>
                      <ArrowRight className="w-3 h-3 transition-transform duration-150 group-hover:translate-x-0.5" />
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* 3. COMPACT VIP RANK CARDS GRID (ALL 8 GAMING RANKS) */}
        <section className="space-y-3.5">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-1">
            <div>
              <div className="text-xs font-bold text-amber-300 tracking-wide">
                8 Gaming Rank Badges
              </div>
              <h2 className="text-lg sm:text-xl font-black text-white tracking-tight">
                Select VIP Card to Inspect Perks
              </h2>
            </div>
            <span className="text-xs text-slate-400 font-mono tabular-nums">
              Active Preview: VIP {activeShowcaseTier.level} · {activeShowcaseTier.name}
            </span>
          </div>

          {/* 8 Compact Gaming Cards (2 cols on mobile, 4 cols on desktop) */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
            {VIP_TIERS.map((tier) => {
              const isSelected = selectedLevel === tier.level;
              const isUnlocked = currentLevel >= tier.level;
              const thumbKey = `tier-thumb-${tier.level}`;

              return (
                <button
                  key={tier.level}
                  type="button"
                  onClick={() => setSelectedLevel(tier.level)}
                  className={`group relative overflow-hidden rounded-2xl p-3 text-left transition-all duration-200 active:scale-[0.98] border ${
                    isSelected
                      ? 'bg-gradient-to-b from-[#0e2452] to-[#071533] border-[#2dd4bf] shadow-[0_0_20px_rgba(45,212,191,0.22)]'
                      : isUnlocked
                      ? 'bg-[#071a2f] border-emerald-500/40 hover:border-emerald-400'
                      : 'bg-[#071533] border-blue-900/45 hover:border-cyan-500/40'
                  }`}
                >
                  {/* Subtle background artwork slice */}
                  {!brokenImages[thumbKey] && (
                    <img
                      src={tier.cardThumb}
                      alt=""
                      aria-hidden="true"
                      referrerPolicy="no-referrer"
                      onError={() => markImgBroken(thumbKey)}
                      className="pointer-events-none absolute right-0 top-0 w-20 h-20 object-cover opacity-15 rounded-bl-3xl transition-opacity group-hover:opacity-25"
                    />
                  )}

                  <div className="relative z-10 flex items-center justify-between gap-2">
                    <TierCrestSvg
                      level={tier.level}
                      primary={tier.badgeColors.primary}
                      secondary={tier.badgeColors.secondary}
                    />
                    <div className="text-right">
                      <div className={`text-[10px] font-bold ${tier.badgeColors.textAccent}`}>
                        {isUnlocked ? 'Unlocked' : `VIP ${tier.level}`}
                      </div>
                      <div className="text-xs font-mono font-black text-emerald-400 tabular-nums">
                        {tier.cashbackPercent}% Back
                      </div>
                    </div>
                  </div>

                  <div className="relative z-10 mt-2.5 space-y-0.5">
                    <div className="text-xs sm:text-sm font-black text-white truncate">
                      {tier.name}
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono tabular-nums truncate">
                      XP Req: ₹{tier.requiredXpInr.toLocaleString('en-IN')}
                    </div>
                  </div>

                  <div className="relative z-10 mt-2.5 pt-2 border-t border-blue-950/80 flex items-center justify-between text-[10px] font-mono tabular-nums">
                    <span className="text-amber-300 font-bold">
                      +₹{tier.levelUpBonusInr.toLocaleString('en-IN')}
                    </span>
                    <span className="text-cyan-300 font-semibold">
                      ₹{tier.monthlyGiftInr.toLocaleString('en-IN')}/mo
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Selected Tier Detailed Gaming Chest Showcase */}
          <div className="bg-[#071533] border border-blue-900/60 rounded-2xl p-4 sm:p-6 space-y-5 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-blue-950/80 pb-4">
              <div className="flex items-center gap-3.5">
                <TierCrestSvg
                  level={activeShowcaseTier.level}
                  primary={activeShowcaseTier.badgeColors.primary}
                  secondary={activeShowcaseTier.badgeColors.secondary}
                />
                <div>
                  <div className="text-xs font-semibold text-[#2dd4bf]">
                    VIP {activeShowcaseTier.level} Rank Chest ·{' '}
                    {currentLevel >= activeShowcaseTier.level
                      ? 'Active on Your Account'
                      : `Requires ₹${activeShowcaseTier.requiredXpInr.toLocaleString('en-IN')} Total XP`}
                  </div>
                  <h3 className="text-lg sm:text-2xl font-black text-white">
                    VIP {activeShowcaseTier.level} — {activeShowcaseTier.name}
                  </h3>
                </div>
              </div>

              <button
                type="button"
                onClick={onOpenDeposit}
                className="min-h-[42px] px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#2dd4bf] to-[#06b6d4] hover:brightness-105 text-[#042823] font-black text-xs sm:text-sm transition-all whitespace-nowrap shrink-0 shadow-md"
              >
                {currentLevel >= activeShowcaseTier.level
                  ? 'Active — Deposit & Play'
                  : `Unlock VIP ${activeShowcaseTier.level} Now`}
              </button>
            </div>

            {/* 4 Key Telemetry Boxes */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="bg-[#050a18] border border-blue-950/80 rounded-xl p-3 space-y-0.5">
                <div className="text-[11px] text-slate-400">Level-Up Cash</div>
                <div className="text-base sm:text-lg font-black font-mono text-amber-300 tabular-nums">
                  ₹{activeShowcaseTier.levelUpBonusInr.toLocaleString('en-IN')}
                </div>
              </div>
              <div className="bg-[#050a18] border border-blue-950/80 rounded-xl p-3 space-y-0.5">
                <div className="text-[11px] text-slate-400">Monthly VIP Salary</div>
                <div className="text-base sm:text-lg font-black font-mono text-white tabular-nums">
                  ₹{activeShowcaseTier.monthlyGiftInr.toLocaleString('en-IN')}
                </div>
              </div>
              <div className="bg-[#050a18] border border-blue-950/80 rounded-xl p-3 space-y-0.5">
                <div className="text-[11px] text-slate-400">Daily Bet Cashback</div>
                <div className="text-base sm:text-lg font-black font-mono text-emerald-400 tabular-nums">
                  {activeShowcaseTier.cashbackPercent}%
                </div>
              </div>
              <div className="bg-[#050a18] border border-blue-950/80 rounded-xl p-3 space-y-0.5">
                <div className="text-[11px] text-slate-400">Withdrawal Fee Relief</div>
                <div className="text-base sm:text-lg font-black text-cyan-300">
                  {activeShowcaseTier.feeDiscount}
                </div>
              </div>
            </div>

            {/* Included Perks Checklist */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 pt-1">
              {activeShowcaseTier.perks.map((perk, idx) => (
                <div
                  key={idx}
                  className="bg-[#050a18]/70 border border-blue-950/60 rounded-xl px-3.5 py-2.5 flex items-start gap-2.5 text-xs sm:text-sm text-slate-200"
                >
                  <Check className="w-4 h-4 text-[#2dd4bf] shrink-0 mt-0.5" />
                  <span>{perk}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 4. HOW TO BECOME VIP — 3 COMPACT QUEST CARDS WITH IMAGES */}
        <section className="space-y-3.5">
          <div>
            <div className="text-xs font-bold text-[#2dd4bf] tracking-wide">
              Fastest Rank Progression
            </div>
            <h2 className="text-lg sm:text-xl font-black text-white tracking-tight">
              VIP Kaise Banein? (3 Gaming Quests)
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
            {QUEST_STEP_CARDS.map((quest) => {
              const isBroken = Boolean(brokenImages[quest.step]);
              return (
                <div
                  key={quest.step}
                  className="bg-[#071533] border border-blue-900/50 rounded-2xl overflow-hidden flex flex-col justify-between shadow-lg"
                >
                  <div>
                    <div className="relative h-32 w-full overflow-hidden bg-[#050a18]">
                      {!isBroken ? (
                        <img
                          src={quest.image}
                          alt={quest.title}
                          referrerPolicy="no-referrer"
                          onError={() => markImgBroken(quest.step)}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-r from-[#0e224d] to-[#050a18] flex items-center justify-center">
                          <Flame className="w-8 h-8 text-cyan-400/60" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-[#071533] via-[#071533]/40 to-transparent" />
                      <div className="absolute bottom-2 left-3 right-3 flex items-center justify-between text-[11px]">
                        <span className="font-bold text-amber-300">{quest.step}</span>
                        <span className="font-mono font-bold text-cyan-300 tabular-nums">
                          {quest.xpRule}
                        </span>
                      </div>
                    </div>

                    <div className="p-3.5 space-y-1">
                      <h3 className="text-sm font-black text-white">{quest.title}</h3>
                      <p className="text-xs text-slate-300/90 leading-relaxed">{quest.desc}</p>
                    </div>
                  </div>

                  <div className="px-3.5 pb-3.5">
                    <button
                      type="button"
                      onClick={() => {
                        if (quest.target === 'deposit') onOpenDeposit();
                        else onSelectTab(quest.target);
                      }}
                      className="w-full py-2 rounded-xl bg-[#0b1b42] hover:bg-[#122b66] border border-blue-800/50 text-xs font-bold text-[#2dd4bf] transition-colors flex items-center justify-center gap-1.5"
                    >
                      <span>{quest.cta}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* 5. LIVE ARENA XP MULTIPLIER MINI CARDS (QUICK GAME JUMP) */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base sm:text-lg font-black text-white tracking-tight">
              Play Top Games to Farm VIP XP
            </h2>
            <span className="text-xs text-cyan-300 font-mono">100% Bet Counts Toward VIP</span>
          </div>

          <div className="grid grid-cols-3 gap-2.5 sm:gap-3">
            {[
              {
                id: 'xp-wingo',
                name: 'Color Win Go',
                sub: 'Every 60s · 9x Payout',
                img: heroWingoImg,
                tab: 'colorprediction',
              },
              {
                id: 'xp-aviator',
                name: 'Aviator Crash',
                sub: 'Up to 100x Multiplier',
                img: heroAviatorImg,
                tab: 'aviator',
              },
              {
                id: 'xp-casino',
                name: 'Dragon vs Tiger',
                sub: 'Fast 25s Card Duel',
                img: heroCasinoImg,
                tab: 'dragontiger',
              },
            ].map((g) => (
              <button
                key={g.id}
                type="button"
                onClick={() => onSelectTab(g.tab)}
                className="group relative overflow-hidden rounded-2xl aspect-[16/10] bg-[#071533] border border-blue-900/50 hover:border-[#2dd4bf] text-left p-2.5 sm:p-3 flex flex-col justify-end transition-all active:scale-95"
              >
                {!brokenImages[g.id] && (
                  <img
                    src={g.img}
                    alt={g.name}
                    referrerPolicy="no-referrer"
                    onError={() => markImgBroken(g.id)}
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-[#050a18]/95 via-[#050a18]/50 to-transparent" />
                <div className="relative z-10">
                  <div className="text-xs sm:text-sm font-black text-white leading-tight truncate">
                    {g.name}
                  </div>
                  <div className="text-[10px] text-cyan-300 font-medium truncate">{g.sub}</div>
                </div>
              </button>
            ))}
          </div>
        </section>

        {/* 6. FULL COMPARISON TABLE (ALL 8 LEVELS) */}
        <section className="space-y-3">
          <div>
            <h2 className="text-lg sm:text-xl font-black text-white tracking-tight">
              Complete VIP Privilege Matrix
            </h2>
            <p className="text-xs sm:text-sm text-slate-400">
              VIP 1 se VIP 8 tak sabhi levels ke target XP aur rewards ek nazar me.
            </p>
          </div>

          <div className="bg-[#071533] border border-blue-900/50 rounded-2xl overflow-hidden shadow-lg">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="bg-[#060e22] text-slate-400 border-b border-blue-950/80">
                  <tr>
                    <th className="py-3 px-4 font-bold">VIP Rank</th>
                    <th className="py-3 px-4 font-bold">Required XP</th>
                    <th className="py-3 px-4 font-bold">Level-Up</th>
                    <th className="py-3 px-4 font-bold">Monthly Salary</th>
                    <th className="py-3 px-4 font-bold">Daily Rebate</th>
                    <th className="py-3 px-4 font-bold">Payout Speed</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-blue-950/60 font-mono tabular-nums">
                  {VIP_TIERS.map((tier) => {
                    const isMine = currentLevel === tier.level;
                    return (
                      <tr
                        key={tier.level}
                        onClick={() => setSelectedLevel(tier.level)}
                        className={`cursor-pointer transition-colors ${
                          isMine
                            ? 'bg-[#2dd4bf]/10 text-white'
                            : 'hover:bg-blue-950/40 text-slate-300'
                        }`}
                      >
                        <td className="py-3 px-4 font-sans font-bold text-white whitespace-nowrap">
                          VIP {tier.level} · {tier.name} {isMine ? '(Current)' : ''}
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          ₹{tier.requiredXpInr.toLocaleString('en-IN')}
                        </td>
                        <td className="py-3 px-4 text-amber-300 font-bold whitespace-nowrap">
                          ₹{tier.levelUpBonusInr.toLocaleString('en-IN')}
                        </td>
                        <td className="py-3 px-4 text-cyan-300 whitespace-nowrap">
                          ₹{tier.monthlyGiftInr.toLocaleString('en-IN')}
                        </td>
                        <td className="py-3 px-4 text-emerald-400 font-bold whitespace-nowrap">
                          {tier.cashbackPercent}%
                        </td>
                        <td className="py-3 px-4 font-sans text-slate-300 whitespace-nowrap">
                          {tier.withdrawalSpeed}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* 7. VIP FAQ ACCORDION */}
        <section className="space-y-3">
          <h2 className="text-lg sm:text-xl font-black text-white tracking-tight">
            VIP Rules &amp; Common Questions
          </h2>

          <div className="bg-[#071533] border border-blue-900/50 rounded-2xl divide-y divide-blue-950/70">
            {VIP_FAQS.map((item, idx) => {
              const isOpen = openFaqIdx === idx;
              return (
                <div key={idx}>
                  <button
                    type="button"
                    onClick={() => setOpenFaqIdx(isOpen ? null : idx)}
                    className="w-full min-h-[52px] px-4 sm:px-5 py-3.5 flex items-center justify-between gap-4 text-left hover:bg-blue-950/30 transition-colors"
                  >
                    <span className="text-xs sm:text-sm font-bold text-white">{item.q}</span>
                    {isOpen ? (
                      <ChevronUp className="w-4 h-4 text-[#2dd4bf] shrink-0" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
                    )}
                  </button>
                  {isOpen && (
                    <div className="px-4 sm:px-5 pb-4 text-xs sm:text-sm text-slate-300 leading-relaxed">
                      {item.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* 8. BOTTOM ACTION CTA */}
        <section className="bg-gradient-to-r from-[#071b3d] via-[#071533] to-[#050a18] border border-[#2dd4bf]/35 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xl">
          <div className="space-y-1">
            <h3 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-[#2dd4bf]" />
              <span>Apna VIP Upgrade Aaj Hi Start Karein</span>
            </h3>
            <p className="text-xs text-slate-300">
              Pehla deposit karein ya live games khelkar 6% तक daily cashback aur ₹1.5L monthly VIP salary unlock karein.
            </p>
          </div>
          <div className="flex items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={() => onSelectTab('agency')}
              className="min-h-[42px] px-4 py-2 rounded-xl bg-[#0b1b42] hover:bg-[#122b66] border border-blue-800/60 text-slate-100 font-bold text-xs transition-colors whitespace-nowrap"
            >
              5-Level Agency
            </button>
            <button
              type="button"
              onClick={onOpenDeposit}
              className="min-h-[42px] px-5 py-2 rounded-xl bg-gradient-to-r from-[#2dd4bf] to-[#06b6d4] hover:brightness-105 text-[#042823] font-black text-xs sm:text-sm transition-all whitespace-nowrap flex items-center gap-1.5 shadow-md"
            >
              <Sparkles className="w-4 h-4" />
              <span>Deposit &amp; Upgrade</span>
            </button>
          </div>
        </section>
      </main>
    </div>
  );
};
