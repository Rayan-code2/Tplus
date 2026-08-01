import React, { useState, useEffect } from 'react';
import { X, ArrowUpRight, ShieldAlert } from 'lucide-react';
import { User, SystemSettings, Transaction, WithdrawalRequest } from '../types';
import { WithdrawalCapacityTracker, getWithdrawalCapacityDetails } from './WithdrawalCapacityTracker';

interface WithdrawModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User;
  settings: SystemSettings;
  transactions?: Transaction[];
  withdrawalRequests?: WithdrawalRequest[];
  onSubmitWithdraw: (amount: number, targetAddress: string, network: string) => Promise<void>;
  onNavigateToPackages?: () => void;
}

export const WithdrawModal: React.FC<WithdrawModalProps> = ({
  isOpen,
  onClose,
  user,
  settings,
  transactions = [],
  withdrawalRequests = [],
  onSubmitWithdraw,
  onNavigateToPackages,
}) => {
  const [amount, setAmount] = useState('20');
  const [address, setAddress] = useState(user.walletAddress || '');
  const [network, setNetwork] = useState<'TRC20' | 'BEP20' | 'ERC20'>('BEP20');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const prevHtmlOverflow = document.documentElement.style.overflow;
      const prevBodyOverflow = document.body.style.overflow;
      document.documentElement.style.overflow = 'hidden';
      document.body.style.overflow = 'hidden';

      return () => {
        document.documentElement.style.overflow = prevHtmlOverflow;
        document.body.style.overflow = prevBodyOverflow;
      };
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const reqAmountNum = parseFloat(amount) || 0;
  const capacityDetails = getWithdrawalCapacityDetails(user, settings, withdrawalRequests, transactions);
  const { isUpgraded20, capacityLimit, isUnlimited, remainingCapacity } = capacityDetails;

  const isExceeding10PkgLimit = !isUpgraded20 && reqAmountNum > 10;
  const isExceedingCapacityLimit = !isUnlimited && reqAmountNum > remainingCapacity;
  const upgradePercent = isUpgraded20 ? (settings.upgradeFundDeductionPercent ?? 30) : 0;
  const upgradeDeductionAmt = reqAmountNum * (upgradePercent / 100);
  const gasFee = 1.5;
  const netPayout = Math.max(0, reqAmountNum - upgradeDeductionAmt - gasFee);
  const hasActivePackage = !!(user.activePackageId || user.isUpgraded || isUpgraded20);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reqAmountNum || reqAmountNum < 10 || isExceeding10PkgLimit || isExceedingCapacityLimit || user.balance < reqAmountNum || !address) return;

    setSubmitting(true);
    try {
      await onSubmitWithdraw(reqAmountNum, address, network);
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm overflow-y-auto p-3 sm:p-4 font-mono overscroll-contain">
      <div className="min-h-full w-full flex items-center justify-center py-6 sm:py-10">
        <div className="bg-[#0b1424] border border-cyan-500/40 rounded-2xl w-full max-w-lg p-5 sm:p-6 space-y-4 sm:space-y-5 shadow-[0_0_30px_rgba(6,182,212,0.2)] relative my-auto">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2 font-bold text-cyan-400 text-sm">
              <ArrowUpRight className="w-4 h-4" />
              Instant Crypto Withdrawal
            </div>
            <button onClick={onClose} className="text-slate-400 hover:text-white">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Visual Progress Bar Widget */}
          <WithdrawalCapacityTracker
            user={user}
            settings={settings}
            withdrawalRequests={withdrawalRequests}
            transactions={transactions}
            onNavigateToPackages={onNavigateToPackages}
          />

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div className="bg-[#050911] p-3 rounded-xl border border-slate-800 flex justify-between">
              <span className="text-slate-400">Available Balance:</span>
              <span className="font-bold text-emerald-400">${user.balance.toFixed(2)} USDT</span>
            </div>

            <div className="space-y-1">
              <label className="text-slate-300 font-bold">Withdrawal Amount ($ USDT)</label>
              <input
                type="number"
                min={10}
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full bg-[#050911] border border-slate-700 rounded-xl p-2.5 text-cyan-300 focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-slate-300 font-bold">Target USDT Wallet Address</label>
              <input
                type="text"
                required
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full bg-[#050911] border border-slate-700 rounded-xl p-2.5 text-cyan-300 focus:outline-none"
              />
            </div>

            {!hasActivePackage && (
              <div className="bg-red-500/10 border border-red-500/40 rounded-xl p-3 text-red-400 text-[11px] font-bold flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 shrink-0" />
                <span>Withdrawal Condition Alert: Active Package Required! Please activate a package ($10 or $20) to enable withdrawals.</span>
              </div>
            )}

            {isExceeding10PkgLimit && (
              <div className="bg-amber-500/10 border border-amber-500/40 rounded-xl p-3 text-amber-400 text-[11px] font-bold flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 shrink-0" />
                <span>$10 Starter Package Limit: Maximum allowed withdrawal is $10 USDT per request. Upgrade to $20 Booster Package for higher limits ($100+).</span>
              </div>
            )}

            {isExceedingCapacityLimit && !isExceeding10PkgLimit && (
              <div className="bg-amber-500/10 border border-amber-500/40 rounded-xl p-3 text-amber-400 text-[11px] font-bold flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 shrink-0" />
                <span>Capacity Limit Exceeded: Your remaining allowed capacity is ${remainingCapacity.toFixed(2)} USDT. Please upgrade rank or package for higher limits.</span>
              </div>
            )}

            {/* Breakdown */}
            <div className="bg-[#0d1726] border border-amber-500/30 rounded-xl p-3 space-y-1 text-[11px]">
              <div className="flex justify-between text-slate-300">
                <span>Requested Amount:</span>
                <span>${reqAmountNum.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-amber-400">
                <span>{upgradePercent}% Shopping Wallet Rule Deduction:</span>
                <span>-${upgradeDeductionAmt.toFixed(2)} {upgradePercent === 0 && '(0% for $10 Pkg)'}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Gas Fee:</span>
                <span>-${gasFee.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-emerald-400 font-bold border-t border-slate-800 pt-1 text-xs">
                <span>Net Dispatched:</span>
                <span>${netPayout.toFixed(2)} USDT</span>
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting || !hasActivePackage || isExceeding10PkgLimit || isExceedingCapacityLimit || user.balance < reqAmountNum || reqAmountNum < 10}
              className={`w-full py-3.5 rounded-xl font-extrabold text-xs transition shadow-lg ${
                hasActivePackage && !isExceeding10PkgLimit && !isExceedingCapacityLimit && user.balance >= reqAmountNum && reqAmountNum >= 10
                  ? 'bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white shadow-[0_0_15px_rgba(6,182,212,0.3)]'
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed'
              }`}
            >
              {submitting
                ? 'Processing Request...'
                : !hasActivePackage
                ? 'Active Package Required to Withdraw'
                : isExceeding10PkgLimit
                ? '$10 Pkg Capped at $10 Max Withdrawal'
                : isExceedingCapacityLimit
                ? `Exceeds Capacity ($${remainingCapacity.toFixed(2)} Available)`
                : user.balance < reqAmountNum
                ? 'Insufficient Balance'
                : 'Confirm Instant Withdrawal'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
