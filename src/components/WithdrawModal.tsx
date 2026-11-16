import React, { useState, useEffect } from 'react';
import {
  ChevronLeft,
  X,
  RotateCw,
  CreditCard,
  ArrowUpRight,
  Smartphone,
  Building2,
  Wallet,
} from 'lucide-react';
import { User, SystemSettings, Transaction, WithdrawalRequest } from '../types';

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
  onRefreshUser?: () => Promise<void>;
}

const EmvChip = () => (
  <div className="w-8 h-6 rounded-md bg-gradient-to-tr from-[#a7f3d0] via-[#5eead4] to-[#2dd4bf] border border-[#14b8a6]/70 p-0.5 flex flex-col justify-between shadow-sm">
    <div className="flex justify-between items-center h-full w-full">
      <div className="w-2.5 h-full border-r border-[#0f766e]/40 flex flex-col justify-around">
        <div className="h-0.5 bg-[#0f766e]/40 w-full" />
        <div className="h-0.5 bg-[#0f766e]/40 w-full" />
      </div>
      <div className="w-2 h-2 rounded-full border border-[#0f766e]/50" />
      <div className="w-2.5 h-full border-l border-[#0f766e]/40 flex flex-col justify-around">
        <div className="h-0.5 bg-[#0f766e]/40 w-full" />
        <div className="h-0.5 bg-[#0f766e]/40 w-full" />
      </div>
    </div>
  </div>
);

export const WithdrawModal: React.FC<WithdrawModalProps> = ({
  isOpen,
  onClose,
  user,
  settings,
  withdrawalRequests = [],
  onSubmitWithdraw,
  defaultWalletType = 'winning',
  onRefreshUser,
}) => {
  const [currentView, setCurrentView] = useState<'main' | 'history'>('main');
  const [selectedWallet, setSelectedWallet] = useState<'winning' | 'mlm'>(defaultWalletType);
  const [payoutMethod, setPayoutMethod] = useState<'UPI' | 'BANK'>('UPI');
  const [amount, setAmount] = useState<string>('200');
  const [upiId, setUpiId] = useState<string>('');
  const [bankAccountNo, setBankAccountNo] = useState<string>('');
  const [bankIfsc, setBankIfsc] = useState<string>('');
  const [bankHolderName, setBankHolderName] = useState<string>(user?.name || '');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [formError, setFormError] = useState<string>('');

  // Prevent background scrolling when modal is open
  useEffect(() => {
    if (isOpen) {
      setSelectedWallet(defaultWalletType);
      setCurrentView('main');
      setFormError('');
      setBankHolderName((prev) => prev || user?.name || '');

      const prevHtmlOverflow = document.documentElement.style.overflow;
      const prevBodyOverflow = document.body.style.overflow;
      document.documentElement.style.overflow = 'hidden';
      document.body.style.overflow = 'hidden';

      return () => {
        document.documentElement.style.overflow = prevHtmlOverflow;
        document.body.style.overflow = prevBodyOverflow;
      };
    }
  }, [isOpen, defaultWalletType, user?.name]);

  if (!isOpen) return null;

  const isWinning = selectedWallet === 'winning';
  const reqAmountNum = parseFloat(amount) || 0;
  const currentAvailableBalance = isWinning ? (user?.winningBalance || 0) : (user?.balance || 0);
  const minWdAmount = isWinning
    ? (settings.winningWithdrawalMinAmount !== undefined ? settings.winningWithdrawalMinAmount : 100)
    : (settings.minWithdrawalAmount !== undefined ? settings.minWithdrawalAmount : 200);

  const winFeePercent = settings.winningWithdrawalFeePercent !== undefined ? settings.winningWithdrawalFeePercent : 10;
  const agencyFeePercent = settings.withdrawalFeePercent !== undefined ? settings.withdrawalFeePercent : 5;
  const activeFeePercent = isWinning ? winFeePercent : agencyFeePercent;

  const adminFeeAmt = reqAmountNum * (activeFeePercent / 100);
  const netPayout = Math.max(0, reqAmountNum - adminFeeAmt);

  const isTargetValid =
    payoutMethod === 'UPI'
      ? upiId.trim().includes('@') && upiId.trim().length >= 5
      : bankAccountNo.trim().length >= 8 &&
        bankIfsc.trim().length >= 8 &&
        bankHolderName.trim().length >= 2;

  const userWithdrawals = withdrawalRequests.filter((w) => !w.userId || w.userId === user?.id);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      if (onRefreshUser) {
        await onRefreshUser();
      }
    } finally {
      setTimeout(() => setIsRefreshing(false), 600);
    }
  };

  const handleSelectAmount = (amt: number) => {
    setAmount(amt.toString());
    setFormError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!reqAmountNum || reqAmountNum < minWdAmount) {
      setFormError(`Minimum withdrawal amount ₹${minWdAmount} INR hai.`);
      return;
    }
    if (currentAvailableBalance < reqAmountNum) {
      setFormError(`Available balance ₹${currentAvailableBalance.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} se kam hai.`);
      return;
    }
    if (!isTargetValid) {
      setFormError(
        payoutMethod === 'UPI'
          ? 'Please valid UPI ID daalein (jaise 9876543210@ybl ya name@okaxis).'
          : 'Please valid Bank Account Number, IFSC Code aur Account Holder Name daalein.'
      );
      return;
    }

    const composedAddress =
      payoutMethod === 'UPI'
        ? `UPI: ${upiId.trim()}`
        : `A/C: ${bankAccountNo.trim()} | IFSC: ${bankIfsc.trim().toUpperCase()} | ${bankHolderName.trim()}`;

    setSubmitting(true);
    try {
      await onSubmitWithdraw(
        reqAmountNum,
        composedAddress,
        payoutMethod === 'UPI' ? 'UPI' : 'BANK-IMPS',
        selectedWallet
      );
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  const quickAmountsRow1 = [200, 500, 1000, 2000];
  const quickAmountsRow2 = [5000, 10000];
  const canSubmit =
    !submitting &&
    reqAmountNum >= minWdAmount &&
    currentAvailableBalance >= reqAmountNum &&
    isTargetValid;

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex flex-col justify-end sm:justify-center items-center font-sans animate-fade-in p-0 sm:p-4 overscroll-contain">
      {/* Main Container - Exact DepositModal smartphone frame & color theme */}
      <div className="w-full max-w-md bg-[#050a18] border border-blue-900/40 rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col max-h-[92vh] sm:max-h-[88vh] overflow-hidden">
        {/* 1. TOP HEADER */}
        <header className="flex items-center justify-between px-4 py-3.5 border-b border-blue-950/60 bg-[#060e22] shrink-0">
          <button
            type="button"
            onClick={() => {
              if (currentView !== 'main') {
                setCurrentView('main');
              } else {
                onClose();
              }
            }}
            className="p-1 -ml-1 text-slate-300 hover:text-white transition active:scale-90"
            title="Back"
          >
            <ChevronLeft className="w-6 h-6 stroke-[2.5]" />
          </button>

          <h2 className="text-base sm:text-lg font-black text-white tracking-wide">
            {currentView === 'history' ? 'Withdraw History' : 'Withdraw'}
          </h2>

          {currentView === 'main' ? (
            <button
              type="button"
              onClick={() => setCurrentView('history')}
              className="text-xs font-semibold text-[#8ea2cb] hover:text-cyan-300 transition whitespace-nowrap"
            >
              Withdraw history
            </button>
          ) : (
            <button
              type="button"
              onClick={onClose}
              className="p-1 text-slate-400 hover:text-white transition"
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </header>

        {/* 2. SCROLLABLE CONTENT BODY */}
        <div className="flex-1 overflow-y-auto p-3.5 sm:p-4 space-y-4">
          {currentView === 'main' && (
            <form id="withdraw-form" onSubmit={handleSubmit} className="space-y-4">
              {/* ATM DEBIT CARD STYLE BALANCE CARD (Exact match to DepositModal) */}
              <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl p-4 sm:p-5 bg-gradient-to-r from-[#2dd4bf] via-[#14b8a6] to-[#06b6d4] shadow-[0_8px_25px_rgba(20,184,166,0.3)] text-[#06332c]">
                {/* Subtle curved background overlay */}
                <div className="absolute inset-0 opacity-15 pointer-events-none">
                  <svg viewBox="0 0 400 200" className="w-full h-full object-cover">
                    <path d="M 0 100 Q 150 40 400 120 L 400 200 L 0 200 Z" fill="#ffffff" />
                  </svg>
                </div>

                {/* Card Top: Balance header */}
                <div className="relative z-10 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Wallet className="w-4 h-4 text-[#06332c]" />
                    <span className="text-xs sm:text-sm font-extrabold text-[#06332c] tracking-wide">
                      {isWinning ? 'Winning Balance' : 'Agency Balance'}
                    </span>
                  </div>
                  <span className="text-[11px] font-black text-[#064e43] tracking-wide">
                    {activeFeePercent}% Fee
                  </span>
                </div>

                {/* Card Amount & Refresh button */}
                <div className="relative z-10 flex items-center gap-3 my-2 sm:my-3">
                  <span className="text-2xl sm:text-3xl font-black text-[#042823] tracking-tight tabular-nums">
                    ₹{currentAvailableBalance.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                  <button
                    type="button"
                    onClick={handleRefresh}
                    className="p-1 text-[#064e43] hover:text-[#042823] transition-colors active:scale-90"
                    title="Refresh Balance"
                  >
                    <RotateCw className={`w-4 h-4 stroke-[2.5] ${isRefreshing ? 'animate-spin text-[#042823]' : ''}`} />
                  </button>
                </div>

                {/* Card Bottom: EMV Smart Chip & Card Mask */}
                <div className="relative z-10 flex items-center justify-between pt-1">
                  <EmvChip />
                  <span className="font-mono text-xs sm:text-sm font-black tracking-widest text-[#064e43]">
                    ****  ****
                  </span>
                </div>
              </div>

              {/* WALLET SOURCE TILES (Matching DepositModal channel cards) */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedWallet('winning')}
                  className={`rounded-2xl p-3 flex flex-col items-start text-left transition-all duration-200 active:scale-95 ${
                    selectedWallet === 'winning'
                      ? 'bg-gradient-to-b from-[#2dd4bf] to-[#06b6d4] text-[#062e28] shadow-[0_0_15px_rgba(45,212,191,0.4)]'
                      : 'bg-[#071738] border border-blue-900/40 text-slate-300 hover:border-cyan-500/40'
                  }`}
                >
                  <div className="w-full flex items-center justify-between text-[11px] font-black">
                    <span>Winning Wallet</span>
                    <span className={selectedWallet === 'winning' ? 'text-[#064e43]' : 'text-cyan-400'}>
                      {winFeePercent}% Fee
                    </span>
                  </div>
                  <div className={`text-sm font-black mt-1 tabular-nums ${selectedWallet === 'winning' ? 'text-[#042823]' : 'text-white'}`}>
                    ₹{(user?.winningBalance || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                  <div className={`text-[10px] font-semibold mt-0.5 ${selectedWallet === 'winning' ? 'text-[#083b32]' : 'text-slate-400'}`}>
                    Game Winnings · Instant
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedWallet('mlm')}
                  className={`rounded-2xl p-3 flex flex-col items-start text-left transition-all duration-200 active:scale-95 ${
                    selectedWallet === 'mlm'
                      ? 'bg-gradient-to-b from-[#2dd4bf] to-[#06b6d4] text-[#062e28] shadow-[0_0_15px_rgba(45,212,191,0.4)]'
                      : 'bg-[#071738] border border-blue-900/40 text-slate-300 hover:border-cyan-500/40'
                  }`}
                >
                  <div className="w-full flex items-center justify-between text-[11px] font-black">
                    <span>5-Level Agency</span>
                    <span className={selectedWallet === 'mlm' ? 'text-[#064e43]' : 'text-cyan-400'}>
                      {agencyFeePercent}% Fee
                    </span>
                  </div>
                  <div className={`text-sm font-black mt-1 tabular-nums ${selectedWallet === 'mlm' ? 'text-[#042823]' : 'text-white'}`}>
                    ₹{(user?.balance || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                  <div className={`text-[10px] font-semibold mt-0.5 ${selectedWallet === 'mlm' ? 'text-[#083b32]' : 'text-slate-400'}`}>
                    Agency Commission
                  </div>
                </button>
              </div>

              {/* SELECT PAYOUT METHOD SECTION (Matching DepositModal "Select channel" card) */}
              <div className="bg-[#071533] border border-blue-900/40 rounded-2xl p-3.5 space-y-2.5">
                <div className="flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-cyan-400" />
                  <span className="text-xs sm:text-sm font-black text-white">Select payout method</span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setPayoutMethod('UPI')}
                    className={`w-full p-2.5 rounded-xl text-left transition-all ${
                      payoutMethod === 'UPI'
                        ? 'bg-gradient-to-r from-[#2dd4bf] to-[#06b6d4] text-[#052822] shadow-md'
                        : 'bg-[#0b1b42] border border-blue-900/40 text-slate-200 hover:border-cyan-400/40'
                    }`}
                  >
                    <div className="font-black text-xs sm:text-sm leading-tight flex items-center gap-1.5">
                      <Smartphone className="w-3.5 h-3.5 shrink-0" />
                      <span>UPI Instant</span>
                    </div>
                    <div className={`text-[11px] font-semibold mt-0.5 ${payoutMethod === 'UPI' ? 'text-[#083b32]' : 'text-slate-400'}`}>
                      GPay / PhonePe / Paytm
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPayoutMethod('BANK')}
                    className={`w-full p-2.5 rounded-xl text-left transition-all ${
                      payoutMethod === 'BANK'
                        ? 'bg-gradient-to-r from-[#2dd4bf] to-[#06b6d4] text-[#052822] shadow-md'
                        : 'bg-[#0b1b42] border border-blue-900/40 text-slate-200 hover:border-cyan-400/40'
                    }`}
                  >
                    <div className="font-black text-xs sm:text-sm leading-tight flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5 shrink-0" />
                      <span>Bank Transfer</span>
                    </div>
                    <div className={`text-[11px] font-semibold mt-0.5 ${payoutMethod === 'BANK' ? 'text-[#083b32]' : 'text-slate-400'}`}>
                      IMPS / NEFT Instant
                    </div>
                  </button>
                </div>
              </div>

              {/* QUICK AMOUNT SELECTION GRID (Matching DepositModal) */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-slate-300">
                  <span>Withdrawal Amount</span>
                  <span className="text-cyan-400 font-mono tabular-nums">
                    Min: ₹{minWdAmount} · Fee: {activeFeePercent}%
                  </span>
                </div>

                <div className="grid grid-cols-4 gap-2">
                  {quickAmountsRow1.map((amt) => {
                    const isSelected = reqAmountNum === amt;
                    return (
                      <button
                        key={amt}
                        type="button"
                        onClick={() => handleSelectAmount(amt)}
                        className={`py-2 rounded-xl text-xs font-black tabular-nums transition-all ${
                          isSelected
                            ? 'bg-[#2dd4bf] text-[#042823] shadow-md shadow-teal-500/20 scale-102'
                            : 'bg-[#071638] border border-blue-900/40 text-slate-200 hover:border-cyan-500/30'
                        }`}
                      >
                        ₹{amt.toLocaleString('en-IN')}
                      </button>
                    );
                  })}
                </div>

                <div className="grid grid-cols-3 gap-2">
                  {quickAmountsRow2.map((amt) => {
                    const isSelected = reqAmountNum === amt;
                    return (
                      <button
                        key={amt}
                        type="button"
                        onClick={() => handleSelectAmount(amt)}
                        className={`py-2 rounded-xl text-xs font-black tabular-nums transition-all ${
                          isSelected
                            ? 'bg-[#2dd4bf] text-[#042823] shadow-md shadow-teal-500/20 scale-102'
                            : 'bg-[#071638] border border-blue-900/40 text-slate-200 hover:border-cyan-500/30'
                        }`}
                      >
                        ₹{amt.toLocaleString('en-IN')}
                      </button>
                    );
                  })}

                  <button
                    type="button"
                    onClick={() => {
                      const maxVal = Math.floor(currentAvailableBalance);
                      if (maxVal > 0) handleSelectAmount(maxVal);
                    }}
                    className={`py-2 rounded-xl text-xs font-black transition-all ${
                      currentAvailableBalance > 0 && reqAmountNum === Math.floor(currentAvailableBalance)
                        ? 'bg-[#2dd4bf] text-[#042823] shadow-md shadow-teal-500/20 scale-102'
                        : 'bg-[#071638] border border-blue-900/40 text-cyan-300 hover:border-cyan-500/30'
                    }`}
                  >
                    Max All
                  </button>
                </div>

                {/* Custom Amount Input Field */}
                <div className="relative mt-2">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-black text-slate-400 text-sm">
                    ₹
                  </span>
                  <input
                    type="number"
                    min={minWdAmount}
                    step="any"
                    required
                    value={amount}
                    onChange={(e) => {
                      setAmount(e.target.value);
                      setFormError('');
                    }}
                    placeholder={`Minimum ₹${minWdAmount} INR`}
                    className="w-full pl-8 pr-4 py-2.5 rounded-xl bg-[#071533] border border-blue-900/50 text-white font-bold text-sm tabular-nums focus:outline-none focus:border-cyan-400 transition"
                  />
                </div>
              </div>

              {/* PAYOUT DESTINATION DETAILS BOX (Matching DepositModal input card) */}
              <div className="bg-[#071533] border border-blue-900/50 rounded-2xl p-3.5 sm:p-4 space-y-2.5">
                {payoutMethod === 'UPI' ? (
                  <div className="space-y-1.5">
                    <label className="text-xs font-black text-slate-200 flex items-center justify-between">
                      <span>Your UPI ID (PhonePe / GPay / Paytm)</span>
                      <span className="text-[10px] text-cyan-400 font-normal">Instant Transfer</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. 9876543210@ybl or name@okaxis"
                      value={upiId}
                      onChange={(e) => {
                        setUpiId(e.target.value);
                        setFormError('');
                      }}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#050a18] border border-cyan-500/40 text-white font-mono text-xs sm:text-sm focus:outline-none focus:border-cyan-400 transition"
                    />
                    <p className="text-[10px] text-slate-400 leading-tight">
                      Verify your UPI ID carefully before submitting. Payouts are sent directly to this VPA.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    <div className="space-y-1">
                      <label className="text-xs font-black text-slate-200 block">
                        Account Holder Name
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Full Name as per Bank Passbook"
                        value={bankHolderName}
                        onChange={(e) => {
                          setBankHolderName(e.target.value);
                          setFormError('');
                        }}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-[#050a18] border border-cyan-500/40 text-white text-xs sm:text-sm focus:outline-none focus:border-cyan-400 transition"
                      />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <div className="space-y-1">
                        <label className="text-xs font-black text-slate-200 block">
                          Bank Account Number
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="Account No."
                          value={bankAccountNo}
                          onChange={(e) => {
                            setBankAccountNo(e.target.value);
                            setFormError('');
                          }}
                          className="w-full px-3.5 py-2.5 rounded-xl bg-[#050a18] border border-cyan-500/40 text-white font-mono text-xs sm:text-sm focus:outline-none focus:border-cyan-400 transition"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-black text-slate-200 block">
                          IFSC Code
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. SBIN0001234"
                          value={bankIfsc}
                          onChange={(e) => {
                            setBankIfsc(e.target.value.toUpperCase());
                            setFormError('');
                          }}
                          className="w-full px-3.5 py-2.5 rounded-xl bg-[#050a18] border border-cyan-500/40 text-white font-mono text-xs sm:text-sm uppercase focus:outline-none focus:border-cyan-400 transition"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {formError && (
                <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/40 text-rose-300 text-xs font-semibold">
                  {formError}
                </div>
              )}

              {/* PAYOUT BREAKDOWN CARD (Same blue card style as DepositModal) */}
              <div className="bg-[#071533] border border-blue-900/40 rounded-2xl p-3.5 space-y-1.5 text-xs">
                <div className="flex justify-between text-slate-300">
                  <span>Requested Amount</span>
                  <span className="font-mono font-bold text-white tabular-nums">
                    ₹{reqAmountNum.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} INR
                  </span>
                </div>

                <div className="flex justify-between text-slate-400">
                  <span>Processing Fee ({activeFeePercent}%)</span>
                  <span className="font-mono text-cyan-300 tabular-nums">
                    -₹{adminFeeAmt.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} INR
                  </span>
                </div>

                <div className="flex justify-between items-center font-black border-t border-blue-950/80 pt-2 text-xs sm:text-sm">
                  <span className="text-white">Net Bank / UPI Payout</span>
                  <span className="font-mono text-[#2dd4bf] tabular-nums">
                    ₹{netPayout.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} INR
                  </span>
                </div>
              </div>
            </form>
          )}

          {/* VIEW B: WITHDRAW HISTORY (Exact match to DepositModal History view) */}
          {currentView === 'history' && (
            <div className="space-y-3">
              {userWithdrawals && userWithdrawals.length > 0 ? (
                userWithdrawals.map((w, idx) => (
                  <div
                    key={w.id || idx}
                    className="bg-[#071533] border border-blue-900/40 rounded-2xl p-3.5 space-y-2 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-cyan-500/15 text-cyan-300 flex items-center justify-center font-bold">
                          ↑
                        </div>
                        <div>
                          <div className="font-bold text-white text-xs sm:text-sm tabular-nums">
                            ₹{Number(w.requestedAmount ?? (w as any).amount ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} INR
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono">
                            Net: ₹{Number(w.netAmount ?? w.requestedAmount ?? (w as any).amount ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} · {w.network || 'UPI'}
                          </div>
                        </div>
                      </div>

                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${
                          w.status === 'approved'
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                            : w.status === 'rejected'
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                            : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                        }`}
                      >
                        {w.status}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-blue-950/60 font-mono gap-2">
                      <span className="truncate">{w.targetAddress || 'UPI / Bank Payout'}</span>
                      <span className="shrink-0">
                        {new Date(w.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-12 text-center space-y-2 text-slate-400">
                  <div className="w-12 h-12 rounded-full bg-blue-900/20 border border-blue-800/40 flex items-center justify-center mx-auto text-slate-500">
                    <ArrowUpRight className="w-6 h-6" />
                  </div>
                  <p className="text-xs font-bold text-slate-300">No withdrawal records yet</p>
                  <p className="text-[11px] text-slate-500">Your withdrawal history will appear here once submitted.</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* 3. BOTTOM FLOATING ACTION BAR (Exact match to DepositModal) */}
        {currentView === 'main' && (
          <div className="p-3.5 sm:p-4 bg-[#060e22] border-t border-blue-950/80 flex items-center justify-between gap-3 shrink-0">
            <div className="flex flex-col justify-center min-w-0">
              <span className="text-[11px] text-slate-400 font-medium">Payout Method:</span>
              <span className="text-sm font-black text-white tracking-wide truncate">
                {payoutMethod === 'UPI' ? 'UPI Instant' : 'Bank IMPS'}
              </span>
            </div>

            <button
              type="submit"
              form="withdraw-form"
              disabled={!canSubmit}
              className="px-5 sm:px-6 py-3 rounded-xl bg-gradient-to-r from-[#2dd4bf] to-[#06b6d4] hover:brightness-105 active:scale-95 disabled:opacity-45 disabled:cursor-not-allowed text-[#052723] font-black text-xs sm:text-sm tracking-wide shadow-lg shadow-teal-500/25 transition-all whitespace-nowrap shrink-0 tabular-nums"
            >
              {submitting
                ? 'Processing...'
                : currentAvailableBalance < reqAmountNum
                ? 'Low Balance'
                : `Withdraw ₹${netPayout.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
