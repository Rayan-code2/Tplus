import React, { useState, useEffect } from 'react';
import {
  Wallet,
  ArrowUpRight,
  ArrowDownLeft,
  Zap,
  TrendingUp,
  Cpu,
  Layers,
  Award,
  Users,
  Copy,
  Check,
  Sparkles,
  ShieldCheck,
  Clock,
  Coins,
  RefreshCw,
  Trophy,
  CheckCircle2,
  Shield,
  Star,
} from 'lucide-react';
import { User, Package, Transaction, SystemSettings } from '../types';

interface DashboardViewProps {
  user: User;
  settings: SystemSettings;
  transactions: Transaction[];
  onBuyPackage: (pkgId: string) => Promise<void>;
  onClaimRoi: () => Promise<void>;
  onOpenDeposit: () => void;
  onOpenWithdraw: () => void;
  onSelectTab?: (tab: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  user,
  settings,
  transactions,
  onBuyPackage,
  onClaimRoi,
  onOpenDeposit,
  onOpenWithdraw,
  onSelectTab,
}) => {
  const [copiedRef, setCopiedRef] = useState(false);
  const [buyingPkgId, setBuyingPkgId] = useState<string | null>(null);
  const [claimingRoi, setClaimingRoi] = useState(false);
  const [liveAccruedRoi, setLiveAccruedRoi] = useState<number>(0);

  const activePackage = settings?.packages?.find((p) => p.id === user?.activePackageId);

  // Live Mining Yield Per Second Calculation
  useEffect(() => {
    if (!activePackage || !user?.lastRoiClaimAt) {
      setLiveAccruedRoi(0);
      return;
    }

    const interval = setInterval(() => {
      const lastClaim = new Date(user.lastRoiClaimAt).getTime();
      const elapsedSeconds = (Date.now() - lastClaim) / 1000;
      const dailyRoiAmount = activePackage.price * (activePackage.dailyRoiPercent / 100);
      const roiPerSecond = dailyRoiAmount / 86400;
      setLiveAccruedRoi(Math.max(0.0001, roiPerSecond * elapsedSeconds));
    }, 100);

    return () => clearInterval(interval);
  }, [user?.lastRoiClaimAt, activePackage]);

  const referralUrl = `${window.location.origin}?ref=${user?.nodeId || ''}`;

  const handleCopyReferral = () => {
    navigator.clipboard.writeText(referralUrl);
    setCopiedRef(true);
    setTimeout(() => setCopiedRef(false), 2000);
  };

  const handleActivatePackage = async (pkgId: string) => {
    setBuyingPkgId(pkgId);
    try {
      await onBuyPackage(pkgId);
    } finally {
      setBuyingPkgId(null);
    }
  };

  const handleClaimRoiAction = async () => {
    setClaimingRoi(true);
    try {
      await onClaimRoi();
    } finally {
      setClaimingRoi(false);
    }
  };

  const userTransactions = (transactions || []).filter(
    (tx) => tx.userId === user?.id || (user?.nodeId && tx.userNodeId === user.nodeId)
  );

  return (
    <div className="space-y-8 font-mono pb-12">
      {/* 1. TOP WALLET CARDS OVERVIEW */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {/* Deposit Wallet (Fund Balance) */}
        <div className="bg-gradient-to-br from-[#0a1b2d] to-[#071321] border border-[#0ef]/40 rounded-2xl p-4 relative overflow-hidden shadow-[0_0_20px_rgba(0,238,255,0.15)] group hover:border-[#0ef]/70 transition">
          <div className="absolute top-0 right-0 w-24 h-24 bg-[#0ef]/10 rounded-full blur-2xl group-hover:bg-[#0ef]/20 transition" />
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-slate-300 font-semibold uppercase tracking-wider flex items-center gap-1.5">
              <Wallet className="w-4 h-4 text-[#0ef]" />
              Deposit Wallet
            </span>
            <span className="text-[10px] bg-[#0ef]/20 text-[#0ef] border border-[#0ef]/40 px-2 py-0.5 rounded-full font-bold">
              Bets & Pkgs
            </span>
          </div>
          <div className="text-2xl font-extrabold text-white tracking-tight">
            ${(user.depositBalance || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            <span className="text-xs font-normal text-[#0ef] ml-1">USDT</span>
          </div>
          <p className="text-[10px] text-slate-400 mt-1">
            Deposit fund used for buying Node packages & game bets.
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

        {/* Game Winning Wallet (Game Winnings) */}
        <div className="bg-gradient-to-br from-[#1a1205] to-[#2b1c06] border border-amber-500/50 rounded-2xl p-4 relative overflow-hidden shadow-[0_0_25px_rgba(245,158,11,0.2)] group hover:border-amber-400 transition">
          <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/15 rounded-full blur-2xl group-hover:bg-amber-500/30 transition" />
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-amber-300 font-extrabold uppercase tracking-wider flex items-center gap-1.5">
              <Trophy className="w-4 h-4 text-amber-400 animate-pulse" />
              Winning Wallet
            </span>
            <span className="text-[10px] bg-amber-500/30 text-amber-200 border border-amber-500/60 px-2 py-0.5 rounded-full font-bold">
              10% Fee
            </span>
          </div>
          <div className="text-2xl font-extrabold text-amber-300 tracking-tight">
            ${(user.winningBalance || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            <span className="text-xs font-normal text-amber-400 ml-1">USDT</span>
          </div>
          <p className="text-[10px] text-amber-200/80 mt-1">
            Game & Lottery winnings. Instant withdrawal with 10% fee!
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

        {/* Available Balance (Withdrawable MLM) */}
        <div className="bg-gradient-to-br from-[#0c1829] to-[#080f1a] border border-emerald-500/30 rounded-2xl p-4 relative overflow-hidden shadow-[0_0_20px_rgba(16,185,129,0.1)] group hover:border-emerald-500/50 transition">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl group-hover:bg-emerald-500/20 transition" />
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider flex items-center gap-1.5">
              <Coins className="w-4 h-4 text-emerald-400" />
              MLM Earnings
            </span>
            <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded-full font-bold">
              Network
            </span>
          </div>
          <div className="text-2xl font-extrabold text-white tracking-tight">
            ${user.balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            <span className="text-xs font-normal text-emerald-400 ml-1">USDT</span>
          </div>
          <p className="text-[10px] text-slate-400 mt-1">
            Mining yield, level & sponsor income ready for payout.
          </p>
          <div className="mt-3">
            <button
              onClick={onOpenWithdraw}
              className="w-full flex items-center justify-center gap-1 text-xs font-bold py-2 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/50 transition"
            >
              <ArrowUpRight className="w-3.5 h-3.5" />
              Withdraw MLM
            </button>
          </div>
        </div>

        {/* Shopping Wallet */}
        <div className="bg-gradient-to-br from-[#0c1829] to-[#080f1a] border border-cyan-500/30 rounded-2xl p-4 relative overflow-hidden shadow-[0_0_20px_rgba(6,182,212,0.1)] group hover:border-cyan-500/50 transition">
          <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-500/10 rounded-full blur-2xl group-hover:bg-cyan-500/20 transition" />
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider flex items-center gap-1.5">
              <RefreshCw className="w-4 h-4 text-cyan-400" />
              Shopping Wallet
            </span>
            <span className="text-[10px] bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 px-2 py-0.5 rounded-full font-bold">
              30% Fund
            </span>
          </div>
          <div className="text-2xl font-extrabold text-white tracking-tight">
            ${user.upgradeBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            <span className="text-xs font-normal text-cyan-400 ml-1">USDT</span>
          </div>
          <p className="text-[10px] text-slate-400 mt-1">
            Accumulated via 30% withdrawal rule for TetherMart.
          </p>
        </div>

        {/* Total Lifetime Earnings */}
        <div className="bg-gradient-to-br from-[#0c1829] to-[#080f1a] border border-amber-500/30 rounded-2xl p-4 relative overflow-hidden shadow-[0_0_20px_rgba(245,158,11,0.1)] group hover:border-amber-500/50 transition">
          <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/10 rounded-full blur-2xl group-hover:bg-amber-500/20 transition" />
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-amber-400" />
              Lifetime Income
            </span>
            <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded-full font-bold">
              Total
            </span>
          </div>
          <div className="text-2xl font-extrabold text-white tracking-tight">
            ${user.totalEarned.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            <span className="text-xs font-normal text-amber-400 ml-1">USDT</span>
          </div>
          <div className="text-[11px] text-emerald-400 mt-2 flex items-center gap-1 truncate">
            <Sparkles className="w-3.5 h-3.5 shrink-0" />
            Pkg: <span className="font-bold text-white truncate">{activePackage ? activePackage.name : 'None'}</span>
          </div>
        </div>
      </div>

      {/* 2. REAL-TIME NODE MINING YIELD COUNTER */}
      <div className="bg-gradient-to-r from-[#0d1c2e] via-[#091524] to-[#0c1829] border border-cyan-500/40 rounded-2xl p-6 relative overflow-hidden shadow-[0_0_25px_rgba(6,182,212,0.15)]">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping shadow-[0_0_10px_#06b6d4]" />
              <span className="text-xs uppercase tracking-widest text-cyan-400 font-bold">
                Real-Time Node Mining Engine
              </span>
              {activePackage && (
                <span className="text-[10px] bg-cyan-500/20 text-cyan-300 px-2 py-0.5 rounded border border-cyan-500/30">
                  {activePackage.dailyRoiPercent}% Daily Yield
                </span>
              )}
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl md:text-5xl font-extrabold tracking-tight text-white font-mono">
                ${liveAccruedRoi.toFixed(5)}
              </span>
              <span className="text-cyan-400 font-bold text-sm">USDT Claimable</span>
            </div>
            <p className="text-xs text-slate-400 flex items-center gap-2">
              <Clock className="w-3.5 h-3.5 text-slate-500" />
              Mining Rate:{' '}
              <span className="text-emerald-400 font-bold">
                ${((activePackage ? activePackage.price * (activePackage.dailyRoiPercent / 100) : 0) / 86400).toFixed(6)} USDT/sec
              </span>
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
            <button
              onClick={handleClaimRoiAction}
              disabled={claimingRoi || liveAccruedRoi < 0.01}
              className={`w-full sm:w-auto px-6 py-3.5 rounded-xl font-bold text-sm transition shadow-lg flex items-center justify-center gap-2 ${
                liveAccruedRoi >= 0.01
                  ? 'bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-black shadow-[0_0_20px_rgba(6,182,212,0.4)]'
                  : 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
              }`}
            >
              <Cpu className="w-4 h-4" />
              {claimingRoi ? 'Processing Claim...' : 'Claim Node Yield'}
            </button>
          </div>
        </div>
      </div>

      {/* 3. INCOME STREAM BREAKDOWN GRID */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
          <Layers className="w-4 h-4 text-cyan-400" />
          Income Streams Breakdown
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3">
          <div className="bg-[#0b1424] border border-cyan-500/20 rounded-xl p-3">
            <div className="text-[10px] text-slate-400 font-medium">ROI Mining</div>
            <div className="text-base font-bold text-cyan-300 mt-1">
              ${user.roiEarned.toFixed(2)}
            </div>
          </div>
          <div className="bg-[#0b1424] border border-emerald-500/20 rounded-xl p-3">
            <div className="text-[10px] text-slate-400 font-medium">Matrix Level</div>
            <div className="text-base font-bold text-emerald-300 mt-1">
              ${user.levelEarned.toFixed(2)}
            </div>
          </div>
          <div className="bg-[#0b1424] border border-indigo-500/20 rounded-xl p-3">
            <div className="text-[10px] text-slate-400 font-medium">Direct Sponsor</div>
            <div className="text-base font-bold text-indigo-300 mt-1">
              ${user.sponsorEarned.toFixed(2)}
            </div>
          </div>
          <div className="bg-[#0b1424] border border-amber-500/40 rounded-xl p-3 shadow-[0_0_10px_rgba(245,158,11,0.1)]">
            <div className="text-[10px] font-bold text-amber-400">100% Special Bonus</div>
            <div className="text-base font-extrabold text-amber-300 mt-1">
              ${(user.specialBonusEarned || 0).toFixed(2)}
            </div>
          </div>
          <div className="bg-[#0b1424] border border-purple-500/20 rounded-xl p-3">
            <div className="text-[10px] text-slate-400 font-medium">Rank Leadership</div>
            <div className="text-base font-bold text-purple-300 mt-1">
              ${user.rankEarned.toFixed(2)}
            </div>
          </div>
          <div className="bg-[#0b1424] border border-yellow-500/20 rounded-xl p-3">
            <div className="text-[10px] text-slate-400 font-medium">Gold Boosting</div>
            <div className="text-base font-bold text-yellow-300 mt-1">
              ${user.boostingEarned.toFixed(2)}
            </div>
          </div>
          <div className="bg-[#0b1424] border border-pink-500/20 rounded-xl p-3">
            <div className="text-[10px] text-slate-400 font-medium">Daily Spin Wins</div>
            <div className="text-base font-bold text-pink-300 mt-1">
              ${user.spinEarned.toFixed(2)}
            </div>
          </div>
        </div>
      </div>

      {/* 4. REFERRAL LINK & NETWORK SHARING TOOL */}
      <div className="bg-[#0b1424] border border-cyan-500/30 rounded-2xl p-5 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-cyan-400" />
            <span className="text-xs font-bold uppercase tracking-wider text-slate-200">
              Your Unique Referral Link & Node Sponsor ID
            </span>
          </div>
          <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30">
            Earn 40% Direct + 15 Levels
          </span>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-2">
          <input
            type="text"
            readOnly
            value={referralUrl}
            className="w-full bg-[#050911] border border-slate-700/80 rounded-xl px-4 py-2.5 text-xs text-cyan-300 focus:outline-none"
          />
          <button
            onClick={handleCopyReferral}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/50 text-xs font-bold transition flex items-center justify-center gap-1.5 shrink-0"
          >
            {copiedRef ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                Copied Link!
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                Copy Link
              </>
            )}
          </button>
        </div>
      </div>

      {/* 5. AVAILABLE PACKAGES & NODE UPGRADE STORE */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#0c1829] border border-[#0ef]/30 p-3.5 rounded-2xl">
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-200 flex items-center gap-2">
              <Zap className="w-4 h-4 text-[#0ef]" />
              Node Mining Packages Store
            </h3>
            <p className="text-xs text-slate-400">
              Packages are purchased using your <span className="text-[#0ef] font-bold">Deposit Wallet</span> balance.
            </p>
          </div>
          <div className="flex items-center gap-2 bg-[#050911] border border-[#0ef]/40 px-3 py-1.5 rounded-xl shrink-0">
            <Wallet className="w-4 h-4 text-[#0ef]" />
            <div className="text-xs">
              <span className="text-[10px] text-slate-400 block uppercase leading-none">Deposit Wallet</span>
              <span className="font-extrabold text-[#0ef]">${(user.depositBalance || 0).toFixed(2)} USDT</span>
            </div>
            <button
              onClick={onOpenDeposit}
              className="ml-2 text-[10px] font-bold px-2 py-1 rounded bg-[#0ef]/20 hover:bg-[#0ef]/30 text-[#0ef] border border-[#0ef]/40 transition"
            >
              + Deposit
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {settings.packages.map((pkg) => {
            const isUpgradePass = !!(pkg.isUpgradePackage || pkg.dailyRoiPercent === 0 || pkg.price === 20);
            const isCurrent = user.activePackageId === pkg.id;
            const isUpgradeActivated = !!(user.isUpgraded || (isUpgradePass && user.activePackageId === pkg.id));

            if (isUpgradePass) {
              return (
                <div
                  key={pkg.id}
                  className={`bg-gradient-to-b from-[#131d30] via-[#0b1424] to-[#070d18] rounded-2xl p-5 flex flex-col justify-between border-2 transition relative ${
                    isUpgradeActivated
                      ? 'border-emerald-500/80 shadow-[0_0_25px_rgba(16,185,129,0.25)]'
                      : 'border-amber-500/70 hover:border-amber-400 shadow-[0_0_25px_rgba(245,158,11,0.2)]'
                  }`}
                >
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 text-black font-black text-[10px] uppercase px-3.5 py-1 rounded-full tracking-wider shadow-[0_0_12px_rgba(245,158,11,0.4)] flex items-center gap-1.5 whitespace-nowrap">
                    <Zap className="w-3.5 h-3.5 text-black fill-black" />
                    ACCOUNT UPGRADE BOOSTER PASS
                  </span>

                  <div className="space-y-4 pt-3">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                      <span className="text-sm font-extrabold text-amber-300 tracking-wide uppercase flex items-center gap-1.5">
                        <Shield className="w-4 h-4 text-amber-400" />
                        {pkg.name}
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-extrabold uppercase">
                        Qualifier Pass
                      </span>
                    </div>

                    <div className="flex items-baseline justify-between">
                      <div className="text-3xl font-black text-white tracking-tight">
                        ${pkg.price} <span className="text-xs font-normal text-slate-400">USDT</span>
                      </div>
                      <span className="text-[10px] text-amber-400 font-bold bg-amber-950/60 border border-amber-500/30 px-2 py-0.5 rounded-lg">
                        One-Time Pass
                      </span>
                    </div>

                    {/* Unique Upgrade Details (No misleading 0% ROI / 100 days) */}
                    <div className="space-y-2 text-xs pt-1">
                      <div className="flex justify-between items-center bg-[#050b14] p-2 rounded-xl border border-slate-800">
                        <span className="text-slate-400 font-semibold">Pass Purpose:</span>
                        <span className="text-amber-300 font-extrabold text-xs">Account Booster & Qualifier</span>
                      </div>
                      <div className="flex justify-between items-center bg-[#050b14] p-2 rounded-xl border border-slate-800">
                        <span className="text-slate-400 font-semibold">Daily ROI Yield:</span>
                        <span className="text-slate-400 font-bold text-xs">None (Qualifier Pass)</span>
                      </div>
                      <div className="flex justify-between items-center bg-[#050b14] p-2 rounded-xl border border-slate-800">
                        <span className="text-slate-400 font-semibold">Direct Sponsor Bonus:</span>
                        <span className="text-slate-400 font-bold text-xs">None (0% - Qualifier Pass Only)</span>
                      </div>
                      <div className="flex justify-between items-center bg-[#050b14] p-2 rounded-xl border border-slate-800">
                        <span className="text-slate-400 font-semibold">Income Status:</span>
                        <span className="text-emerald-400 font-extrabold text-xs">Unlocks Payouts & Team Bonus</span>
                      </div>
                      <div className="flex justify-between items-center bg-[#050b14] p-2 rounded-xl border border-slate-800">
                        <span className="text-slate-400 font-semibold">Validity:</span>
                        <span className="text-cyan-300 font-bold text-xs">Lifetime Account Qualification</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 pt-3 border-t border-slate-800/80">
                    <button
                      onClick={() => handleActivatePackage(pkg.id)}
                      disabled={isUpgradeActivated || buyingPkgId === pkg.id}
                      className={`w-full py-3 rounded-xl text-xs font-black tracking-wider uppercase transition flex items-center justify-center gap-2 ${
                        isUpgradeActivated
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/50 cursor-default shadow-[0_0_15px_rgba(16,185,129,0.2)]'
                          : 'bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-300 text-black shadow-[0_0_20px_rgba(245,158,11,0.4)]'
                      }`}
                    >
                      {isUpgradeActivated ? (
                        <>
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                          <span>Account Upgraded & Qualified</span>
                        </>
                      ) : buyingPkgId === pkg.id ? (
                        'Upgrading Node...'
                      ) : (
                        `Upgrade Account Pass ($${pkg.price})`
                      )}
                    </button>
                  </div>
                </div>
              );
            }

            // Standard ROI & Joining Package ($10 Starter Node)
            return (
              <div
                key={pkg.id}
                className={`bg-[#0c1524] rounded-2xl p-5 flex flex-col justify-between border-2 transition relative ${
                  isCurrent
                    ? 'border-emerald-500/80 shadow-[0_0_25px_rgba(16,185,129,0.2)]'
                    : 'border-cyan-500/50 hover:border-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.15)]'
                }`}
              >
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-cyan-500 to-indigo-500 text-black font-black text-[10px] uppercase px-3.5 py-1 rounded-full tracking-wider shadow flex items-center gap-1.5 whitespace-nowrap">
                  <Sparkles className="w-3.5 h-3.5 text-black" />
                  PRIMARY JOINING & ROI PACKAGE
                </span>

                <div className="space-y-4 pt-3">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <span className="text-sm font-extrabold text-cyan-300 uppercase tracking-wide">{pkg.name}</span>
                    <span
                      className="w-3 h-3 rounded-full shadow-[0_0_8px_#06b6d4]"
                      style={{ backgroundColor: pkg.badgeColor || '#06b6d4' }}
                    />
                  </div>

                  <div className="flex items-baseline justify-between">
                    <div className="text-3xl font-black text-white tracking-tight">
                      ${pkg.price} <span className="text-xs font-normal text-slate-400">USDT</span>
                    </div>
                    <span className="text-[10px] text-cyan-300 font-bold bg-cyan-950/60 border border-cyan-500/30 px-2 py-0.5 rounded-lg">
                      Yield Node
                    </span>
                  </div>

                  <div className="space-y-2 text-xs pt-1">
                    <div className="flex justify-between items-center bg-[#050b14] p-2 rounded-xl border border-slate-800">
                      <span className="text-slate-400 font-semibold">Daily ROI Yield:</span>
                      <span className="text-emerald-400 font-black text-xs">{pkg.dailyRoiPercent}% / Day</span>
                    </div>
                    <div className="flex justify-between items-center bg-[#050b14] p-2 rounded-xl border border-slate-800">
                      <span className="text-slate-400 font-semibold">Direct Sponsor Bonus:</span>
                      <span className="text-amber-300 font-extrabold text-xs">
                        {pkg.sponsorBonusPercent !== undefined ? pkg.sponsorBonusPercent : 10}% (${((pkg.price * (pkg.sponsorBonusPercent !== undefined ? pkg.sponsorBonusPercent : 10)) / 100).toFixed(2)})
                      </span>
                    </div>
                    <div className="flex justify-between items-center bg-[#050b14] p-2 rounded-xl border border-slate-800">
                      <span className="text-slate-400 font-semibold">Yield Duration:</span>
                      <span className="text-slate-200 font-bold text-xs">{pkg.durationDays} Days</span>
                    </div>
                    <div className="flex justify-between items-center bg-[#050b14] p-2 rounded-xl border border-slate-800">
                      <span className="text-slate-400 font-semibold">Team Level Income:</span>
                      <span className="text-cyan-400 font-extrabold text-xs">Levels 1 - 10 Unlocked</span>
                    </div>
                    <div className="flex justify-between items-center bg-[#050b14] p-2 rounded-xl border border-slate-800">
                      <span className="text-slate-400 font-semibold">Capping Return:</span>
                      <span className="text-amber-300 font-black text-xs">{pkg.totalRoiReturnPercent}% Capping</span>
                    </div>
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t border-slate-800/80">
                  <button
                    onClick={() => handleActivatePackage(pkg.id)}
                    disabled={isCurrent || buyingPkgId === pkg.id}
                    className={`w-full py-3 rounded-xl text-xs font-black tracking-wider uppercase transition flex items-center justify-center gap-2 ${
                      isCurrent
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/50 cursor-default shadow-[0_0_15px_rgba(16,185,129,0.2)]'
                        : 'bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 shadow-[0_0_15px_rgba(6,182,212,0.2)]'
                    }`}
                  >
                    {isCurrent ? (
                      <>
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        <span>Active Joining Package</span>
                      </>
                    ) : buyingPkgId === pkg.id ? (
                      'Activating...'
                    ) : (
                      `Activate Joining Package ($${pkg.price})`
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 6. RECENT TRANSACTIONS ACTIVITY LOG */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
          <Clock className="w-4 h-4 text-cyan-400" />
          Recent Transaction Logs
        </h3>

        <div className="bg-[#0b1424] border border-slate-800 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-[#050911] text-slate-400 uppercase text-[10px]">
                <tr>
                  <th className="p-3">Type</th>
                  <th className="p-3">Amount ($)</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Details / TXID</th>
                  <th className="p-3">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-300">
                {userTransactions.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-6 text-center text-slate-500">
                      No recent transactions found for your account.
                    </td>
                  </tr>
                ) : (
                  userTransactions.slice(0, 8).map((tx) => (
                    <tr key={tx.id} className="hover:bg-slate-800/40">
                      <td className="p-3 font-semibold capitalize text-cyan-400">
                        {tx.type.replace('_', ' ')}
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
                      <td className="p-3 text-slate-400 truncate max-w-[200px]">
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
