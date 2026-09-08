import React, { useState } from 'react';
import {
  ArrowDownLeft,
  ArrowUpRight,
  Copy,
  Check,
  ShieldAlert,
  AlertTriangle,
  Clock,
  ExternalLink,
  Wallet,
  Coins,
  RefreshCw,
} from 'lucide-react';
import { User, DepositRequest, WithdrawalRequest, SystemSettings, Transaction } from '../types';
import { WithdrawalCapacityTracker, getWithdrawalCapacityDetails } from './WithdrawalCapacityTracker';

interface FinanceViewProps {
  user: User;
  settings: SystemSettings;
  depositRequests: DepositRequest[];
  withdrawalRequests: WithdrawalRequest[];
  transactions?: Transaction[];
  onDepositSubmit: (amount: number, network: string, txHash: string) => Promise<void>;
  onWithdrawSubmit: (amount: number, targetAddress: string, network: string, walletType?: 'mlm' | 'winning') => Promise<void>;
  onNavigateToPackages?: () => void;
}

export const FinanceView: React.FC<FinanceViewProps> = ({
  user,
  settings,
  depositRequests,
  withdrawalRequests,
  transactions = [],
  onDepositSubmit,
  onWithdrawSubmit,
  onNavigateToPackages,
}) => {
  const [activeTab, setActiveTab] = useState<'deposit' | 'withdraw'>('deposit');
  const [selectedWallet, setSelectedWallet] = useState<'winning' | 'mlm'>('winning');

  // Deposit Form State
  const [depAmount, setDepAmount] = useState<string>('100');
  const depNetwork = 'BEP20';
  const [depTxHash, setDepTxHash] = useState<string>('');
  const [submittingDep, setSubmittingDep] = useState(false);
  const [copiedAddress, setCopiedAddress] = useState(false);

  // Withdrawal Form State
  const [wdAmount, setWdAmount] = useState<string>('20');
  const [wdAddress, setWdAddress] = useState<string>(user.walletAddress || '');
  const [wdNetwork, setWdNetwork] = useState<'TRC20' | 'BEP20' | 'ERC20'>('BEP20');
  const [submittingWd, setSubmittingWd] = useState(false);

  const selectedDepositAddress = settings.walletAddresses['BEP20'] || settings.walletAddresses.BEP20 || '0xBEP20AdminWalletAddress';

  const handleCopyAddress = () => {
    navigator.clipboard.writeText(selectedDepositAddress);
    setCopiedAddress(true);
    setTimeout(() => setCopiedAddress(false), 2000);
  };

  const handleDepositSubmitAction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!depAmount || parseFloat(depAmount) < 10) return;
    if (!depTxHash || depTxHash.trim().length < 8) return;

    setSubmittingDep(true);
    try {
      await onDepositSubmit(parseFloat(depAmount), depNetwork, depTxHash);
      setDepTxHash('');
    } finally {
      setSubmittingDep(false);
    }
  };

  // Withdrawal Live Calculation Breakdown
  const reqAmountNum = parseFloat(wdAmount) || 0;
  const isWinning = selectedWallet === 'winning';

  const currentAvailableBalance = isWinning ? (user.winningBalance || 0) : user.balance;
  const minWdAmount = isWinning ? (settings.winningWithdrawalMinAmount || 5) : (settings.minWithdrawalAmount || 10);

  // Fees calculation
  const winFeePercent = settings.winningWithdrawalFeePercent ?? 10;
  const agencyFeePercent = settings.withdrawalFeePercent ?? 5;

  const adminFeeAmt = isWinning ? reqAmountNum * (winFeePercent / 100) : reqAmountNum * (agencyFeePercent / 100);
  const netPayout = Math.max(0, reqAmountNum - adminFeeAmt);

  const handleWithdrawSubmitAction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reqAmountNum || reqAmountNum < minWdAmount) return;
    if (currentAvailableBalance < reqAmountNum) return;
    if (!wdAddress || wdAddress.trim().length < 10) return;

    setSubmittingWd(true);
    try {
      await onWithdrawSubmit(reqAmountNum, wdAddress, wdNetwork, selectedWallet);
    } finally {
      setSubmittingWd(false);
    }
  };

  const userDeposits = depositRequests.filter((d) => d.userId === user.id);
  const userWithdrawals = withdrawalRequests.filter((w) => w.userId === user.id);

  // Withdrawal Capacity & Limits Calculation
  const nonRejectedWds = userWithdrawals.filter((w) => w.status !== 'rejected');
  const todayStr = new Date().toISOString().split('T')[0];
  const todayWithdrawnSoFar = nonRejectedWds
    .filter((w) => w.createdAt.startsWith(todayStr))
    .reduce((sum, w) => sum + (w.requestedAmount || w.amount || 0), 0);

  const MAX_DAILY_CAP = 100;
  const remainingDaily = Math.max(0, MAX_DAILY_CAP - todayWithdrawnSoFar);

  return (
    <div className="space-y-8 font-mono pb-12">
      {/* Tab Switcher */}
      <div className="flex items-center gap-3 bg-[#0b1424] border border-cyan-500/30 p-2 rounded-2xl w-fit">
        <button
          onClick={() => setActiveTab('deposit')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs transition ${
            activeTab === 'deposit'
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-[0_0_15px_rgba(16,185,129,0.2)]'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <ArrowDownLeft className="w-4 h-4 text-emerald-400" />
          Deposit Crypto (USDT)
        </button>
        <button
          onClick={() => setActiveTab('withdraw')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs transition ${
            activeTab === 'withdraw'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-[0_0_15px_rgba(6,182,212,0.2)]'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <ArrowUpRight className="w-4 h-4 text-cyan-400" />
          Withdraw USDT (30% Rule)
        </button>
      </div>

      {/* DEPOSIT SECTION */}
      {activeTab === 'deposit' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Deposit Address & Form */}
          <div className="bg-[#0b1424] border border-emerald-500/30 rounded-2xl p-6 space-y-6">
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-emerald-300 flex items-center gap-2">
                <ArrowDownLeft className="w-4 h-4" />
                Crypto Deposit Terminal
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Select your preferred blockchain network and send USDT to the official admin wallet below.
              </p>
            </div>

            {/* Network Display */}
            <div className="space-y-2">
              <label className="text-xs text-slate-300 font-bold uppercase">
                Supported Deposit Network
              </label>
              <div className="w-full py-2.5 px-4 bg-emerald-500/10 border border-emerald-500/40 rounded-xl font-bold text-emerald-300 flex items-center justify-between text-xs shadow-[0_0_12px_rgba(16,185,129,0.15)]">
                <span>USDT - BEP20 (BNB Smart Chain)</span>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full font-extrabold uppercase">BEP20</span>
              </div>
            </div>

            {/* Admin Wallet Display & Copy */}
            <div className="bg-[#050911] border border-slate-800 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-slate-400 uppercase">
                  Official Deposit Address ({depNetwork})
                </span>
                <span className="text-[10px] text-emerald-400 font-bold">Auto-Verify</span>
              </div>

              <div className="flex items-center justify-between gap-2 bg-[#0d1726] border border-slate-700 rounded-xl px-3 py-2 text-xs text-cyan-300 font-mono">
                <span className="truncate">{selectedDepositAddress}</span>
                <button
                  onClick={handleCopyAddress}
                  className="p-1 hover:text-emerald-400 text-slate-400 shrink-0"
                  title="Copy Address"
                >
                  {copiedAddress ? (
                    <Check className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Submission Form */}
            <form onSubmit={handleDepositSubmitAction} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs text-slate-300 font-bold">Deposit Amount ($ USDT)</label>
                <input
                  type="number"
                  min={10}
                  step={1}
                  required
                  value={depAmount}
                  onChange={(e) => setDepAmount(e.target.value)}
                  className="w-full bg-[#050911] border border-slate-700 rounded-xl px-4 py-2 text-sm text-cyan-300 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs text-slate-300 font-bold">
                  Transaction Hash / TXID
                </label>
                <input
                  type="text"
                  required
                  placeholder="Paste blockchain TXID here..."
                  value={depTxHash}
                  onChange={(e) => setDepTxHash(e.target.value)}
                  className="w-full bg-[#050911] border border-slate-700 rounded-xl px-4 py-2 text-xs text-cyan-300 focus:outline-none focus:border-emerald-500 font-mono"
                />
              </div>

              <button
                type="submit"
                disabled={submittingDep}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-black font-extrabold text-xs transition shadow-[0_0_15px_rgba(16,185,129,0.3)]"
              >
                {submittingDep ? 'Submitting Deposit...' : 'Submit Deposit Notification'}
              </button>
            </form>
          </div>

          {/* Deposit Requests History Table */}
          <div className="bg-[#0b1424] border border-slate-800 rounded-2xl p-6 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
              <Clock className="w-4 h-4 text-emerald-400" />
              Your Deposit History
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-[#050911] text-slate-400 uppercase text-[10px]">
                  <tr>
                    <th className="p-3">Amount</th>
                    <th className="p-3">Network</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">TXID</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-slate-300">
                  {userDeposits.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="p-6 text-center text-slate-500">
                        No deposits requested yet.
                      </td>
                    </tr>
                  ) : (
                    userDeposits.map((dep) => (
                      <tr key={dep.id}>
                        <td className="p-3 font-bold text-emerald-400">${dep.amount} USDT</td>
                        <td className="p-3 text-slate-400">{dep.network}</td>
                        <td className="p-3">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              dep.status === 'approved'
                                ? 'bg-emerald-500/20 text-emerald-400'
                                : dep.status === 'pending'
                                ? 'bg-amber-500/20 text-amber-400'
                                : 'bg-red-500/20 text-red-400'
                            }`}
                          >
                            {dep.status}
                          </span>
                        </td>
                        <td className="p-3 text-slate-500 truncate max-w-[120px]">
                          {dep.txHash}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* WITHDRAWAL SECTION */}
      {activeTab === 'withdraw' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Withdrawal Form & Live Breakdown */}
          <div className="bg-[#0b1424] border border-cyan-500/30 rounded-2xl p-6 space-y-6">
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-cyan-300 flex items-center gap-2">
                <ArrowUpRight className="w-4 h-4" />
                Crypto Withdrawal Terminal
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Request instant USDT payout directly to your crypto wallet address.
              </p>
            </div>

            {/* 3 Gaming Wallet Overview Cards in Finance */}
            <div className="grid grid-cols-3 gap-2 bg-[#050911] border border-slate-800 rounded-xl p-3 text-center">
              <div className="bg-[#070d18] p-2 rounded-lg border border-cyan-500/20">
                <span className="text-[9px] text-cyan-400 font-bold uppercase block">Deposit Wallet</span>
                <div className="text-sm font-bold text-cyan-300">${(user.depositBalance || 0).toFixed(2)}</div>
                <span className="text-[8px] text-slate-500">For Game Bets</span>
              </div>
              <div className="bg-[#070d18] p-2 rounded-lg border border-amber-500/20">
                <span className="text-[9px] text-amber-400 font-bold uppercase block">Winning Wallet</span>
                <div className="text-sm font-bold text-amber-300">${(user.winningBalance || 0).toFixed(2)}</div>
                <span className="text-[8px] text-emerald-400">{winFeePercent}% Admin Fee</span>
              </div>
              <div className="bg-[#070d18] p-2 rounded-lg border border-emerald-500/20">
                <span className="text-[9px] text-emerald-400 font-bold uppercase block">5-Level Agency</span>
                <div className="text-sm font-bold text-emerald-300">${user.balance.toFixed(2)}</div>
                <span className="text-[8px] text-slate-400">Team Bet Turnover</span>
              </div>
            </div>

            {/* Wallet Selector Tabs */}
            <div className="space-y-2">
              <label className="text-xs text-slate-300 font-bold uppercase">Select Withdrawal Wallet Source</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedWallet('winning')}
                  className={`p-3 rounded-xl border text-left transition font-mono ${
                    selectedWallet === 'winning'
                      ? 'bg-amber-500/20 border-amber-500 text-amber-300 shadow-[0_0_12px_rgba(245,158,11,0.2)]'
                      : 'bg-[#050911] border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <div className="text-xs font-bold flex items-center justify-between">
                    <span>🎮 Game Winning Wallet</span>
                    <span className="text-[10px] bg-amber-500/30 text-amber-300 px-1.5 py-0.5 rounded font-extrabold">{winFeePercent}% Fee</span>
                  </div>
                  <div className="text-sm font-extrabold text-white mt-1">${(user.winningBalance || 0).toFixed(2)} USDT</div>
                  <div className="text-[9px] text-emerald-400 mt-1">Game Winnings • Instant Auto Payout ≤ $20</div>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedWallet('mlm')}
                  className={`p-3 rounded-xl border text-left transition font-mono ${
                    selectedWallet === 'mlm'
                      ? 'bg-cyan-500/20 border-cyan-500 text-cyan-300 shadow-[0_0_12px_rgba(6,182,212,0.2)]'
                      : 'bg-[#050911] border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <div className="text-xs font-bold flex items-center justify-between">
                    <span>👥 5-Level Agency Wallet</span>
                    <span className="text-[10px] bg-cyan-500/30 text-cyan-300 px-1.5 py-0.5 rounded font-extrabold">{agencyFeePercent}% Fee</span>
                  </div>
                  <div className="text-sm font-extrabold text-white mt-1">${user.balance.toFixed(2)} USDT</div>
                  <div className="text-[9px] text-cyan-400 mt-1">Turnover Commission • Instant Auto Payout ≤ $20</div>
                </button>
              </div>
            </div>

            <form onSubmit={handleWithdrawSubmitAction} className="space-y-4">
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-xs">
                  <label className="text-slate-300 font-bold">Withdrawal Amount ($ USDT)</label>
                  <span className="text-cyan-400 font-mono">
                    Available: ${currentAvailableBalance.toFixed(2)} USDT
                  </span>
                </div>
                <input
                  type="number"
                  min={minWdAmount}
                  step={1}
                  required
                  value={wdAmount}
                  onChange={(e) => setWdAmount(e.target.value)}
                  className="w-full bg-[#050911] border border-slate-700 rounded-xl px-4 py-2 text-sm text-cyan-300 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs text-slate-300 font-bold">Target USDT Wallet Address ({wdNetwork})</label>
                <input
                  type="text"
                  required
                  placeholder="0x... or T..."
                  value={wdAddress}
                  onChange={(e) => setWdAddress(e.target.value)}
                  className="w-full bg-[#050911] border border-slate-700 rounded-xl px-4 py-2 text-xs text-cyan-300 focus:outline-none focus:border-cyan-500 font-mono"
                />
              </div>

              {/* Breakdown Box */}
              <div className="bg-[#0d1726] border border-cyan-500/30 rounded-xl p-4 space-y-2 text-xs font-mono">
                <div className="flex items-center justify-between text-cyan-300 font-bold border-b border-slate-800 pb-2">
                  <span className="flex items-center gap-1">
                    <ShieldAlert className="w-3.5 h-3.5" />
                    {selectedWallet === 'winning' ? 'Game Winning Wallet Payout Breakdown' : '5-Level Agency Commission Payout Breakdown'}
                  </span>
                  <span>{selectedWallet === 'winning' ? `${winFeePercent}% Admin Charge` : `${agencyFeePercent}% Fee`}</span>
                </div>

                <div className="flex justify-between text-slate-300">
                  <span>Requested Amount:</span>
                  <span className="font-bold">${reqAmountNum.toFixed(2)} USDT</span>
                </div>

                <div className="flex justify-between text-amber-400">
                  <span>Processing Charge ({isWinning ? winFeePercent : agencyFeePercent}%):</span>
                  <span>-${adminFeeAmt.toFixed(2)} USDT</span>
                </div>

                <div className="flex justify-between text-emerald-400 font-extrabold text-sm pt-2 border-t border-slate-800">
                  <span>Net Dispatched To Wallet:</span>
                  <span>${netPayout.toFixed(2)} USDT</span>
                </div>
              </div>

              <button
                type="submit"
                disabled={
                  submittingWd ||
                  reqAmountNum < minWdAmount ||
                  currentAvailableBalance < reqAmountNum
                }
                className={`w-full py-3.5 rounded-xl font-extrabold text-xs transition shadow-lg ${
                  reqAmountNum >= minWdAmount && currentAvailableBalance >= reqAmountNum
                    ? 'bg-gradient-to-r from-amber-500 to-emerald-600 hover:from-amber-400 hover:to-emerald-500 text-black font-extrabold shadow-[0_0_15px_rgba(245,158,11,0.3)]'
                    : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                }`}
              >
                {submittingWd
                  ? 'Processing Request...'
                  : currentAvailableBalance < reqAmountNum
                  ? `Insufficient Balance ($${currentAvailableBalance.toFixed(2)} USDT)`
                  : `Confirm ${selectedWallet === 'winning' ? 'Winning' : 'Agency'} Withdrawal ($${reqAmountNum} USDT)`}
              </button>
            </form>
          </div>

          {/* Withdrawal History Table */}
          <div className="bg-[#0b1424] border border-slate-800 rounded-2xl p-6 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
              <Clock className="w-4 h-4 text-cyan-400" />
              Your Withdrawal History
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-[#050911] text-slate-400 uppercase text-[10px]">
                  <tr>
                    <th className="p-3">Req ($)</th>
                    <th className="p-3">30% Shopping</th>
                    <th className="p-3">Net ($)</th>
                    <th className="p-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-slate-300">
                  {userWithdrawals.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="p-6 text-center text-slate-500">
                        No withdrawals requested yet.
                      </td>
                    </tr>
                  ) : (
                    userWithdrawals.map((wd) => (
                      <tr key={wd.id}>
                        <td className="p-3 font-bold text-white">${wd.requestedAmount}</td>
                        <td className="p-3 text-amber-400">${wd.upgradeDeduction.toFixed(2)}</td>
                        <td className="p-3 font-bold text-emerald-400">${wd.netAmount.toFixed(2)}</td>
                        <td className="p-3">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              wd.status === 'approved'
                                ? 'bg-emerald-500/20 text-emerald-400'
                                : wd.status === 'pending'
                                ? 'bg-amber-500/20 text-amber-400'
                                : 'bg-red-500/20 text-red-400'
                            }`}
                          >
                            {wd.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
