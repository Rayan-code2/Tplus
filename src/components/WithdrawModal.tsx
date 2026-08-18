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
  onSubmitWithdraw: (amount: number, targetAddress: string, network: string, walletType?: 'mlm' | 'winning') => Promise<void>;
  onNavigateToPackages?: () => void;
  defaultWalletType?: 'mlm' | 'winning';
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
  defaultWalletType = 'winning',
}) => {
  const [selectedWallet, setSelectedWallet] = useState<'winning' | 'mlm'>('winning');
  const [amount, setAmount] = useState('20');
  const [address, setAddress] = useState(user.walletAddress || '');
  const [network, setNetwork] = useState<'TRC20' | 'BEP20' | 'ERC20'>('BEP20');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setSelectedWallet(defaultWalletType);
      const prevHtmlOverflow = document.documentElement.style.overflow;
      const prevBodyOverflow = document.body.style.overflow;
      document.documentElement.style.overflow = 'hidden';
      document.body.style.overflow = 'hidden';

      return () => {
        document.documentElement.style.overflow = prevHtmlOverflow;
        document.body.style.overflow = prevBodyOverflow;
      };
    }
  }, [isOpen, defaultWalletType]);

  if (!isOpen) return null;

  const isWinning = selectedWallet === 'winning';
  const reqAmountNum = parseFloat(amount) || 0;
  const currentAvailableBalance = isWinning ? (user.winningBalance || 0) : user.balance;
  const minWdAmount = isWinning ? (settings.winningWithdrawalMinAmount || 5) : 10;

  const capacityDetails = getWithdrawalCapacityDetails(user, settings, withdrawalRequests, transactions);
  const { isUpgraded20, isUnlimited, remainingCapacity } = capacityDetails;

  const isExceeding10PkgLimit = !isWinning && !isUpgraded20 && reqAmountNum > 10;
  const isExceedingCapacityLimit = !isWinning && !isUnlimited && reqAmountNum > remainingCapacity;
  const hasActivePackage = !!(user.activePackageId || user.isUpgraded || isUpgraded20);

  // Fee calculation
  const winFeePercent = settings.winningWithdrawalFeePercent ?? 10;
  const mlmUpgradePercent = isUpgraded20 ? (settings.upgradeFundDeductionPercent ?? 30) : 0;
  const mlmFeePercent = settings.withdrawalFeePercent ?? 2;

  const adminFeeAmt = isWinning ? reqAmountNum * (winFeePercent / 100) : reqAmountNum * (mlmFeePercent / 100);
  const upgradeDeductionAmt = isWinning ? 0 : reqAmountNum * (mlmUpgradePercent / 100);
  const netPayout = Math.max(0, reqAmountNum - adminFeeAmt - upgradeDeductionAmt);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reqAmountNum || reqAmountNum < minWdAmount) return;
    if (!isWinning && (isExceeding10PkgLimit || isExceedingCapacityLimit || !hasActivePackage)) return;
    if (currentAvailableBalance < reqAmountNum || !address) return;

    setSubmitting(true);
    try {
      await onSubmitWithdraw(reqAmountNum, address, network, selectedWallet);
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
            <div className="flex items-center gap-2 font-bold text-amber-400 text-sm">
              <ArrowUpRight className="w-4 h-4" />
              Instant Crypto Withdrawal & Transfer
            </div>
            <button onClick={onClose} className="text-slate-400 hover:text-white">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Wallet Selector Tabs */}
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setSelectedWallet('winning')}
              className={`p-2.5 rounded-xl border text-left transition font-mono ${
                selectedWallet === 'winning'
                  ? 'bg-amber-500/20 border-amber-500 text-amber-300 shadow-[0_0_12px_rgba(245,158,11,0.2)]'
                  : 'bg-[#050911] border-slate-800 text-slate-400 hover:border-slate-700'
              }`}
            >
              <div className="text-[11px] font-bold flex items-center justify-between">
                <span>🎮 Winning Wallet</span>
                <span className="text-[9px] bg-amber-500/30 text-amber-300 px-1.5 py-0.5 rounded font-extrabold">10% Fee</span>
              </div>
              <div className="text-sm font-extrabold text-white mt-0.5">${(user.winningBalance || 0).toFixed(2)} USDT</div>
              <div className="text-[9px] text-emerald-400 mt-0.5">No MLM Rules • Instant</div>
            </button>

            <button
              type="button"
              onClick={() => setSelectedWallet('mlm')}
              className={`p-2.5 rounded-xl border text-left transition font-mono ${
                selectedWallet === 'mlm'
                  ? 'bg-cyan-500/20 border-cyan-500 text-cyan-300 shadow-[0_0_12px_rgba(6,182,212,0.2)]'
                  : 'bg-[#050911] border-slate-800 text-slate-400 hover:border-slate-700'
              }`}
            >
              <div className="text-[11px] font-bold flex items-center justify-between">
                <span>🌐 MLM Network Wallet</span>
                <span className="text-[9px] bg-cyan-500/30 text-cyan-300 px-1.5 py-0.5 rounded font-extrabold">MLM Rules</span>
              </div>
              <div className="text-sm font-extrabold text-white mt-0.5">${user.balance.toFixed(2)} USDT</div>
              <div className="text-[9px] text-amber-400 mt-0.5">Package & Capping Rules</div>
            </button>
          </div>

          {/* Visual Progress Bar Widget (Only if MLM Wallet Selected) */}
          {selectedWallet === 'mlm' && (
            <WithdrawalCapacityTracker
              user={user}
              settings={settings}
              withdrawalRequests={withdrawalRequests}
              transactions={transactions}
              onNavigateToPackages={onNavigateToPackages}
            />
          )}

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div className="bg-[#050911] p-3 rounded-xl border border-slate-800 flex justify-between items-center">
              <span className="text-slate-400">
                {isWinning ? '🎮 Game Winning Balance:' : '🌐 MLM Network Balance:'}
              </span>
              <span className={`font-bold ${isWinning ? 'text-amber-300 font-extrabold' : 'text-emerald-400'}`}>
                ${currentAvailableBalance.toFixed(2)} USDT
              </span>
            </div>

            <div className="space-y-1">
              <label className="text-slate-300 font-bold">Withdrawal Amount ($ USDT)</label>
              <input
                type="number"
                min={minWdAmount}
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full bg-[#050911] border border-slate-700 rounded-xl p-2.5 text-cyan-300 focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-slate-300 font-bold">Target USDT Wallet Address ({network})</label>
              <input
                type="text"
                required
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full bg-[#050911] border border-slate-700 rounded-xl p-2.5 text-cyan-300 focus:outline-none"
              />
            </div>

            {selectedWallet === 'mlm' && !hasActivePackage && (
              <div className="bg-red-500/10 border border-red-500/40 rounded-xl p-3 text-red-400 text-[11px] font-bold flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 shrink-0" />
                <span>Withdrawal Condition Alert: Active Package Required for MLM Network withdrawals!</span>
              </div>
            )}

            {selectedWallet === 'mlm' && isExceeding10PkgLimit && (
              <div className="bg-amber-500/10 border border-amber-500/40 rounded-xl p-3 text-amber-400 text-[11px] font-bold flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 shrink-0" />
                <span>$10 Starter Package Limit: Maximum allowed withdrawal is $10 USDT per request.</span>
              </div>
            )}

            {selectedWallet === 'mlm' && isExceedingCapacityLimit && !isExceeding10PkgLimit && (
              <div className="bg-amber-500/10 border border-amber-500/40 rounded-xl p-3 text-amber-400 text-[11px] font-bold flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 shrink-0" />
                <span>Capacity Limit Exceeded: Your remaining allowed capacity is ${remainingCapacity.toFixed(2)} USDT.</span>
              </div>
            )}

            {/* Breakdown */}
            <div className="bg-[#0d1726] border border-amber-500/30 rounded-xl p-3 space-y-1 text-[11px]">
              <div className="flex justify-between text-slate-300">
                <span>Requested Amount:</span>
                <span>${reqAmountNum.toFixed(2)} USDT</span>
              </div>

              {isWinning ? (
                <div className="flex justify-between text-amber-400">
                  <span>Admin Fee ({winFeePercent}%):</span>
                  <span>-${adminFeeAmt.toFixed(2)} USDT</span>
                </div>
              ) : (
                <>
                  <div className="flex justify-between text-amber-400">
                    <span>{mlmUpgradePercent}% Shopping Wallet Rule:</span>
                    <span>-${upgradeDeductionAmt.toFixed(2)} USDT</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Network Fee ({mlmFeePercent}%):</span>
                    <span>-${adminFeeAmt.toFixed(2)} USDT</span>
                  </div>
                </>
              )}

              <div className="flex justify-between text-emerald-400 font-bold border-t border-slate-800 pt-1 text-xs">
                <span>Net Dispatched:</span>
                <span>${netPayout.toFixed(2)} USDT</span>
              </div>
            </div>

            <button
              type="submit"
              disabled={
                submitting ||
                reqAmountNum < minWdAmount ||
                currentAvailableBalance < reqAmountNum ||
                (!isWinning && (!hasActivePackage || isExceeding10PkgLimit || isExceedingCapacityLimit))
              }
              className={`w-full py-3.5 rounded-xl font-extrabold text-xs transition shadow-lg ${
                reqAmountNum >= minWdAmount &&
                currentAvailableBalance >= reqAmountNum &&
                (isWinning || (hasActivePackage && !isExceeding10PkgLimit && !isExceedingCapacityLimit))
                  ? 'bg-gradient-to-r from-amber-500 to-emerald-600 hover:from-amber-400 hover:to-emerald-500 text-black font-extrabold shadow-[0_0_15px_rgba(245,158,11,0.3)]'
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed'
              }`}
            >
              {submitting
                ? 'Processing Request...'
                : currentAvailableBalance < reqAmountNum
                ? `Insufficient Balance ($${currentAvailableBalance.toFixed(2)} USDT)`
                : !isWinning && !hasActivePackage
                ? 'Active Package Required to Withdraw'
                : !isWinning && isExceeding10PkgLimit
                ? '$10 Pkg Capped at $10 Max Withdrawal'
                : `Confirm ${isWinning ? 'Winning' : 'MLM'} Withdrawal ($${reqAmountNum} USDT)`}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
