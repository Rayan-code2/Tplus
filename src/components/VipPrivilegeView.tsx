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
} from 'lucide-react';
import { User, SystemSettings } from '../types';

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
  perks: string[];
}

const VIP_TIERS: VipTier[] = [
  {
    level: 1,
    name: 'Bronze Club',
    requiredXpInr: 1000,
    levelUpBonusInr: 50,
    monthlyGiftInr: 200,
    dailyCheckinInr: 5,
    cashbackPercent: 0.5,
    withdrawalLimitInr: '₹25,000 / day',
    withdrawalSpeed: 'Under 30 mins',
    feeDiscount: 'Standard',
    perks: [
      'Instant ₹50 Level-Up Reward credited on reaching 1,000 XP',
      '₹200 Monthly VIP Loyalty Gift every month',
      '0.5% Daily Loss Cashback across all live games',
      '1 Extra Lucky Spin Ticket unlocked every week',
    ],
  },
  {
    level: 2,
    name: 'Silver Club',
    requiredXpInr: 5000,
    levelUpBonusInr: 150,
    monthlyGiftInr: 500,
    dailyCheckinInr: 10,
    cashbackPercent: 1.0,
    withdrawalLimitInr: '₹50,000 / day',
    withdrawalSpeed: 'Under 20 mins',
    feeDiscount: '10% Fee Rebate',
    perks: [
      '₹150 Level-Up Reward + ₹500 Monthly VIP Gift',
      '1.0% Daily Betting Rebate on Win Go, Aviator & Dragon Tiger',
      '10% discount on Winning Wallet withdrawal charges',
      'Priority queue for UPI & Bank IMPS payouts',
    ],
  },
  {
    level: 3,
    name: 'Gold Club',
    requiredXpInr: 20000,
    levelUpBonusInr: 500,
    monthlyGiftInr: 1500,
    dailyCheckinInr: 20,
    cashbackPercent: 1.5,
    withdrawalLimitInr: '₹1,00,000 / day',
    withdrawalSpeed: 'Under 15 mins',
    feeDiscount: '20% Fee Rebate',
    perks: [
      '₹500 Level-Up Cash + ₹1,500 Monthly VIP Salary',
      '1.5% Instant Daily Rebate on total game turnover',
      '2 Free Weekly Mega Lucky Draw Coupons',
      'Dedicated Telegram / WhatsApp Priority Support',
    ],
  },
  {
    level: 4,
    name: 'Platinum Club',
    requiredXpInr: 50000,
    levelUpBonusInr: 1500,
    monthlyGiftInr: 4000,
    dailyCheckinInr: 40,
    cashbackPercent: 2.0,
    withdrawalLimitInr: '₹2,50,000 / day',
    withdrawalSpeed: 'Under 10 mins',
    feeDiscount: '30% Fee Rebate',
    perks: [
      '₹1,500 Level-Up Reward + ₹4,000 Monthly VIP Gift',
      '2.0% Daily Loss Shield & Cashback Rebate',
      '30% lower withdrawal fee on every winning payout',
      'Early access to High-Roller Tournament pools',
    ],
  },
  {
    level: 5,
    name: 'Diamond Club',
    requiredXpInr: 150000,
    levelUpBonusInr: 4000,
    monthlyGiftInr: 10000,
    dailyCheckinInr: 75,
    cashbackPercent: 2.5,
    withdrawalLimitInr: '₹5,00,000 / day',
    withdrawalSpeed: 'Instant (5 mins)',
    feeDiscount: '40% Fee Rebate',
    perks: [
      '₹4,000 Level-Up Reward + ₹10,000 Monthly Cash Gift',
      '2.5% Daily Rebate credited directly without rollover',
      'Personal VIP Account Manager 24/7',
      'Birthday & Festival Special Gift Hamper',
    ],
  },
  {
    level: 6,
    name: 'Royal Emerald',
    requiredXpInr: 500000,
    levelUpBonusInr: 12000,
    monthlyGiftInr: 25000,
    dailyCheckinInr: 150,
    cashbackPercent: 3.5,
    withdrawalLimitInr: '₹10,00,000 / day',
    withdrawalSpeed: 'Instant Express',
    feeDiscount: '50% Fee Rebate',
    perks: [
      '₹12,000 Level-Up Bonus + ₹25,000 Monthly VIP Salary',
      '3.5% Daily Turnover & Loss Rebate',
      '50% discount on all withdrawal processing fees',
      'Exclusive invites to Private Jackpot Rounds',
    ],
  },
  {
    level: 7,
    name: 'Crown Elite',
    requiredXpInr: 1500000,
    levelUpBonusInr: 35000,
    monthlyGiftInr: 60000,
    dailyCheckinInr: 300,
    cashbackPercent: 4.5,
    withdrawalLimitInr: '₹25,00,000 / day',
    withdrawalSpeed: 'Instant Zero-Wait',
    feeDiscount: '75% Fee Rebate',
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
    perks: [
      '₹1,00,000 Level-Up Cash + ₹1,50,000 Monthly Royalty',
      '6.0% Highest Cashback Rebate across all games',
      '0% Withdrawal Fee — 100% net payout every time',
      'Dedicated 1-on-1 Concierge & VIP Luxury Rewards',
    ],
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

export const VipPrivilegeView: React.FC<VipPrivilegeViewProps> = ({
  user,
  settings,
  onBack,
  onOpenDeposit,
  onSelectTab,
}) => {
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

  return (
    <div className="min-h-screen bg-[#060b16] text-slate-100 pb-24">
      {/* Compact Sticky Top App Bar */}
      <header className="sticky top-0 z-30 h-14 bg-[#080f1f]/95 backdrop-blur-md border-b border-slate-800/80 px-4">
        <div className="max-w-5xl mx-auto h-full flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 min-w-0">
            <button
              type="button"
              onClick={onBack}
              className="min-h-[44px] min-w-[44px] -ml-2 flex items-center justify-center rounded-xl text-slate-300 hover:text-white hover:bg-slate-800/60 transition-colors"
              aria-label="Back to Lobby"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-base sm:text-lg font-bold tracking-tight text-white truncate">
              SportX VIP Privileges
            </h1>
          </div>

          <button
            type="button"
            onClick={onOpenDeposit}
            className="min-h-[40px] px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs sm:text-sm transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5"
          >
            <Wallet className="w-4 h-4" />
            <span>Deposit Now</span>
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 pt-6 space-y-10">
        {/* 1. HERO VIP STATUS & LIVE XP PROGRESS */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          <div className="lg:col-span-7 bg-[#0b1426] border border-amber-500/25 rounded-2xl p-6 flex flex-col justify-between space-y-6">
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-4">
                <span className="text-xs font-semibold text-amber-400 tracking-wide">
                  Active Membership Tier
                </span>
                <span className="text-xs text-slate-400 font-mono tabular-nums">
                  ID: {user?.nodeId || 'GUEST'}
                </span>
              </div>

              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/15 border border-amber-400/30 flex items-center justify-center text-amber-400 shrink-0">
                  <Crown className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight text-balance">
                    {currentTier ? `VIP ${currentTier.level} · ${currentTier.name}` : 'VIP 0 · Standard Member'}
                  </h2>
                  <p className="text-sm text-slate-400 mt-0.5">
                    {currentTier
                      ? `${currentTier.cashbackPercent}% daily cashback aur ${currentTier.withdrawalSpeed} payouts active hain.`
                      : 'Sirf ₹1,000 deposit ya bet turnover se apna pehla VIP 1 badge unlock karein.'}
                  </p>
                </div>
              </div>
            </div>

            {/* Live XP Progress Bar */}
            <div className="space-y-2.5 pt-2 border-t border-slate-800/80">
              <div className="flex items-center justify-between text-xs sm:text-sm">
                <span className="text-slate-300 font-medium">
                  Progress to VIP {nextTier.level} ({nextTier.name})
                </span>
                <span className="font-mono font-bold text-amber-400 tabular-nums">
                  {progressPercent.toFixed(1)}%
                </span>
              </div>

              <div className="w-full h-3 bg-[#050912] rounded-full overflow-hidden border border-slate-800">
                <div
                  className="h-full bg-gradient-to-r from-amber-500 to-yellow-300 transition-all duration-300 rounded-full"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400 font-mono tabular-nums">
                <span>Your XP: ₹{currentXpInr.toLocaleString('en-IN')}</span>
                {currentLevel < VIP_TIERS.length ? (
                  <span>Need ₹{remainingXpInr.toLocaleString('en-IN')} more for VIP {nextTier.level}</span>
                ) : (
                  <span className="text-emerald-400 font-semibold">Maximum VIP Rank Unlocked</span>
                )}
              </div>
            </div>
          </div>

          {/* Right Summary Panel: Current Account XP Breakdown */}
          <div className="lg:col-span-5 bg-[#0b1426] border border-slate-800/90 rounded-2xl p-6 flex flex-col justify-between space-y-5">
            <div className="space-y-1">
              <h3 className="text-base font-bold text-white">Aapka Live VIP Score</h3>
              <p className="text-xs text-slate-400">
                Deposit aur game betting dono milkar aapka VIP level badhate hain.
              </p>
            </div>

            <div className="divide-y divide-slate-800/80 text-sm">
              <div className="py-3 flex items-center justify-between">
                <span className="text-slate-400">Total Deposits XP</span>
                <span className="font-mono font-bold text-white tabular-nums">
                  ₹{totalDepositedInr.toLocaleString('en-IN')}
                </span>
              </div>
              <div className="py-3 flex items-center justify-between">
                <span className="text-slate-400">Total Game Bets XP</span>
                <span className="font-mono font-bold text-white tabular-nums">
                  ₹{totalTurnoverInr.toLocaleString('en-IN')}
                </span>
              </div>
              <div className="py-3 flex items-center justify-between">
                <span className="text-slate-400">Active Daily Rebate</span>
                <span className="font-mono font-bold text-emerald-400 tabular-nums">
                  {currentTier ? `${currentTier.cashbackPercent}%` : '0%'}
                </span>
              </div>
              <div className="py-3 flex items-center justify-between">
                <span className="text-slate-400">Monthly VIP Gift</span>
                <span className="font-mono font-bold text-amber-400 tabular-nums">
                  ₹{(currentTier?.monthlyGiftInr || 0).toLocaleString('en-IN')}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-1">
              <button
                type="button"
                onClick={onOpenDeposit}
                className="flex-1 min-h-[44px] px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs sm:text-sm transition-colors flex items-center justify-center gap-1.5"
              >
                <span>Boost XP via Deposit</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => onSelectTab('dashboard')}
                className="min-h-[44px] px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-100 font-semibold text-xs sm:text-sm transition-colors whitespace-nowrap"
              >
                Play Games
              </button>
            </div>
          </div>
        </section>

        {/* 2. HOW TO BECOME A VIP (3-STEP GUIDE) */}
        <section className="space-y-4">
          <div className="space-y-1">
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              VIP Kaise Bante Hain? (3 Simple Steps)
            </h2>
            <p className="text-sm text-slate-400">
              Koi form bharne ya alag package kharidne ki zaroorat nahi — har deposit aur bet aapko VIP ke kareeb lata hai.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-[#0b1426] border border-slate-800/90 rounded-2xl p-5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-amber-400">01. DEPOSIT FUNDS</span>
                <Wallet className="w-5 h-5 text-amber-400" />
              </div>
              <h3 className="text-base font-bold text-white">Wallet Recharge Karein</h3>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                UPI ya Bank Transfer se deposit karne par har <strong className="text-slate-200">₹1 = 1 VIP XP</strong> turant add hota hai. ₹1,000+ deposit par aapko extra Deposit Bonus bhi milta hai.
              </p>
            </div>

            <div className="bg-[#0b1426] border border-slate-800/90 rounded-2xl p-5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-emerald-400">02. PLAY GAMES</span>
                <Zap className="w-5 h-5 text-emerald-400" />
              </div>
              <h3 className="text-base font-bold text-white">Win Go, Aviator ya Slots Khelein</h3>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                Har game round me jitni bet lagti hai (chahe jeetein ya haarein), utna <strong className="text-slate-200">Turnover XP</strong> aapke VIP meter me judta rehta hai.
              </p>
            </div>

            <div className="bg-[#0b1426] border border-slate-800/90 rounded-2xl p-5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-cyan-400">03. UNLOCK PERKS</span>
                <Crown className="w-5 h-5 text-cyan-400" />
              </div>
              <h3 className="text-base font-bold text-white">Automatic VIP Upgrade</h3>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                Target XP cross karte hi aapka naya VIP tier unlock ho jata hai — <strong className="text-slate-200">Level-Up Cash, Monthly Gift, aur Fast Withdrawals</strong> shuru ho jaate hain.
              </p>
            </div>
          </div>
        </section>

        {/* 3. CORE VIP PRIVILEGES OVERVIEW */}
        <section className="space-y-4">
          <div className="space-y-1">
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              VIP Banne Par Kya-Kya Benefits Milte Hain?
            </h2>
            <p className="text-sm text-slate-400">
              Regular users ke muqable VIP members ko har mahine zyada cash rewards aur priority service milti hai.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-[#0b1426] border border-slate-800/90 rounded-2xl p-5 space-y-2.5">
              <Gift className="w-5 h-5 text-amber-400" />
              <h3 className="text-sm font-bold text-white">Level-Up &amp; Monthly Cash</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Har naya level unlock hone par ₹50 se ₹1,00,000 tak one-time cash reward aur har mahine fixed VIP salary.
              </p>
            </div>

            <div className="bg-[#0b1426] border border-slate-800/90 rounded-2xl p-5 space-y-2.5">
              <TrendingUp className="w-5 h-5 text-emerald-400" />
              <h3 className="text-sm font-bold text-white">Up to 6% Daily Cashback</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Rozana ke game turnover aur loss par 0.5% se lekar 6.0% tak direct cashback wapas wallet me.
              </p>
            </div>

            <div className="bg-[#0b1426] border border-slate-800/90 rounded-2xl p-5 space-y-2.5">
              <Clock className="w-5 h-5 text-cyan-400" />
              <h3 className="text-sm font-bold text-white">Express Withdrawals</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Higher daily withdrawal limits aur zero-wait payout approval, saath me 100% tak withdrawal fee discount.
              </p>
            </div>

            <div className="bg-[#0b1426] border border-slate-800/90 rounded-2xl p-5 space-y-2.5">
              <Headphones className="w-5 h-5 text-slate-200" />
              <h3 className="text-sm font-bold text-white">24/7 VIP Host &amp; Spins</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Extra Lucky Wheel spins, free Mega Draw tickets, aur dedicated priority support desk.
              </p>
            </div>
          </div>
        </section>

        {/* 4. INTERACTIVE VIP TIER EXPLORER (VIP 1 TO VIP 8) */}
        <section className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                Har VIP Level Ke Exact Rewards Dekhein
              </h2>
              <p className="text-sm text-slate-400">
                Kisi bhi level par tap karke uski requirement aur benefits check karein.
              </p>
            </div>
            <span className="text-xs text-slate-400 font-mono tabular-nums">
              Selected: VIP {activeShowcaseTier.level} · {activeShowcaseTier.name}
            </span>
          </div>

          {/* Interactive Level Selector Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            {VIP_TIERS.map((tier) => {
              const isSelected = selectedLevel === tier.level;
              const isUnlocked = currentLevel >= tier.level;
              return (
                <button
                  key={tier.level}
                  type="button"
                  onClick={() => setSelectedLevel(tier.level)}
                  className={`min-h-[44px] px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 border ${
                    isSelected
                      ? 'bg-amber-500 text-slate-950 border-amber-400'
                      : isUnlocked
                      ? 'bg-[#0b1c1a] text-emerald-300 border-emerald-500/35 hover:border-emerald-400'
                      : 'bg-[#0b1426] text-slate-300 border-slate-800 hover:border-slate-700 hover:text-white'
                  }`}
                >
                  <Crown className="w-3.5 h-3.5" />
                  <span>VIP {tier.level}</span>
                </button>
              );
            })}
          </div>

          {/* Selected Tier Detail Panel */}
          <div className="bg-[#0b1426] border border-slate-800 rounded-2xl p-6 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-5">
              <div className="space-y-1">
                <div className="text-xs font-medium text-amber-400">
                  VIP {activeShowcaseTier.level} Privilege Package · {currentLevel >= activeShowcaseTier.level ? 'Unlocked for You' : `Requires ₹${activeShowcaseTier.requiredXpInr.toLocaleString('en-IN')} Total XP`}
                </div>
                <h3 className="text-xl sm:text-2xl font-extrabold text-white">
                  VIP {activeShowcaseTier.level} — {activeShowcaseTier.name}
                </h3>
              </div>

              <button
                type="button"
                onClick={onOpenDeposit}
                className="min-h-[44px] px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs sm:text-sm transition-colors whitespace-nowrap shrink-0"
              >
                {currentLevel >= activeShowcaseTier.level ? 'Active — Deposit & Play' : `Unlock VIP ${activeShowcaseTier.level}`}
              </button>
            </div>

            {/* 4 Key Numbers Strip */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-1">
                <div className="text-xs text-slate-400">Level-Up Bonus</div>
                <div className="text-xl font-extrabold font-mono text-amber-400 tabular-nums">
                  ₹{activeShowcaseTier.levelUpBonusInr.toLocaleString('en-IN')}
                </div>
              </div>
              <div className="space-y-1">
                <div className="text-xs text-slate-400">Monthly VIP Gift</div>
                <div className="text-xl font-extrabold font-mono text-white tabular-nums">
                  ₹{activeShowcaseTier.monthlyGiftInr.toLocaleString('en-IN')}
                </div>
              </div>
              <div className="space-y-1">
                <div className="text-xs text-slate-400">Daily Cashback</div>
                <div className="text-xl font-extrabold font-mono text-emerald-400 tabular-nums">
                  {activeShowcaseTier.cashbackPercent}%
                </div>
              </div>
              <div className="space-y-1">
                <div className="text-xs text-slate-400">Withdrawal Fee Relief</div>
                <div className="text-xl font-extrabold text-cyan-300">
                  {activeShowcaseTier.feeDiscount}
                </div>
              </div>
            </div>

            {/* Included Benefits List */}
            <div className="border-t border-slate-800/80 pt-5 grid grid-cols-1 md:grid-cols-2 gap-3">
              {activeShowcaseTier.perks.map((perk, idx) => (
                <div key={idx} className="flex items-start gap-2.5 text-sm text-slate-200">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>{perk}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 5. FULL COMPARISON TABLE (ALL 8 LEVELS) */}
        <section className="space-y-4">
          <div className="space-y-1">
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              Complete VIP Privilege Comparison
            </h2>
            <p className="text-sm text-slate-400">
              VIP 1 se VIP 8 tak sabhi levels ke target XP aur rewards ek nazar me.
            </p>
          </div>

          <div className="bg-[#0b1426] border border-slate-800 rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="bg-[#080f1d] text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="py-3.5 px-4 font-semibold">VIP Tier</th>
                    <th className="py-3.5 px-4 font-semibold">Required XP</th>
                    <th className="py-3.5 px-4 font-semibold">Level-Up</th>
                    <th className="py-3.5 px-4 font-semibold">Monthly Gift</th>
                    <th className="py-3.5 px-4 font-semibold">Daily Rebate</th>
                    <th className="py-3.5 px-4 font-semibold">Payout Speed</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/70 font-mono tabular-nums">
                  {VIP_TIERS.map((tier) => {
                    const isMine = currentLevel === tier.level;
                    return (
                      <tr
                        key={tier.level}
                        onClick={() => setSelectedLevel(tier.level)}
                        className={`cursor-pointer transition-colors ${
                          isMine
                            ? 'bg-amber-500/10 text-white'
                            : 'hover:bg-slate-800/40 text-slate-300'
                        }`}
                      >
                        <td className="py-3.5 px-4 font-sans font-bold text-white whitespace-nowrap">
                          VIP {tier.level} · {tier.name} {isMine ? '(Current)' : ''}
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          ₹{tier.requiredXpInr.toLocaleString('en-IN')}
                        </td>
                        <td className="py-3.5 px-4 text-amber-400 font-bold whitespace-nowrap">
                          ₹{tier.levelUpBonusInr.toLocaleString('en-IN')}
                        </td>
                        <td className="py-3.5 px-4 text-cyan-300 whitespace-nowrap">
                          ₹{tier.monthlyGiftInr.toLocaleString('en-IN')}
                        </td>
                        <td className="py-3.5 px-4 text-emerald-400 font-bold whitespace-nowrap">
                          {tier.cashbackPercent}%
                        </td>
                        <td className="py-3.5 px-4 font-sans text-slate-300 whitespace-nowrap">
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

        {/* 6. VIP FAQ ACCORDION */}
        <section className="space-y-4">
          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            VIP Rules &amp; Common Questions
          </h2>

          <div className="bg-[#0b1426] border border-slate-800 rounded-2xl divide-y divide-slate-800/80">
            {VIP_FAQS.map((item, idx) => {
              const isOpen = openFaqIdx === idx;
              return (
                <div key={idx}>
                  <button
                    type="button"
                    onClick={() => setOpenFaqIdx(isOpen ? null : idx)}
                    className="w-full min-h-[56px] px-5 py-4 flex items-center justify-between gap-4 text-left hover:bg-slate-800/30 transition-colors"
                  >
                    <span className="text-sm font-semibold text-white">{item.q}</span>
                    {isOpen ? (
                      <ChevronUp className="w-4 h-4 text-amber-400 shrink-0" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
                    )}
                  </button>
                  {isOpen && (
                    <div className="px-5 pb-4 text-xs sm:text-sm text-slate-400 leading-relaxed">
                      {item.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* 7. BOTTOM ACTION CTA */}
        <section className="bg-[#0b1426] border border-amber-500/25 rounded-2xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
              <span>Apna VIP Upgrade Aaj Hi Start Karein</span>
            </h3>
            <p className="text-xs sm:text-sm text-slate-400">
              Pehla deposit karein ya team banakar 5-Level Agency Commission ke saath VIP rewards paayein.
            </p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={() => onSelectTab('agency')}
              className="min-h-[44px] px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-100 font-semibold text-xs sm:text-sm transition-colors whitespace-nowrap"
            >
              5-Level Agency
            </button>
            <button
              type="button"
              onClick={onOpenDeposit}
              className="min-h-[44px] px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs sm:text-sm transition-colors whitespace-nowrap flex items-center gap-1.5"
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
