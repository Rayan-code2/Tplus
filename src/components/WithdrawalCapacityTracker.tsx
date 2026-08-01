import React from 'react';
import { Zap, TrendingUp, Lock, ArrowUpRight, Award, ShieldCheck } from 'lucide-react';
import { User, SystemSettings, WithdrawalRequest, Transaction } from '../types';

interface WithdrawalCapacityTrackerProps {
  user: User;
  settings: SystemSettings;
  withdrawalRequests?: WithdrawalRequest[];
  transactions?: Transaction[];
  onNavigateToPackages?: () => void;
  compact?: boolean;
}

export function getWithdrawalCapacityDetails(
  user: User,
  settings: SystemSettings,
  withdrawalRequests: WithdrawalRequest[] = [],
  transactions: Transaction[] = []
) {
  const activePkg = settings.packages?.find((p) => p.id === user.activePackageId);
  const hasBoosterTx = transactions?.some(
    (t) => t.userId === user.id && t.notes && (t.notes.toLowerCase().includes('booster') || t.notes.includes('$20') || t.notes.includes('pkg-20'))
  );

  const isUpgraded20 = !!(
    user.isUpgraded ||
    (activePkg && (activePkg.price >= 20 || activePkg.isUpgradePackage)) ||
    user.activePackageId === 'pkg-20' ||
    hasBoosterTx
  );

  const rankLower = (user.rank || '').toLowerCase();
  const directsCount = user.directReferralsCount || 0;

  let capacityLimit = 10;
  let tierTitle = '$10 Starter Package';
  let badgeColor = 'bg-amber-500/20 text-amber-300 border-amber-500/30';
  let isUnlimited = false;
  let nextGoalText = '';
  let nextLimitText = '';

  if (!isUpgraded20) {
    capacityLimit = 10;
    tierTitle = '$10 Starter Package ($10 Limit)';
    badgeColor = 'bg-amber-500/20 text-amber-300 border-amber-500/30';
    nextGoalText = 'Activate the $20 Booster Pass to immediately unlock $100–$700+ withdrawal capacity!';
    nextLimitText = '$100 USDT';
  } else if (
    rankLower.includes('gold') ||
    rankLower.includes('diamond') ||
    rankLower.includes('apex') ||
    rankLower.includes('sovereign') ||
    rankLower.includes('crown')
  ) {
    capacityLimit = Infinity;
    tierTitle = `${user.rank || 'Gold'} Rank (Unlimited)`;
    badgeColor = 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30';
    isUnlimited = true;
    nextGoalText = 'Highest Leadership Rank Active! You enjoy UNLIMITED lifetime withdrawal capacity.';
    nextLimitText = 'UNLIMITED';
  } else if (rankLower.includes('silver')) {
    capacityLimit = 700;
    tierTitle = 'Silver Rank ($700 Limit)';
    badgeColor = 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30';
    nextGoalText = 'Promote to Gold Rank to unlock UNLIMITED lifetime withdrawal capacity!';
    nextLimitText = 'UNLIMITED';
  } else if (rankLower.includes('bronze')) {
    capacityLimit = 400;
    tierTitle = 'Bronze Rank ($400 Limit)';
    badgeColor = 'bg-orange-500/20 text-orange-300 border-orange-500/30';
    nextGoalText = 'Promote to Silver Rank (4 Directs + $2,500 Team Volume) to increase limit to $700 USDT!';
    nextLimitText = '$700 USDT';
  } else if (directsCount >= 2) {
    capacityLimit = 200;
    tierTitle = '$20 Package + 2 Directs ($200 Limit)';
    badgeColor = 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
    nextGoalText = 'Achieve Bronze Rank (2 Directs + $500 Volume) to increase capacity to $400 USDT!';
    nextLimitText = '$400 USDT';
  } else {
    capacityLimit = 100;
    tierTitle = '$20 Booster Package ($100 Limit)';
    badgeColor = 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30';
    nextGoalText = 'Sponsor 2 Direct Members with $20 package to double capacity to $200 USDT!';
    nextLimitText = '$200 USDT';
  }

  // Calculate total withdrawn so far (non-rejected)
  const userWds = withdrawalRequests.filter((w) => w.userId === user.id && w.status !== 'rejected');
  const totalWithdrawnSoFar = userWds.reduce((sum, w) => sum + (w.requestedAmount || 0), 0);

  const remainingCapacity = isUnlimited ? Infinity : Math.max(0, capacityLimit - totalWithdrawnSoFar);
  const usedPercent = isUnlimited
    ? 0
    : capacityLimit > 0
    ? Math.min(100, Math.round((totalWithdrawnSoFar / capacityLimit) * 100))
    : 100;

  return {
    isUpgraded20,
    capacityLimit,
    tierTitle,
    badgeColor,
    isUnlimited,
    totalWithdrawnSoFar,
    remainingCapacity,
    usedPercent,
    nextGoalText,
    nextLimitText,
  };
}

export const WithdrawalCapacityTracker: React.FC<WithdrawalCapacityTrackerProps> = ({
  user,
  settings,
  withdrawalRequests = [],
  transactions = [],
  onNavigateToPackages,
  compact = false,
}) => {
  const details = getWithdrawalCapacityDetails(user, settings, withdrawalRequests, transactions);
  const {
    isUpgraded20,
    capacityLimit,
    tierTitle,
    badgeColor,
    isUnlimited,
    totalWithdrawnSoFar,
    remainingCapacity,
    usedPercent,
    nextGoalText,
  } = details;

  return (
    <div className="bg-slate-900/90 border border-slate-700/70 rounded-2xl p-4 shadow-lg space-y-3">
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-1.5 font-bold text-slate-200">
          <Zap className="w-4 h-4 text-cyan-400" />
          <span>Withdrawal Capacity Status</span>
        </div>
        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border uppercase tracking-wider ${badgeColor}`}>
          {tierTitle}
        </span>
      </div>

      {/* Progress Bar Container */}
      <div className="space-y-1.5">
        <div className="flex justify-between items-center text-xs text-slate-300 font-medium">
          <span>
            Withdrawn: <strong className="text-white">${totalWithdrawnSoFar.toFixed(2)}</strong> /{' '}
            <strong className="text-cyan-400">{isUnlimited ? '∞ UNLIMITED' : `$${capacityLimit} USDT`}</strong>
          </span>
          <span className="font-bold text-emerald-400">
            {isUnlimited ? 'Unlimited Left' : `$${remainingCapacity.toFixed(2)} Remaining`}
          </span>
        </div>

        {/* Bar */}
        <div className="w-full bg-slate-950 h-3 rounded-full overflow-hidden p-0.5 border border-slate-800 relative">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              usedPercent > 90
                ? 'bg-gradient-to-r from-red-500 to-rose-600 shadow-[0_0_10px_#ef4444]'
                : usedPercent > 70
                ? 'bg-gradient-to-r from-amber-500 to-orange-500 shadow-[0_0_10px_#f59e0b]'
                : 'bg-gradient-to-r from-cyan-500 to-emerald-400 shadow-[0_0_10px_#06b6d4]'
            }`}
            style={{ width: `${isUnlimited ? 0 : Math.max(usedPercent > 0 ? 5 : 0, usedPercent)}%` }}
          />
        </div>

        <div className="flex justify-between items-center text-[10px] text-slate-400">
          <span>{isUnlimited ? '0% Capacity Used' : `${usedPercent}% Used`}</span>
          <span>{isUnlimited ? '100% Available' : `${Math.max(0, 100 - usedPercent)}% Capacity Left`}</span>
        </div>
      </div>

      {/* Next Step / Guidance Banner */}
      <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3 flex items-start gap-2.5 text-xs text-slate-300">
        <TrendingUp className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
        <div className="flex-1 space-y-1">
          <div className="font-semibold text-cyan-300">How to increase your withdrawal limit:</div>
          <p className="text-slate-400 text-[11px] leading-relaxed">{nextGoalText}</p>
          {!isUpgraded20 && onNavigateToPackages && (
            <button
              type="button"
              onClick={onNavigateToPackages}
              className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold text-[11px] hover:from-cyan-400 hover:to-blue-500 transition shadow-md"
            >
              <span>Activate $20 Booster Package</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
