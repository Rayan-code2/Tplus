import React, { useState, useEffect } from 'react';
import {
  Share2,
  Copy,
  Check,
  Users,
  TrendingUp,
  Award,
  DollarSign,
  Send,
  Zap,
  ChevronDown,
  ChevronUp,
  Flame,
  ShieldCheck,
  Percent,
} from 'lucide-react';
import { User } from '../types';

interface ReferralAgencyViewProps {
  user: User;
}

interface LevelData {
  level: number;
  count: number;
  turnover: number;
  commissionRate: number;
  commission: number;
  members: {
    id: string;
    nodeId: string;
    name: string;
    registeredAt: string;
    totalBetTurnover: number;
    rank: string;
  }[];
}

interface AgencyStatsResponse {
  user: {
    id: string;
    nodeId: string;
    name: string;
    totalBetTurnover: number;
    referralCommissionEarned: number;
    firstDepositBonusEarned: number;
    vipAgentBonusEarned: number;
  };
  levelsData: LevelData[];
  totalTeamSize: number;
  totalTeamTurnover: number;
  totalCommissionEarned: number;
  vipAgentStatus: {
    activePlayersToday: number;
    currentTier: {
      level: string;
      minPlayers: number;
      dailyBonusUsdt: number;
      dailyBonusInr: number;
    } | null;
    tiers: {
      level: string;
      minPlayers: number;
      dailyBonusUsdt: number;
      dailyBonusInr: number;
    }[];
  };
  turnoverLogs: {
    id: string;
    amount: number;
    notes: string;
    createdAt: string;
  }[];
}

export const ReferralAgencyView: React.FC<ReferralAgencyViewProps> = ({ user }) => {
  const [stats, setStats] = useState<AgencyStatsResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [copiedCode, setCopiedCode] = useState<boolean>(false);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);
  const [expandedLevel, setExpandedLevel] = useState<number | null>(1);

  const inviteCode = user?.nodeId || 'NX-ROOT01';
  const referralUrl = `${window.location.origin}?ref=${inviteCode}`;

  const fetchAgencyStats = async () => {
    try {
      const res = await fetch('/api/referral/agency-stats', {
        headers: {
          'x-user-id': user.id,
        },
      });
      const data = await res.json();
      if (data.success) {
        setStats(data);
      }
    } catch (err) {
      console.error('Failed to fetch agency stats:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAgencyStats();
    const interval = setInterval(fetchAgencyStats, 10000);
    return () => clearInterval(interval);
  }, [user.id]);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(inviteCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(referralUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleShareWhatsApp = () => {
    const text = encodeURIComponent(
      `🎮 Join our Gaming & Investment Platform! Win big in WinGo 1m, Dragon vs Tiger, Aviator & Lucky Draw!\n\n🎁 Use my Referral Code: *${inviteCode}*\n🔗 Register Link: ${referralUrl}`
    );
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
  };

  const handleShareTelegram = () => {
    const text = encodeURIComponent(
      `🎮 Join our Gaming Platform! Use Referral Code: ${inviteCode}\nRegister now:`
    );
    window.open(`https://t.me/share/url?url=${encodeURIComponent(referralUrl)}&text=${text}`, '_blank');
  };

  return (
    <div className="space-y-6 pb-12 font-sans">
      {/* Hero Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#0d1829] via-[#092238] to-[#0d1829] border border-cyan-500/30 p-6 md:p-8 shadow-[0_0_50px_rgba(0,238,255,0.15)]">
        <div className="absolute -top-24 -right-24 w-72 h-72 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-semibold tracking-wide uppercase">
              <Zap className="w-3.5 h-3.5" />
              5-Level Bet Turnover Referral System
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
              Promote, Grow & Earn <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-teal-300 to-indigo-400">Passive Commission</span>
            </h1>
            <p className="text-sm text-slate-300 leading-relaxed">
              Earn lifetime turnover commission every time your 5-Level team places bets in games (WinGo, Dragon vs Tiger, Aviator). Whether they win or lose, you get paid automatically!
            </p>
          </div>

          {/* Quick Commission Rates Pill */}
          <div className="bg-[#050b14]/80 backdrop-blur-md border border-cyan-500/40 rounded-2xl p-4 shrink-0 space-y-2.5">
            <div className="text-xs text-slate-400 font-semibold uppercase tracking-wider flex items-center justify-between">
              <span>Commission Breakdown</span>
              <span className="text-cyan-400 font-bold">5 Levels</span>
            </div>
            <div className="grid grid-cols-5 gap-1.5 text-center text-xs">
              <div className="bg-cyan-500/15 border border-cyan-500/30 rounded-xl p-1.5">
                <div className="text-cyan-400 font-bold">L1</div>
                <div className="text-white font-extrabold text-[13px]">0.60%</div>
              </div>
              <div className="bg-indigo-500/15 border border-indigo-500/30 rounded-xl p-1.5">
                <div className="text-indigo-400 font-bold">L2</div>
                <div className="text-white font-extrabold text-[13px]">0.30%</div>
              </div>
              <div className="bg-teal-500/15 border border-teal-500/30 rounded-xl p-1.5">
                <div className="text-teal-400 font-bold">L3</div>
                <div className="text-white font-extrabold text-[13px]">0.15%</div>
              </div>
              <div className="bg-amber-500/15 border border-amber-500/30 rounded-xl p-1.5">
                <div className="text-amber-400 font-bold">L4</div>
                <div className="text-white font-extrabold text-[13px]">0.08%</div>
              </div>
              <div className="bg-purple-500/15 border border-purple-500/30 rounded-xl p-1.5">
                <div className="text-purple-400 font-bold">L5</div>
                <div className="text-white font-extrabold text-[13px]">0.05%</div>
              </div>
            </div>
          </div>
        </div>

        {/* Invite Link & Code Sharing Bar */}
        <div className="mt-6 pt-6 border-t border-slate-800/80 grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Code Box */}
          <div className="bg-[#050911]/90 border border-slate-700/60 rounded-2xl p-3.5 flex items-center justify-between gap-3">
            <div>
              <p className="text-[11px] text-slate-400 uppercase font-semibold">Your Referral Code</p>
              <p className="text-lg font-mono font-extrabold text-cyan-400 tracking-wider">{inviteCode}</p>
            </div>
            <button
              onClick={handleCopyCode}
              className="px-4 py-2 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 font-bold text-xs transition flex items-center gap-1.5"
            >
              {copiedCode ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              {copiedCode ? 'Copied!' : 'Copy Code'}
            </button>
          </div>

          {/* Share Link & Buttons */}
          <div className="bg-[#050911]/90 border border-slate-700/60 rounded-2xl p-3.5 flex items-center justify-between gap-3 overflow-hidden">
            <div className="truncate min-w-0 flex-1">
              <p className="text-[11px] text-slate-400 uppercase font-semibold">Referral Link</p>
              <p className="text-xs font-mono text-slate-300 truncate">{referralUrl}</p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={handleCopyLink}
                className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold text-xs transition"
                title="Copy Link"
              >
                {copiedLink ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              </button>
              <button
                onClick={handleShareWhatsApp}
                className="px-3 py-2 rounded-xl bg-emerald-600/30 hover:bg-emerald-600/40 text-emerald-300 border border-emerald-500/40 font-bold text-xs transition flex items-center gap-1"
              >
                <Send className="w-3.5 h-3.5" />
                WhatsApp
              </button>
              <button
                onClick={handleShareTelegram}
                className="px-3 py-2 rounded-xl bg-sky-600/30 hover:bg-sky-600/40 text-sky-300 border border-sky-500/40 font-bold text-xs transition flex items-center gap-1"
              >
                <Share2 className="w-3.5 h-3.5" />
                Telegram
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Top 4 Key Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Total Commission Earned */}
        <div className="bg-[#0b1320] border border-cyan-500/30 rounded-2xl p-5 relative overflow-hidden shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Total Referral Earnings</span>
            <div className="w-9 h-9 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 space-y-1">
            <h3 className="text-2xl font-extrabold text-white">
              ${(stats?.totalCommissionEarned || user?.referralCommissionEarned || 0).toFixed(2)}{' '}
              <span className="text-xs text-cyan-400 font-normal">USDT</span>
            </h3>
            <p className="text-[11px] text-slate-400">
              ≈ ₹{((stats?.totalCommissionEarned || user?.referralCommissionEarned || 0) * 100).toLocaleString('en-IN')} INR (Rate: $1 = ₹100)
            </p>
          </div>
        </div>

        {/* Total Team Bet Turnover */}
        <div className="bg-[#0b1320] border border-indigo-500/30 rounded-2xl p-5 relative overflow-hidden shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">5-Level Team Turnover</span>
            <div className="w-9 h-9 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 space-y-1">
            <h3 className="text-2xl font-extrabold text-white">
              ${(stats?.totalTeamTurnover || 0).toFixed(2)}{' '}
              <span className="text-xs text-indigo-400 font-normal">USDT</span>
            </h3>
            <p className="text-[11px] text-slate-400">
              ≈ ₹{((stats?.totalTeamTurnover || 0) * 100).toLocaleString('en-IN')} Total Bets
            </p>
          </div>
        </div>

        {/* Total Team Size */}
        <div className="bg-[#0b1320] border border-teal-500/30 rounded-2xl p-5 relative overflow-hidden shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">5-Level Team Members</span>
            <div className="w-9 h-9 rounded-xl bg-teal-500/20 text-teal-400 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 space-y-1">
            <h3 className="text-2xl font-extrabold text-white">
              {stats?.totalTeamSize || user?.teamCount || 0}{' '}
              <span className="text-xs text-teal-400 font-normal">Users</span>
            </h3>
            <p className="text-[11px] text-slate-400">
              Directs: {user?.directReferralsCount || 0} Members
            </p>
          </div>
        </div>
      </div>

      {/* 5-Level Breakdown Accordion/Cards */}
      <div className="bg-[#0b1320] border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-cyan-400" />
              5-Level Commission & Team Breakdown
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Detailed view of active players, turnover, and commission generated from Level 1 to Level 5.
            </p>
          </div>
        </div>

        <div className="space-y-3">
          {(stats?.levelsData || [
            { level: 1, count: user?.directReferralsCount || 0, turnover: 0, commissionRate: 0.60, commission: 0, members: [] },
            { level: 2, count: 0, turnover: 0, commissionRate: 0.30, commission: 0, members: [] },
            { level: 3, count: 0, turnover: 0, commissionRate: 0.15, commission: 0, members: [] },
            { level: 4, count: 0, turnover: 0, commissionRate: 0.08, commission: 0, members: [] },
            { level: 5, count: 0, turnover: 0, commissionRate: 0.05, commission: 0, members: [] },
          ]).map((lvlData) => {
            const isExpanded = expandedLevel === lvlData.level;
            const levelColors = [
              'border-cyan-500/40 text-cyan-400 bg-cyan-500/10',
              'border-indigo-500/40 text-indigo-400 bg-indigo-500/10',
              'border-teal-500/40 text-teal-400 bg-teal-500/10',
              'border-amber-500/40 text-amber-400 bg-amber-500/10',
              'border-purple-500/40 text-purple-400 bg-purple-500/10',
            ][lvlData.level - 1];

            return (
              <div
                key={lvlData.level}
                className="bg-[#050a12] border border-slate-800 rounded-2xl overflow-hidden transition-all duration-200"
              >
                {/* Level Header Bar */}
                <div
                  onClick={() => setExpandedLevel(isExpanded ? null : lvlData.level)}
                  className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer hover:bg-slate-800/40 transition"
                >
                  <div className="flex items-center gap-3">
                    <div className={`px-3 py-1 rounded-xl border text-xs font-extrabold ${levelColors}`}>
                      LEVEL {lvlData.level} ({lvlData.commissionRate}%)
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white">
                        {lvlData.level === 1 ? 'Direct Invites' : `Level ${lvlData.level} Downline`}
                      </h4>
                      <p className="text-xs text-slate-400">{lvlData.count} Members Registered</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-6 text-right">
                    <div>
                      <p className="text-[10px] text-slate-400 uppercase font-semibold">Total Bet Turnover</p>
                      <p className="text-sm font-extrabold text-white">${lvlData.turnover.toFixed(2)} USDT</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400 uppercase font-semibold">Commission Earned</p>
                      <p className="text-sm font-extrabold text-emerald-400">${lvlData.commission.toFixed(4)} USDT</p>
                    </div>
                    <button className="text-slate-400 hover:text-white p-1">
                      {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                {/* Expanded Member List */}
                {isExpanded && (
                  <div className="border-t border-slate-800/80 p-4 bg-[#03060c] space-y-2">
                    {lvlData.members && lvlData.members.length > 0 ? (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs text-slate-300">
                          <thead>
                            <tr className="border-b border-slate-800 text-[10px] uppercase text-slate-500 font-semibold">
                              <th className="py-2 px-3">Node ID / Name</th>
                              <th className="py-2 px-3">Joined Date</th>
                              <th className="py-2 px-3">Rank</th>
                              <th className="py-2 px-3 text-right">Total Bet Turnover</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-800/50">
                            {lvlData.members.map((m) => (
                              <tr key={m.id} className="hover:bg-slate-800/30">
                                <td className="py-2.5 px-3 font-semibold text-white">
                                  #{m.nodeId} <span className="text-slate-400 text-[11px]">({m.name})</span>
                                </td>
                                <td className="py-2.5 px-3 text-slate-400">
                                  {new Date(m.registeredAt).toLocaleDateString()}
                                </td>
                                <td className="py-2.5 px-3 font-medium text-cyan-400">{m.rank || 'Member'}</td>
                                <td className="py-2.5 px-3 text-right font-extrabold text-emerald-400">
                                  ${m.totalBetTurnover.toFixed(2)} USDT
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <p className="text-center text-xs text-slate-500 py-4">
                        No team members registered yet in Level {lvlData.level}. Share your link to grow your network!
                      </p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Extra Growth Booster: Daily VIP Agent Bonus */}
      <div className="grid grid-cols-1 gap-6">
        {/* Daily VIP Agent Bonus Card */}
        <div className="bg-[#0b1320] border border-cyan-500/30 rounded-3xl p-6 space-y-4 shadow-xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Daily VIP Agent Fixed Salary</h3>
              <p className="text-xs text-slate-400">Maintain active daily players & get fixed daily bonus cash.</p>
            </div>
          </div>

          <div className="bg-[#050a12] border border-slate-800 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">Active Players Today (24h):</span>
              <span className="text-cyan-400 font-extrabold text-sm">
                {stats?.vipAgentStatus?.activePlayersToday || 0} Players
              </span>
            </div>

            <div className="space-y-2">
              {(stats?.vipAgentStatus?.tiers || [
                { level: 'VIP 1 Agent', minPlayers: 5, dailyBonusUsdt: 2.0, dailyBonusInr: 200 },
                { level: 'VIP 2 Agent', minPlayers: 15, dailyBonusUsdt: 6.0, dailyBonusInr: 600 },
                { level: 'VIP 3 Agent', minPlayers: 50, dailyBonusUsdt: 25.0, dailyBonusInr: 2500 },
                { level: 'VIP 4 Agent', minPlayers: 200, dailyBonusUsdt: 120.0, dailyBonusInr: 12000 },
              ]).map((tier, idx) => {
                const isActive = (stats?.vipAgentStatus?.activePlayersToday || 0) >= tier.minPlayers;
                const calculatedInr = tier.dailyBonusUsdt * 100;
                return (
                  <div
                    key={idx}
                    className={`p-3 rounded-xl border flex items-center justify-between text-xs transition ${
                      isActive
                        ? 'bg-cyan-500/15 border-cyan-500/40 text-white font-bold'
                        : 'bg-slate-900/50 border-slate-800 text-slate-400'
                    }`}
                  >
                    <div>
                      <span className="font-bold text-white">{tier.level}</span>
                      <span className="text-[11px] block text-slate-400">Req: {tier.minPlayers} Active Players/Day</span>
                    </div>
                    <div className="text-right">
                      <span className="font-extrabold text-cyan-400">${tier.dailyBonusUsdt} USDT / Day</span>
                      <span className="text-[10px] block text-slate-400">(₹{calculatedInr.toLocaleString('en-IN')} INR)</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Live Bet Turnover Commission Feed */}
      <div className="bg-[#0b1320] border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Flame className="w-5 h-5 text-amber-400" />
              Live Commission Transaction Feed
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">Real-time turnover commission payouts credited to your account.</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          {stats?.turnoverLogs && stats.turnoverLogs.length > 0 ? (
            <table className="w-full text-left text-xs text-slate-300">
              <thead>
                <tr className="border-b border-slate-800 text-[10px] uppercase text-slate-500 font-semibold">
                  <th className="py-2.5 px-3">Date & Time</th>
                  <th className="py-2.5 px-3">Description / Details</th>
                  <th className="py-2.5 px-3 text-right">Commission Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {stats.turnoverLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-800/30">
                    <td className="py-2.5 px-3 text-slate-400 whitespace-nowrap">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                    <td className="py-2.5 px-3 font-medium text-slate-200">{log.notes}</td>
                    <td className="py-2.5 px-3 text-right font-extrabold text-emerald-400 whitespace-nowrap">
                      +${log.amount.toFixed(4)} USDT
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="text-center py-8 text-slate-500 text-xs">
              No turnover commissions logged yet. As soon as your team members place bets in games, live commissions will appear here!
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
