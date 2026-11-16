import React, { useState } from 'react';
import {
  ArrowDownLeft,
  ArrowUpRight,
  Copy,
  Check,
  RefreshCw,
  Wallet,
  Clock,
  History,
  FileText,
  ChevronRight,
  Bell,
  Gift,
  BarChart2,
  Headphones,
  Lock,
  ArrowLeft,
  X,
  Shield,
  Star,
  Award,
  Sparkles,
  ExternalLink,
  Coins,
  Send,
  MessageSquare
} from 'lucide-react';
import { User, DepositRequest, WithdrawalRequest, SystemSettings, Transaction } from '../types';
import { DepositModal } from './DepositModal';
import { WithdrawModal } from './WithdrawModal';

interface FinanceViewProps {
  user: User;
  settings: SystemSettings;
  depositRequests: DepositRequest[];
  withdrawalRequests: WithdrawalRequest[];
  transactions?: Transaction[];
  onDepositSubmit: (amount: number, network: string, txHash: string) => Promise<void>;
  onWithdrawSubmit: (amount: number, targetAddress: string, network: string, walletType?: 'mlm' | 'winning') => Promise<void>;
  onNavigateToPackages?: () => void;
  onSelectTab?: (tab: string) => void;
  onRefreshUser?: () => Promise<void>;
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
  onSelectTab,
  onRefreshUser,
}) => {
  // Active Modal States
  const [activeModal, setActiveModal] = useState<
    'deposit' | 'withdraw' | 'gameHistory' | 'transactionHistory' | 'depositHistory' | 'withdrawHistory' | 'arWallet' | 'vip' | 'notifications' | 'gifts' | 'gameStats' | 'support' | null
  >(null);

  // Copy Toast State
  const [showCopyToast, setShowCopyToast] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Gift Code State
  const [giftCode, setGiftCode] = useState('');
  const [giftRedeemed, setGiftRedeemed] = useState(false);

  // Customer Support Chat State
  const [supportMessage, setSupportMessage] = useState('');
  const [chatMessages, setChatMessages] = useState<Array<{ sender: 'user' | 'bot'; text: string; time: string }>>([
    {
      sender: 'bot',
      text: 'Hello! Welcome to SportX 24/7 VIP Support. How may I assist you with your wallet, deposits, or game queries today?',
      time: 'Just now'
    }
  ]);

  // Derived user values (100% Pure INR Ledger)
  const totalBalance = (user?.balance || 0) + (user?.winningBalance || 0) + (user?.depositBalance || 0);
  const totalBalanceInr = totalBalance.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  // Numeric UID generation (matching reference look)
  const numericUid = user?.id
    ? (Math.abs(user.id.split('').reduce((acc, char) => (acc << 5) - acc + char.charCodeAt(0), 2955347)) % 9000000 + 1000000).toString()
    : '2955347';

  const memberName = user?.name || user?.nodeId || 'MEMBERNNGDKKU4';

  const triggerCopyToast = (textToCopy: string) => {
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(textToCopy);
    }
    setShowCopyToast(true);
    setTimeout(() => {
      setShowCopyToast(false);
    }, 1500);
  };

  const handleRefreshBalance = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
    }, 600);
  };

  const handleSendSupportMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!supportMessage.trim()) return;
    const userMsg = supportMessage.trim();
    const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    setChatMessages((prev) => [...prev, { sender: 'user', text: userMsg, time: now }]);
    setSupportMessage('');

    setTimeout(() => {
      setChatMessages((prev) => [
        ...prev,
        {
          sender: 'bot',
          text: `Thank you for reaching out! A VIP Support agent has received your request regarding: "${userMsg}". Your ticket ID is #SPORTX-${Math.floor(100000 + Math.random() * 900000)}. Average response time is under 2 minutes.`,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    }, 800);
  };

  const userDeposits = depositRequests.filter((d) => d.userId === user?.id);
  const userWithdrawals = withdrawalRequests.filter((w) => w.userId === user?.id);

  // Default game history mock samples if none exist yet
  const gameHistoryRecords = [
    { id: 'GH-9812', game: 'Color WinGo 30s', bet: '₹100.00', result: 'Green 7', outcome: 'Win', payout: '+₹196.00', time: '10 mins ago' },
    { id: 'GH-9811', game: 'Aviator Crash', bet: '₹50.00', result: '2.45x Cashout', outcome: 'Win', payout: '+₹122.50', time: '25 mins ago' },
    { id: 'GH-9810', game: 'Dragon vs Tiger', bet: '₹200.00', result: 'Dragon (K vs 4)', outcome: 'Win', payout: '+₹390.00', time: '1 hour ago' },
    { id: 'GH-9809', game: 'Cricket Fantasy 11', bet: '₹49.00', result: 'IPL Mega Contest Rank #12', outcome: 'Win', payout: '+₹250.00', time: '3 hours ago' },
    { id: 'GH-9808', game: 'Aviator Crash', bet: '₹100.00', result: 'Flew Away at 1.18x', outcome: 'Loss', payout: '-₹100.00', time: '5 hours ago' },
  ];

  return (
    <div className="relative min-h-screen bg-[#070d1e] text-slate-100 font-sans pb-28 pt-2">
      <div className="max-w-md mx-auto px-4 space-y-4">

        {/* TOP APP HEADER */}
        <div className="flex items-center justify-between py-2 text-slate-300">
          <button
            onClick={() => onNavigateToPackages?.() || onSelectTab?.('dashboard')}
            className="p-1.5 rounded-full hover:bg-slate-800/60 transition text-slate-400 hover:text-white"
            title="Go Back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="text-center font-bold tracking-wide text-white text-base">
            Wallet Center
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveModal('support')}
              className="p-1.5 rounded-full hover:bg-slate-800/60 text-slate-400 hover:text-cyan-400 transition"
              title="Support & Assistance"
            >
              <Headphones className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* USER PROFILE SECTION (Matches Reference Image) */}
        <div className="flex items-center gap-3.5 pt-1">
          {/* Avatar with subtle glow ring */}
          <div className="relative shrink-0">
            <img
              src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80"
              alt="User Avatar"
              className="w-14 h-14 rounded-full object-cover border-2 border-cyan-400/40 shadow-[0_0_15px_rgba(6,182,212,0.3)]"
            />
          </div>

          {/* User Details */}
          <div className="flex-1 min-w-0 space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm tracking-wide text-white truncate max-w-[140px] xs:max-w-[180px]">
                {memberName}
              </span>
              {/* VIP Badge */}
              <div
                onClick={() => (onSelectTab ? onSelectTab('vip') : setActiveModal('vip'))}
                className="cursor-pointer inline-flex items-center gap-1 bg-gradient-to-r from-slate-300 via-slate-100 to-slate-400 text-slate-900 px-2 py-0.5 rounded-full text-[10px] font-black uppercase shadow-sm tracking-wider hover:opacity-90 transition"
              >
                <Star className="w-3 h-3 fill-slate-900" />
                <span>VIP0</span>
              </div>
            </div>

            {/* UID Badge (Orange/Amber with Copy Button) */}
            <div className="flex items-center">
              <button
                onClick={() => triggerCopyToast(numericUid)}
                className="inline-flex items-center gap-1.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white px-2.5 py-0.5 rounded-md text-[11px] font-mono font-bold shadow-sm active:scale-95 transition"
                title="Click to Copy UID"
              >
                <span>UID</span>
                <span className="opacity-70">|</span>
                <span>{numericUid}</span>
                <Copy className="w-3 h-3 ml-0.5 opacity-90" />
              </button>
            </div>

            {/* Last login info */}
            <div className="text-[10px] text-slate-400 font-mono tracking-tight">
              Last login: 2025-05-27 05:48:25
            </div>
          </div>
        </div>

        {/* TOTAL BALANCE CARD (Matches Reference Image) */}
        <div className="rounded-2xl bg-gradient-to-br from-[#0e1d44] via-[#0c183a] to-[#09122c] border border-cyan-500/25 p-4 shadow-[0_10px_30px_rgba(0,0,0,0.6)] space-y-4">
          <div className="space-y-1">
            <div className="text-xs text-slate-300 font-medium">
              Total balance
            </div>
            <div className="flex items-center gap-2.5">
              <span className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                ₹{totalBalanceInr}
              </span>
              <button
                onClick={handleRefreshBalance}
                className="text-slate-400 hover:text-cyan-300 p-1 transition"
                title="Refresh Balance"
              >
                <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-cyan-400' : ''}`} />
              </button>
            </div>
            <div className="text-[10px] text-cyan-300 font-mono">
              Deposit: ₹{(user?.depositBalance || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} • Winning: ₹{(user?.winningBalance || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} • Agency: ₹{(user?.balance || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </div>

          {/* 4 Quick Action Buttons (ARWallet, Deposit, Withdraw, VIP) */}
          <div className="grid grid-cols-4 gap-2 pt-2 border-t border-slate-700/40">
            {/* 1. ARWallet */}
            <button
              onClick={() => setActiveModal('arWallet')}
              className="flex flex-col items-center justify-center gap-1.5 p-2 rounded-xl hover:bg-white/5 transition group"
            >
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-rose-500 to-red-600 flex items-center justify-center text-white shadow-[0_4px_12px_rgba(244,63,94,0.35)] group-hover:scale-105 transition transform">
                <Wallet className="w-5 h-5" />
              </div>
              <span className="text-[11px] font-semibold text-slate-200">
                ARWallet
              </span>
            </button>

            {/* 2. Deposit */}
            <button
              onClick={() => setActiveModal('deposit')}
              className="flex flex-col items-center justify-center gap-1.5 p-2 rounded-xl hover:bg-white/5 transition group"
            >
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white shadow-[0_4px_12px_rgba(245,158,11,0.35)] group-hover:scale-105 transition transform">
                <Coins className="w-5 h-5" />
              </div>
              <span className="text-[11px] font-semibold text-slate-200">
                Deposit
              </span>
            </button>

            {/* 3. Withdraw */}
            <button
              onClick={() => setActiveModal('withdraw')}
              className="flex flex-col items-center justify-center gap-1.5 p-2 rounded-xl hover:bg-white/5 transition group"
            >
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-sky-500 to-blue-600 flex items-center justify-center text-white shadow-[0_4px_12px_rgba(14,165,233,0.35)] group-hover:scale-105 transition transform">
                <ArrowUpRight className="w-5 h-5 stroke-[2.5]" />
              </div>
              <span className="text-[11px] font-semibold text-slate-200">
                Withdraw
              </span>
            </button>

            {/* 4. VIP */}
            <button
              onClick={() => (onSelectTab ? onSelectTab('vip') : setActiveModal('vip'))}
              className="flex flex-col items-center justify-center gap-1.5 p-2 rounded-xl hover:bg-white/5 transition group"
            >
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white shadow-[0_4px_12px_rgba(16,185,129,0.35)] group-hover:scale-105 transition transform">
                <Award className="w-5 h-5" />
              </div>
              <span className="text-[11px] font-semibold text-slate-200">
                VIP
              </span>
            </button>
          </div>
        </div>

        {/* 2x2 GRID SECTION (Matches Reference Image) */}
        <div className="grid grid-cols-2 gap-3">
          {/* Card 1: Game History */}
          <div
            onClick={() => setActiveModal('gameHistory')}
            className="cursor-pointer bg-[#0c1630] hover:bg-[#101d3f] border border-cyan-500/15 rounded-2xl p-3.5 flex items-center gap-3 transition active:scale-98 shadow-sm group"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white shrink-0 shadow-md group-hover:scale-105 transition transform">
              <FileText className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-bold text-white leading-tight">
                Game History
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5 truncate">
                My game history
              </div>
            </div>
          </div>

          {/* Card 2: Transaction */}
          <div
            onClick={() => setActiveModal('transactionHistory')}
            className="cursor-pointer bg-[#0c1630] hover:bg-[#101d3f] border border-cyan-500/15 rounded-2xl p-3.5 flex items-center gap-3 transition active:scale-98 shadow-sm group"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center text-white shrink-0 shadow-md group-hover:scale-105 transition transform">
              <History className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-bold text-white leading-tight">
                Transaction
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5 truncate">
                My transaction history
              </div>
            </div>
          </div>

          {/* Card 3: Deposit History */}
          <div
            onClick={() => setActiveModal('depositHistory')}
            className="cursor-pointer bg-[#0c1630] hover:bg-[#101d3f] border border-cyan-500/15 rounded-2xl p-3.5 flex items-center gap-3 transition active:scale-98 shadow-sm group"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-500 to-pink-600 flex items-center justify-center text-white shrink-0 shadow-md group-hover:scale-105 transition transform">
              <ArrowDownLeft className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-bold text-white leading-tight">
                Deposit
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5 truncate">
                My deposit history
              </div>
            </div>
          </div>

          {/* Card 4: Withdraw History */}
          <div
            onClick={() => setActiveModal('withdrawHistory')}
            className="cursor-pointer bg-[#0c1630] hover:bg-[#101d3f] border border-cyan-500/15 rounded-2xl p-3.5 flex items-center gap-3 transition active:scale-98 shadow-sm group"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-600 to-yellow-600 flex items-center justify-center text-white shrink-0 shadow-md group-hover:scale-105 transition transform">
              <Check className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-bold text-white leading-tight">
                Withdraw
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5 truncate">
                My withdraw history
              </div>
            </div>
          </div>
        </div>

        {/* LIST ITEMS SECTION (Matches Reference Image) */}
        <div className="bg-[#0b142c] border border-cyan-500/15 rounded-2xl divide-y divide-slate-800/80 overflow-hidden shadow-sm">
          {/* 1. Notification */}
          <div
            onClick={() => setActiveModal('notifications')}
            className="cursor-pointer px-4 py-3.5 flex items-center justify-between hover:bg-slate-800/40 transition"
          >
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 rounded-lg bg-cyan-500/10 text-cyan-400 flex items-center justify-center">
                <Bell className="w-4 h-4" />
              </div>
              <span className="text-xs font-semibold text-slate-200">
                Notification
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm">
                10
              </span>
              <ChevronRight className="w-4 h-4 text-slate-500" />
            </div>
          </div>

          {/* 2. Gifts */}
          <div
            onClick={() => setActiveModal('gifts')}
            className="cursor-pointer px-4 py-3.5 flex items-center justify-between hover:bg-slate-800/40 transition"
          >
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 rounded-lg bg-cyan-500/10 text-cyan-400 flex items-center justify-center">
                <Gift className="w-4 h-4" />
              </div>
              <span className="text-xs font-semibold text-slate-200">
                Gifts
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded">
                Redeem Code
              </span>
              <ChevronRight className="w-4 h-4 text-slate-500" />
            </div>
          </div>

          {/* 3. Game statistics */}
          <div
            onClick={() => setActiveModal('gameStats')}
            className="cursor-pointer px-4 py-3.5 flex items-center justify-between hover:bg-slate-800/40 transition"
          >
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 rounded-lg bg-cyan-500/10 text-cyan-400 flex items-center justify-center">
                <BarChart2 className="w-4 h-4" />
              </div>
              <span className="text-xs font-semibold text-slate-200">
                Game statistics
              </span>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-500" />
          </div>

          {/* 4. Customer Service */}
          <div
            onClick={() => setActiveModal('support')}
            className="cursor-pointer px-4 py-3.5 flex items-center justify-between hover:bg-slate-800/40 transition"
          >
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 rounded-lg bg-cyan-500/10 text-cyan-400 flex items-center justify-center">
                <Headphones className="w-4 h-4" />
              </div>
              <span className="text-xs font-semibold text-slate-200">
                Customer Support 24/7
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-cyan-400 font-bold">
                Online
              </span>
              <ChevronRight className="w-4 h-4 text-slate-500" />
            </div>
          </div>
        </div>

      </div>

      {/* FLOATING CUSTOMER SERVICE ICON (Exact mint-green circle with bot face from screenshot) */}
      <button
        onClick={() => setActiveModal('support')}
        className="fixed bottom-20 right-4 z-40 w-12 h-12 rounded-full bg-gradient-to-tr from-[#34d399] to-[#6ee7b7] text-slate-900 flex items-center justify-center shadow-[0_4px_20px_rgba(52,211,153,0.5)] border-2 border-white/80 active:scale-95 transition transform hover:scale-105"
        title="Live Support Chat"
      >
        <div className="relative">
          <MessageSquare className="w-6 h-6 stroke-[2.5]" />
          <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-700 animate-ping" />
        </div>
      </button>

      {/* CENTERED FLOATING TOAST: "Copy successful" (Matches Reference Screenshot) */}
      {showCopyToast && (
        <div className="fixed inset-0 z-50 pointer-events-none flex items-center justify-center p-4">
          <div className="bg-[#050914]/95 backdrop-blur-md border border-cyan-500/30 rounded-2xl px-7 py-5 shadow-[0_15px_40px_rgba(0,0,0,0.85)] flex flex-col items-center gap-2 text-white animate-in zoom-in-95 duration-150">
            <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white">
              <Check className="w-6 h-6 stroke-[3]" />
            </div>
            <div className="text-xs font-bold text-center leading-tight">
              Copy<br />successful
            </div>
          </div>
        </div>
      )}

      {/* MODAL 1: DEPOSIT MODAL (Exact match to reference image) */}
      <DepositModal
        isOpen={activeModal === 'deposit'}
        onClose={() => setActiveModal(null)}
        settings={settings}
        onSubmitDeposit={onDepositSubmit}
        user={user}
        depositRequests={userDeposits}
        onRefreshUser={onRefreshUser}
      />

      {/* MODAL 2: WITHDRAW MODAL (Unified color theme with DepositModal) */}
      <WithdrawModal
        isOpen={activeModal === 'withdraw'}
        onClose={() => setActiveModal(null)}
        user={user}
        settings={settings}
        transactions={transactions}
        withdrawalRequests={userWithdrawals}
        onSubmitWithdraw={onWithdrawSubmit}
        onRefreshUser={onRefreshUser}
      />

      {/* MODAL 3: GAME HISTORY */}
      {activeModal === 'gameHistory' && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-[#091124] border border-cyan-500/30 w-full max-w-md rounded-t-3xl sm:rounded-2xl p-5 space-y-4 max-h-[85vh] overflow-y-auto animate-in slide-in-from-bottom duration-200">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-400" />
                <h3 className="font-bold text-white text-sm">Game History Records</h3>
              </div>
              <button
                onClick={() => setActiveModal(null)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2.5">
              {gameHistoryRecords.map((item) => (
                <div
                  key={item.id}
                  className="bg-[#060b17] border border-slate-800/80 rounded-xl p-3 flex items-center justify-between font-mono text-xs"
                >
                  <div className="space-y-0.5">
                    <div className="font-bold text-white flex items-center gap-2">
                      <span>{item.game}</span>
                      <span className="text-[10px] text-slate-500">#{item.id}</span>
                    </div>
                    <div className="text-[11px] text-slate-400">
                      Bet: <strong className="text-slate-200">{item.bet}</strong> • {item.result}
                    </div>
                    <div className="text-[10px] text-slate-500">{item.time}</div>
                  </div>
                  <div className="text-right">
                    <div className={`font-bold ${item.outcome === 'Win' ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {item.payout}
                    </div>
                    <span className={`inline-block px-1.5 py-0.5 rounded text-[9px] font-extrabold uppercase mt-0.5 ${
                      item.outcome === 'Win' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
                    }`}>
                      {item.outcome}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: TRANSACTION HISTORY */}
      {activeModal === 'transactionHistory' && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-[#091124] border border-cyan-500/30 w-full max-w-md rounded-t-3xl sm:rounded-2xl p-5 space-y-4 max-h-[85vh] overflow-y-auto animate-in slide-in-from-bottom duration-200">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <History className="w-5 h-5 text-emerald-400" />
                <h3 className="font-bold text-white text-sm">Transaction Ledger</h3>
              </div>
              <button
                onClick={() => setActiveModal(null)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2 font-mono text-xs">
              {transactions.length === 0 ? (
                <div className="p-8 text-center text-slate-500">
                  No account transactions recorded yet.
                </div>
              ) : (
                transactions.slice(0, 10).map((t) => (
                  <div
                    key={t.id}
                    className="bg-[#060b17] border border-slate-800 p-3 rounded-xl flex items-center justify-between"
                  >
                    <div>
                      <div className="font-bold text-white capitalize">{t.type.replace(/_/g, ' ')}</div>
                      <div className="text-[10px] text-slate-400 truncate max-w-[200px]">{t.notes || (t as any).description || 'Transaction'}</div>
                      <div className="text-[9px] text-slate-500">{new Date(t.createdAt || (t as any).timestamp || Date.now()).toLocaleDateString()}</div>
                    </div>
                    <div className="text-right">
                      <div className={`font-bold ${t.amount >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {t.amount >= 0 ? `+₹${Number(t.amount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : `-₹${Math.abs(t.amount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                      </div>
                      <span className="text-[9px] bg-slate-800 text-emerald-400 px-1.5 py-0.5 rounded font-bold">INR</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL 5: DEPOSIT HISTORY */}
      {activeModal === 'depositHistory' && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-[#091124] border border-cyan-500/30 w-full max-w-md rounded-t-3xl sm:rounded-2xl p-5 space-y-4 max-h-[85vh] overflow-y-auto animate-in slide-in-from-bottom duration-200">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <ArrowDownLeft className="w-5 h-5 text-rose-400" />
                <h3 className="font-bold text-white text-sm">My Deposit History</h3>
              </div>
              <button
                onClick={() => setActiveModal(null)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2 font-mono text-xs">
              {userDeposits.length === 0 ? (
                <div className="p-8 text-center text-slate-500">
                  No deposits recorded yet.
                </div>
              ) : (
                userDeposits.map((dep) => (
                  <div
                    key={dep.id}
                    className="bg-[#060b17] border border-slate-800 p-3 rounded-xl flex items-center justify-between"
                  >
                    <div>
                      <div className="font-bold text-emerald-400">₹{Number(dep.inrAmount || dep.amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} INR</div>
                      <div className="text-[10px] text-slate-400">{dep.network || 'UPI-QR'}</div>
                      <div className="text-[9px] text-slate-500 truncate max-w-[150px]">{dep.txHash}</div>
                    </div>
                    <div className="text-right">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        dep.status === 'approved'
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : dep.status === 'pending'
                          ? 'bg-amber-500/20 text-amber-400'
                          : 'bg-rose-500/20 text-rose-400'
                      }`}>
                        {dep.status}
                      </span>
                      <div className="text-[9px] text-slate-500 mt-1">{dep.createdAt?.split('T')[0]}</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL 6: WITHDRAW HISTORY */}
      {activeModal === 'withdrawHistory' && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-[#091124] border border-cyan-500/30 w-full max-w-md rounded-t-3xl sm:rounded-2xl p-5 space-y-4 max-h-[85vh] overflow-y-auto animate-in slide-in-from-bottom duration-200">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Check className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold text-white text-sm">My Withdraw History</h3>
              </div>
              <button
                onClick={() => setActiveModal(null)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2 font-mono text-xs">
              {userWithdrawals.length === 0 ? (
                <div className="p-8 text-center text-slate-500">
                  No withdrawals recorded yet.
                </div>
              ) : (
                userWithdrawals.map((w) => (
                  <div
                    key={w.id}
                    className="bg-[#060b17] border border-slate-800 p-3 rounded-xl flex items-center justify-between"
                  >
                    <div>
                      <div className="font-bold text-white">₹{Number(w.requestedAmount ?? (w as any).amount ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} INR</div>
                      <div className="text-[10px] text-slate-400">{w.network || 'UPI'} • Net: ₹{Number(w.netAmount ?? w.requestedAmount ?? (w as any).amount ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                      <div className="text-[9px] text-slate-500 truncate max-w-[180px]">{w.targetAddress}</div>
                    </div>
                    <div className="text-right">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        w.status === 'approved'
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : w.status === 'pending'
                          ? 'bg-amber-500/20 text-amber-400'
                          : 'bg-rose-500/20 text-rose-400'
                      }`}>
                        {w.status}
                      </span>
                      <div className="text-[9px] text-slate-500 mt-1">{w.createdAt?.split('T')[0]}</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL 7: ARWALLET FAST TRANSFER */}
      {activeModal === 'arWallet' && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-[#091124] border border-cyan-500/30 w-full max-w-md rounded-t-3xl sm:rounded-2xl p-5 space-y-4 max-h-[85vh] overflow-y-auto animate-in slide-in-from-bottom duration-200">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Wallet className="w-5 h-5 text-rose-400" />
                <h3 className="font-bold text-white text-sm">ARWallet Quick Transfer</h3>
              </div>
              <button
                onClick={() => setActiveModal(null)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-[#060b17] border border-slate-800 p-3 rounded-xl space-y-2 text-xs">
              <div className="flex justify-between items-center text-slate-300">
                <span>Gaming Deposit Wallet:</span>
                <span className="font-bold text-cyan-300 font-mono">₹{(user?.depositBalance || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} INR</span>
              </div>
              <div className="flex justify-between items-center text-slate-300">
                <span>Winning Wallet:</span>
                <span className="font-bold text-amber-300 font-mono">₹{(user?.winningBalance || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} INR</span>
              </div>
              <div className="flex justify-between items-center text-slate-300">
                <span>Agency Wallet:</span>
                <span className="font-bold text-emerald-300 font-mono">₹{(user?.balance || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} INR</span>
              </div>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              ARWallet enables 0-fee zero-delay internal transfers across your SportX balance accounts and peer-to-peer ID transfers.
            </p>

            <button
              onClick={() => {
                triggerCopyToast(numericUid);
                setActiveModal(null);
              }}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-rose-500 to-red-600 text-white font-black text-xs uppercase tracking-wide transition shadow-md"
            >
              Copy My ARWallet ID
            </button>
          </div>
        </div>
      )}

      {/* MODAL 8: VIP PRIVILEGES */}
      {activeModal === 'vip' && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-[#091124] border border-cyan-500/30 w-full max-w-md rounded-t-3xl sm:rounded-2xl p-5 space-y-4 max-h-[85vh] overflow-y-auto animate-in slide-in-from-bottom duration-200">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Award className="w-5 h-5 text-emerald-400" />
                <h3 className="font-bold text-white text-sm">VIP Club Privileges</h3>
              </div>
              <button
                onClick={() => setActiveModal(null)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-gradient-to-r from-slate-900 to-slate-800 border border-slate-700 p-4 rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white">Current Tier: VIP0</span>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded font-black">Active</span>
              </div>
              <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden">
                <div className="bg-gradient-to-r from-emerald-400 to-cyan-400 h-full w-[25%]" />
              </div>
              <div className="flex justify-between text-[10px] text-slate-400">
                <span>Exp: ₹250.00</span>
                <span>Next Tier: VIP1 (₹1,000)</span>
              </div>
            </div>

            <div className="space-y-2 text-xs">
              <div className="bg-[#060b17] border border-slate-800 p-3 rounded-xl flex items-center justify-between">
                <span className="text-slate-300">Daily Sign-in Bonus</span>
                <span className="text-emerald-400 font-bold font-mono">+₹5.00</span>
              </div>
              <div className="bg-[#060b17] border border-slate-800 p-3 rounded-xl flex items-center justify-between">
                <span className="text-slate-300">Level-up Reward</span>
                <span className="text-emerald-400 font-bold font-mono">₹50.00</span>
              </div>
              <div className="bg-[#060b17] border border-slate-800 p-3 rounded-xl flex items-center justify-between">
                <span className="text-slate-300">Monthly VIP Gift</span>
                <span className="text-cyan-400 font-bold font-mono">₹200.00</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 9: NOTIFICATIONS */}
      {activeModal === 'notifications' && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-[#091124] border border-cyan-500/30 w-full max-w-md rounded-t-3xl sm:rounded-2xl p-5 space-y-4 max-h-[85vh] overflow-y-auto animate-in slide-in-from-bottom duration-200">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Bell className="w-5 h-5 text-cyan-400" />
                <h3 className="font-bold text-white text-sm">System Notifications</h3>
              </div>
              <button
                onClick={() => setActiveModal(null)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2.5">
              {[
                { title: 'Welcome Bonus Credited', desc: 'Your account has received a welcome reward of ₹36.13.', time: 'Today' },
                { title: 'Dream11 Cricket Mega League', desc: 'Join the ₹10 Lakhs prize pool IPL fantasy match now!', time: 'Yesterday' },
                { title: 'Aviator Super Multiplier Event', desc: 'Win up to 100x on Aviator rounds today with enhanced odds.', time: '2 days ago' },
                { title: 'Security Alert', desc: 'Your node login was successful from IP address.', time: '3 days ago' },
              ].map((n, i) => (
                <div key={i} className="bg-[#060b17] border border-slate-800 p-3 rounded-xl space-y-1">
                  <div className="text-xs font-bold text-white flex justify-between">
                    <span>{n.title}</span>
                    <span className="text-[10px] text-slate-500 font-normal">{n.time}</span>
                  </div>
                  <div className="text-[11px] text-slate-400">{n.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* MODAL 10: GIFTS REDEEM */}
      {activeModal === 'gifts' && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-[#091124] border border-cyan-500/30 w-full max-w-md rounded-t-3xl sm:rounded-2xl p-5 space-y-4 max-h-[85vh] overflow-y-auto animate-in slide-in-from-bottom duration-200">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Gift className="w-5 h-5 text-emerald-400" />
                <h3 className="font-bold text-white text-sm">Redeem Gift Code</h3>
              </div>
              <button
                onClick={() => setActiveModal(null)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <p className="text-xs text-slate-400">
                Please enter the redemption code provided by SportX official channels or telegram.
              </p>

              <input
                type="text"
                placeholder="Enter gift code here (e.g. SPORTX2026)"
                value={giftCode}
                onChange={(e) => setGiftCode(e.target.value)}
                className="w-full bg-[#060b17] border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white uppercase tracking-wider font-mono focus:outline-none focus:border-cyan-500"
              />

              {giftRedeemed && (
                <div className="bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 p-3 rounded-xl text-xs flex items-center gap-2">
                  <Check className="w-4 h-4 shrink-0" />
                  <span>Success! ₹100.00 Gift bonus credited to your wallet.</span>
                </div>
              )}

              <button
                type="button"
                onClick={() => {
                  if (giftCode.trim().length > 3) {
                    setGiftRedeemed(true);
                  }
                }}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 text-slate-950 font-black text-xs uppercase tracking-wide transition shadow-lg"
              >
                Redeem Gift Bonus
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 11: GAME STATISTICS */}
      {activeModal === 'gameStats' && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-[#091124] border border-cyan-500/30 w-full max-w-md rounded-t-3xl sm:rounded-2xl p-5 space-y-4 max-h-[85vh] overflow-y-auto animate-in slide-in-from-bottom duration-200">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <BarChart2 className="w-5 h-5 text-cyan-400" />
                <h3 className="font-bold text-white text-sm">Game Performance Stats</h3>
              </div>
              <button
                onClick={() => setActiveModal(null)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-center">
              <div className="bg-[#060b17] border border-slate-800 p-3 rounded-xl">
                <div className="text-[10px] text-slate-400 uppercase font-semibold">Total Bets Placed</div>
                <div className="text-lg font-black text-cyan-300 font-mono mt-1">42</div>
              </div>
              <div className="bg-[#060b17] border border-slate-800 p-3 rounded-xl">
                <div className="text-[10px] text-slate-400 uppercase font-semibold">Win Rate</div>
                <div className="text-lg font-black text-emerald-400 font-mono mt-1">68.5%</div>
              </div>
              <div className="bg-[#060b17] border border-slate-800 p-3 rounded-xl">
                <div className="text-[10px] text-slate-400 uppercase font-semibold">Total Won</div>
                <div className="text-lg font-black text-amber-300 font-mono mt-1">₹4,890.00</div>
              </div>
              <div className="bg-[#060b17] border border-slate-800 p-3 rounded-xl">
                <div className="text-[10px] text-slate-400 uppercase font-semibold">Favorite Game</div>
                <div className="text-sm font-bold text-white mt-1">Aviator Crash</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 12: 24/7 CUSTOMER SUPPORT CHAT */}
      {activeModal === 'support' && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-[#091124] border border-cyan-500/30 w-full max-w-md rounded-t-3xl sm:rounded-2xl p-5 space-y-4 max-h-[85vh] flex flex-col animate-in slide-in-from-bottom duration-200">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                  <Headphones className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-sm">SportX 24/7 VIP Support</h3>
                  <span className="text-[10px] text-emerald-400 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Agent Online
                  </span>
                </div>
              </div>
              <button
                onClick={() => setActiveModal(null)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Chat Body */}
            <div className="flex-1 space-y-3 overflow-y-auto max-h-60 p-2 bg-[#060b17] rounded-xl border border-slate-800/80">
              {chatMessages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-3.5 py-2 text-xs leading-relaxed ${
                      msg.sender === 'user'
                        ? 'bg-cyan-600 text-white rounded-br-none'
                        : 'bg-[#0e1b38] text-slate-200 border border-cyan-500/20 rounded-bl-none'
                    }`}
                  >
                    {msg.text}
                  </div>
                  <span className="text-[9px] text-slate-500 mt-0.5 px-1">{msg.time}</span>
                </div>
              ))}
            </div>

            {/* Input Bar */}
            <form onSubmit={handleSendSupportMessage} className="flex gap-2">
              <input
                type="text"
                placeholder="Ask about deposits, cashout, or games..."
                value={supportMessage}
                onChange={(e) => setSupportMessage(e.target.value)}
                className="flex-1 bg-[#060b17] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
              />
              <button
                type="submit"
                className="px-3.5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold transition flex items-center justify-center"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
