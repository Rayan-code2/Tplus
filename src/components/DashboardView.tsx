import React, { useState } from 'react';
import {
  Wallet,
  ArrowUpRight,
  ArrowDownLeft,
  Zap,
  TrendingUp,
  Users,
  Copy,
  Check,
  Sparkles,
  Clock,
  Trophy,
  Dices,
  Flame,
  Share2,
  Crown,
} from 'lucide-react';
import { User, Transaction, SystemSettings } from '../types';

interface DashboardViewProps {
  user: User;
  settings: SystemSettings;
  transactions: Transaction[];
  onBuyPackage?: (pkgId: string) => Promise<void>;
  onClaimRoi?: () => Promise<void>;
  onOpenDeposit: () => void;
  onOpenWithdraw: () => void;
  onSelectTab?: (tab: string) => void;
  onDailyCheckin?: () => Promise<void>;
  onOpenTournament?: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  user,
  settings,
  transactions,
  onOpenDeposit,
  onOpenWithdraw,
  onSelectTab,
  onOpenTournament,
}) => {
  const [copiedRef, setCopiedRef] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  const inviteCode = user?.nodeId || 'NX-ROOT01';
  const referralUrl = `${window.location.origin}?ref=${inviteCode}`;

  const handleCopyReferral = () => {
    navigator.clipboard.writeText(referralUrl);
    setCopiedRef(true);
    setTimeout(() => setCopiedRef(false), 2000);
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(inviteCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleShareWhatsApp = () => {
    const text = encodeURIComponent(
      `🎮 Play & Win USDT on TetherPlus Gaming!\nColor Prediction 9X, Dragon vs Tiger, Aviator, Lucky Draw & Daily Tournament!\n\n🎁 Referral Code: *${inviteCode}*\n🔗 Join: ${referralUrl}`
    );
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
  };

  const handleShareTelegram = () => {
    const text = encodeURIComponent(
      `🎮 Join TetherPlus Gaming Platform! Play WinGo, Aviator, Dragon vs Tiger!\nInvite Code: ${inviteCode}\nPlay now: ${referralUrl}`
    );
    window.open(`https://t.me/share/url?url=${encodeURIComponent(referralUrl)}&text=${text}`, '_blank');
  };

  const userTransactions = (transactions || []).filter(
    (tx) => tx.userId === user?.id || (user?.nodeId && tx.userNodeId === user.nodeId)
  );

  return (
    <div className="space-y-8 font-mono pb-12">
      {/* Daily Top Bettor Tournament & Live Pot Widget */}
      {settings.dailyTournament?.enabled !== false && (
        <div
          onClick={onOpenTournament}
          className="bg-gradient-to-r from-[#201503] via-[#2d1e05] to-[#120b02] border border-amber-500/50 rounded-2xl p-4 sm:p-5 flex items-center justify-between gap-4 shadow-[0_0_25px_rgba(245,158,11,0.25)] cursor-pointer hover:border-amber-400 transition group"
        >
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="bg-amber-500/20 text-amber-300 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase border border-amber-500/40 flex items-center gap-1">
                <Trophy className="w-3 h-3 text-amber-400" />
                Live 24h Championship
              </span>
              <span className="text-[10px] text-yellow-300 font-mono animate-pulse">● LIVE</span>
            </div>
            <h3 className="text-base sm:text-lg font-black text-white group-hover:text-yellow-300 transition">
              {settings.dailyTournament?.title || 'Daily Top Bettor Tournament'}
            </h3>
            <p className="text-[11px] text-amber-200/80 font-sans">
              Guaranteed Pot ${settings.dailyTournament?.basePot ?? 250}+ USDT | Real-Time Live Leaderboard & Instant Prizes
            </p>
          </div>

          <div className="text-right shrink-0">
            <span className="text-[9px] text-amber-400 font-bold uppercase block">Total Pot</span>
            <div className="text-lg sm:text-xl font-black text-white">
              ${settings.dailyTournament?.basePot ?? 250}+ <span className="text-xs text-amber-400">USDT</span>
            </div>
            <span className="text-[10px] text-amber-300 font-bold group-hover:translate-x-1 inline-flex items-center gap-0.5 transition">
              View Pot →
            </span>
          </div>
        </div>
      )}

      {/* 1. TOP WALLET CARDS OVERVIEW (GAMING & CASHOUT) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Deposit / Gaming Wallet */}
        <div className="bg-gradient-to-br from-[#0a1b2d] to-[#071321] border border-[#0ef]/40 rounded-2xl p-4 relative overflow-hidden shadow-[0_0_20px_rgba(0,238,255,0.15)] group hover:border-[#0ef]/70 transition">
          <div className="absolute top-0 right-0 w-24 h-24 bg-[#0ef]/10 rounded-full blur-2xl group-hover:bg-[#0ef]/20 transition" />
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-slate-300 font-semibold uppercase tracking-wider flex items-center gap-1.5">
              <Wallet className="w-4 h-4 text-[#0ef]" />
              Gaming Balance
            </span>
            <span className="text-[10px] bg-[#0ef]/20 text-[#0ef] border border-[#0ef]/40 px-2 py-0.5 rounded-full font-bold">
              Ready to Bet
            </span>
          </div>
          <div className="text-2xl font-extrabold text-white tracking-tight">
            ${(user.depositBalance || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            <span className="text-xs font-normal text-[#0ef] ml-1">USDT</span>
          </div>
          <p className="text-[10px] text-slate-400 mt-1">
            Deposit wallet used to play WinGo, Dragon vs Tiger, Aviator & Lucky Draw.
          </p>
          <div className="mt-3">
            <button
              onClick={onOpenDeposit}
              className="w-full flex items-center justify-center gap-1 text-xs font-bold py-2 rounded-xl bg-[#0ef]/20 hover:bg-[#0ef]/30 text-[#0ef] border border-[#0ef]/50 transition shadow-[0_0_12px_rgba(0,238,255,0.2)]"
            >
              <ArrowDownLeft className="w-3.5 h-3.5" />
              + Add Deposit Fund
            </button>
          </div>
        </div>

        {/* Game Winning Wallet */}
        <div className="bg-gradient-to-br from-[#1a1205] to-[#2b1c06] border border-amber-500/50 rounded-2xl p-4 relative overflow-hidden shadow-[0_0_25px_rgba(245,158,11,0.2)] group hover:border-amber-400 transition">
          <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/15 rounded-full blur-2xl group-hover:bg-amber-500/30 transition" />
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-amber-300 font-extrabold uppercase tracking-wider flex items-center gap-1.5">
              <Trophy className="w-4 h-4 text-amber-400 animate-pulse" />
              Winning Wallet
            </span>
            <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded-full font-bold">
              Instant Payout
            </span>
          </div>
          <div className="text-2xl font-extrabold text-amber-300 tracking-tight">
            ${(user.winningBalance || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            <span className="text-xs font-normal text-amber-400 ml-1">USDT</span>
          </div>
          <p className="text-[10px] text-amber-200/80 mt-1">
            Game, Lottery & Tournament winnings. Instant blockchain withdrawal!
          </p>
          <div className="mt-3">
            <button
              onClick={onOpenWithdraw}
              className="w-full flex items-center justify-center gap-1 text-xs font-bold py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/60 transition shadow-[0_0_12px_rgba(245,158,11,0.25)]"
            >
              <ArrowUpRight className="w-3.5 h-3.5" />
              Withdraw Winnings
            </button>
          </div>
        </div>

        {/* Total Bet Turnover */}
        <div className="bg-gradient-to-br from-[#0c1829] to-[#080f1a] border border-purple-500/30 rounded-2xl p-4 relative overflow-hidden shadow-[0_0_20px_rgba(168,85,247,0.1)] group hover:border-purple-500/50 transition">
          <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/10 rounded-full blur-2xl group-hover:bg-purple-500/20 transition" />
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-purple-400" />
              Bet Turnover
            </span>
            <span className="text-[10px] bg-purple-500/20 text-purple-300 border border-purple-500/40 px-2 py-0.5 rounded-full font-bold">
              Player Stats
            </span>
          </div>
          <div className="text-2xl font-extrabold text-white tracking-tight">
            ${(user.totalBetTurnover || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            <span className="text-xs font-normal text-purple-400 ml-1">USDT</span>
          </div>
          <p className="text-[10px] text-slate-400 mt-1">
            Total cumulative gaming wager across all games on TetherPlus.
          </p>
        </div>

        {/* Total Lifetime Winnings / Income */}
        <div className="bg-gradient-to-br from-[#0c1829] to-[#080f1a] border border-emerald-500/30 rounded-2xl p-4 relative overflow-hidden shadow-[0_0_20px_rgba(16,185,129,0.1)] group hover:border-emerald-500/50 transition">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl group-hover:bg-emerald-500/20 transition" />
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              Total Payouts
            </span>
            <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded-full font-bold">
              Total Won
            </span>
          </div>
          <div className="text-2xl font-extrabold text-white tracking-tight">
            ${(user.totalEarned || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            <span className="text-xs font-normal text-emerald-400 ml-1">USDT</span>
          </div>
          <p className="text-[10px] text-slate-400 mt-1">
            Total earnings accumulated from all game wins & 5-level referrals.
          </p>
        </div>
      </div>

      {/* 2. 5-LEVEL BET TURNOVER REFERRAL AGENCY PROMO */}
      <div className="bg-gradient-to-r from-[#0d1c2e] via-[#091524] to-[#0c1829] border border-cyan-500/40 rounded-2xl p-6 relative overflow-hidden shadow-[0_0_30px_rgba(6,182,212,0.15)] space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-1.5 bg-cyan-500/10 border border-cyan-500/30 px-3 py-1 rounded-full text-cyan-400 text-xs font-bold uppercase">
              <Sparkles className="w-3.5 h-3.5" />
              5-Level Bet Turnover Referral Program
            </div>
            <h2 className="text-xl font-extrabold text-white">
              Invite Players & Earn <span className="text-cyan-400">Turnover Commission</span> 24/7
            </h2>
            <p className="text-xs text-slate-300 font-sans max-w-2xl leading-relaxed">
              Every time your 5-level team plays in Color Prediction, Dragon vs Tiger, or Aviator, you get paid instant turnover commission automatically!
            </p>
          </div>

          {/* Commission Tier Rates Pill */}
          <div className="bg-[#050a12]/90 border border-cyan-500/30 rounded-2xl p-3 shrink-0">
            <div className="text-[10px] uppercase font-bold text-slate-400 mb-2 text-center">
              5-Level Payout Rates
            </div>
            <div className="flex items-center gap-1.5 text-center text-xs">
              <div className="bg-cyan-500/15 border border-cyan-500/30 px-2 py-1 rounded-lg">
                <span className="text-[10px] text-cyan-400 block font-bold">L1</span>
                <span className="text-white font-extrabold">0.60%</span>
              </div>
              <div className="bg-indigo-500/15 border border-indigo-500/30 px-2 py-1 rounded-lg">
                <span className="text-[10px] text-indigo-400 block font-bold">L2</span>
                <span className="text-white font-extrabold">0.30%</span>
              </div>
              <div className="bg-teal-500/15 border border-teal-500/30 px-2 py-1 rounded-lg">
                <span className="text-[10px] text-teal-400 block font-bold">L3</span>
                <span className="text-white font-extrabold">0.15%</span>
              </div>
              <div className="bg-amber-500/15 border border-amber-500/30 px-2 py-1 rounded-lg">
                <span className="text-[10px] text-amber-400 block font-bold">L4</span>
                <span className="text-white font-extrabold">0.08%</span>
              </div>
              <div className="bg-purple-500/15 border border-purple-500/30 px-2 py-1 rounded-lg">
                <span className="text-[10px] text-purple-400 block font-bold">L5</span>
                <span className="text-white font-extrabold">0.05%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Copy Invite Code & Link Tools */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
          {/* Referral Code */}
          <div className="bg-[#050911] border border-slate-700/80 rounded-xl p-3 flex items-center justify-between gap-3">
            <div>
              <span className="text-[10px] text-slate-400 uppercase block font-semibold">Your Referral Code</span>
              <span className="text-base font-black text-cyan-300 font-mono tracking-wider">{inviteCode}</span>
            </div>
            <button
              onClick={handleCopyCode}
              className="px-3 py-2 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 text-xs font-bold transition flex items-center gap-1.5"
            >
              {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              {copiedCode ? 'Copied!' : 'Copy Code'}
            </button>
          </div>

          {/* Referral Link & Social Share */}
          <div className="bg-[#050911] border border-slate-700/80 rounded-xl p-3 flex items-center justify-between gap-2">
            <div className="truncate flex-1">
              <span className="text-[10px] text-slate-400 uppercase block font-semibold">Invite Link</span>
              <span className="text-xs font-bold text-slate-300 truncate block font-mono">{referralUrl}</span>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                onClick={handleCopyReferral}
                className="px-3 py-2 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 text-xs font-bold transition flex items-center gap-1.5"
              >
                {copiedRef ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                {copiedRef ? 'Copied!' : 'Copy'}
              </button>
              <button
                onClick={handleShareWhatsApp}
                className="p-2 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 transition"
                title="Share on WhatsApp"
              >
                <Share2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        <div className="pt-2 flex justify-end">
          <button
            onClick={() => onSelectTab?.('agency')}
            className="text-xs font-bold text-cyan-400 hover:text-cyan-300 flex items-center gap-1 transition"
          >
            <span>Open Full 5-Level Agency Center & Member Tree</span>
            <span>→</span>
          </button>
        </div>
      </div>

      {/* 4. RECENT ACTIVITY & TRANSACTION LOG */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
            <Clock className="w-4 h-4 text-cyan-400" />
            Recent Gaming & Financial Activity
          </h3>
          <span className="text-xs text-slate-400 font-mono">
            Showing {Math.min(userTransactions.length, 25)} of {userTransactions.length} Records
          </span>
        </div>

        <div className="bg-[#0b1424] border border-slate-800 rounded-2xl overflow-hidden shadow-lg">
          <div className="overflow-x-auto max-h-[450px] overflow-y-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-[#050911] text-slate-400 uppercase text-[10px] sticky top-0 z-10 border-b border-slate-800">
                <tr>
                  <th className="p-3">Activity</th>
                  <th className="p-3">Amount ($)</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Details / TXID</th>
                  <th className="p-3">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-300">
                {userTransactions.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-slate-500">
                      No recent gaming or financial activity found for your account.
                    </td>
                  </tr>
                ) : (
                  userTransactions.slice(0, 25).map((tx) => (
                    <tr key={tx.id} className="hover:bg-slate-800/40 transition">
                      <td className="p-3 font-semibold capitalize text-cyan-400">
                        {tx.type.replace(/_/g, ' ')}
                      </td>
                      <td className="p-3 font-bold text-white">
                        ${tx.amount.toFixed(2)} USDT
                      </td>
                      <td className="p-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            tx.status === 'completed'
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                              : tx.status === 'pending'
                              ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                              : 'bg-red-500/20 text-red-400 border border-red-500/30'
                          }`}
                        >
                          {tx.status}
                        </span>
                      </td>
                      <td className="p-3 text-slate-400 truncate max-w-[240px]">
                        {tx.notes || tx.txHash || '-'}
                      </td>
                      <td className="p-3 text-slate-500 text-[10px]">
                        {new Date(tx.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
