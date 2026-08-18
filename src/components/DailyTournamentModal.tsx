import React, { useState, useEffect } from 'react';
import { Trophy, Flame, Users, Coins, Sparkles, Clock, Crown, Medal, Award, TrendingUp, Shield, ChevronRight } from 'lucide-react';
import { DailyTournamentState, TournamentLeaderboardItem } from '../types';

interface DailyTournamentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateToGames?: () => void;
}

export const DailyTournamentModal: React.FC<DailyTournamentModalProps> = ({
  isOpen,
  onClose,
  onNavigateToGames,
}) => {
  const [data, setData] = useState<DailyTournamentState | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [countdown, setCountdown] = useState<{ hours: number; mins: number; secs: number }>({ hours: 0, mins: 0, secs: 0 });

  const fetchTournament = async () => {
    try {
      const storedId = localStorage.getItem('tp_user_id') || '';
      const res = await fetch('/api/tournament/daily', {
        headers: { 'x-user-id': storedId },
      });
      if (res.ok) {
        const json = await res.json();
        if (json.tournament) {
          setData(json.tournament);
        }
      }
    } catch (err) {
      console.error('Failed to fetch tournament details', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchTournament();
    }
  }, [isOpen]);

  // Countdown timer calculation to end of day UTC
  useEffect(() => {
    if (!data?.endsAt) return;
    const updateCountdown = () => {
      const target = new Date(data.endsAt).getTime();
      const now = Date.now();
      const diff = Math.max(0, target - now);

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const secs = Math.floor((diff % (1000 * 60)) / 1000);

      setCountdown({ hours, mins, secs });
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [data?.endsAt]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md font-mono animate-in fade-in duration-200">
      <div className="bg-[#09111e] border border-amber-500/40 rounded-3xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden shadow-[0_0_50px_rgba(245,158,11,0.25)] relative">
        
        {/* Header Ribbon */}
        <div className="bg-gradient-to-r from-amber-600 via-yellow-500 to-amber-700 p-4 sm:p-6 text-black relative shrink-0">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-9 h-9 rounded-full bg-black/30 hover:bg-black/50 text-white font-bold flex items-center justify-center transition border border-white/20"
          >
            ✕
          </button>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pr-8">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="bg-black/25 text-black font-black text-[11px] px-2.5 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1 border border-black/10">
                  <Flame className="w-3.5 h-3.5 fill-black" />
                  Live 24h Championship
                </span>
                {data?.enabled === false && (
                  <span className="bg-red-900 text-white font-black text-[10px] px-2 py-0.5 rounded-full">
                    PAUSED
                  </span>
                )}
                <span className="text-xs font-bold text-amber-950">Daily Reset @ 00:00 UTC</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.4)] flex items-center gap-2">
                <Trophy className="w-6 h-6 text-yellow-200" />
                {data?.title || 'Daily Top Bettor Tournament'}
              </h2>
              <p className="text-xs text-amber-950 font-sans font-medium max-w-xl">
                Wager on Color Prediction, Dragon vs Tiger, or Aviator to climb the daily leaderboard and win massive USDT prize pool shares!
              </p>
            </div>

            {/* Countdown Badge */}
            <div className="bg-black/80 border border-yellow-400/40 rounded-2xl p-3 text-center sm:text-right shrink-0">
              <div className="text-[10px] text-amber-400 uppercase font-extrabold flex items-center justify-center sm:justify-end gap-1">
                <Clock className="w-3 h-3 text-amber-400" />
                Round Ends In
              </div>
              <div className="text-lg sm:text-xl font-black text-white font-mono tracking-widest mt-0.5">
                {String(countdown.hours).padStart(2, '0')}:
                {String(countdown.mins).padStart(2, '0')}:
                {String(countdown.secs).padStart(2, '0')}
              </div>
            </div>
          </div>
        </div>

        {/* Dynamic Metric Ribbon: Total Pot & Participant Counter */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 p-4 sm:p-5 bg-[#060b14] border-b border-slate-800 shrink-0">
          {/* Total Pot Counter */}
          <div className="bg-gradient-to-br from-[#1a1205] to-[#2a1b05] border border-amber-500/50 rounded-2xl p-3 shadow-[0_0_20px_rgba(245,158,11,0.15)] relative overflow-hidden">
            <div className="text-[10px] text-amber-400 uppercase font-black tracking-wider flex items-center gap-1.5">
              <Coins className="w-3.5 h-3.5 text-amber-400" />
              Total Dynamic Pot
            </div>
            <div className="text-xl sm:text-2xl font-black text-white mt-1">
              ${(data?.totalPot ?? 250).toFixed(2)} <span className="text-xs text-amber-400 font-normal">USDT</span>
            </div>
            <div className="text-[9px] text-amber-300/80 font-sans mt-0.5">
              Guaranteed ${(data?.basePot ?? 250).toFixed(2)} + {data?.turnoverContributionPercent ?? 5}% of daily wagers!
            </div>
          </div>

          {/* Participant Counter */}
          <div className="bg-[#0b1424] border border-cyan-500/30 rounded-2xl p-3 shadow-[0_0_15px_rgba(6,182,212,0.1)]">
            <div className="text-[10px] text-cyan-400 uppercase font-black tracking-wider flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-cyan-400" />
              Active Bettors
            </div>
            <div className="text-xl sm:text-2xl font-black text-white mt-1">
              {data?.participantCount || 0} <span className="text-xs text-cyan-400 font-normal">Players</span>
            </div>
            <div className="text-[9px] text-slate-400 font-sans mt-0.5">
              Across all platform game arenas
            </div>
          </div>

          {/* Total Round Wagers */}
          <div className="bg-[#0b1424] border border-purple-500/30 rounded-2xl p-3 shadow-[0_0_15px_rgba(168,85,247,0.1)]">
            <div className="text-[10px] text-purple-300 uppercase font-black tracking-wider flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-purple-400" />
              Today's Wager Volume
            </div>
            <div className="text-xl sm:text-2xl font-black text-white mt-1">
              ${(data?.totalWagerVolume || 0).toFixed(2)} <span className="text-xs text-purple-400 font-normal">USDT</span>
            </div>
            <div className="text-[9px] text-slate-400 font-sans mt-0.5">
              {data?.totalBetsPlaced || 0} Total Bets Placed
            </div>
          </div>

          {/* User's Current Standing */}
          <div className="bg-[#0b1424] border border-emerald-500/40 rounded-2xl p-3 shadow-[0_0_15px_rgba(16,185,129,0.1)]">
            <div className="text-[10px] text-emerald-400 uppercase font-black tracking-wider flex items-center gap-1.5">
              <Medal className="w-3.5 h-3.5 text-emerald-400" />
              Your Status
            </div>
            <div className="text-xl sm:text-2xl font-black text-emerald-300 mt-1">
              {data?.userStats?.rank ? `#${data.userStats.rank}` : 'Unranked'}
            </div>
            <div className="text-[9px] text-emerald-400/80 font-sans mt-0.5">
              ${(data?.userStats?.totalWagered || 0).toFixed(2)} Wagered ({data?.userStats?.betsCount || 0} bets)
            </div>
          </div>
        </div>

        {/* Scrollable Leaderboard & Prize Breakdown Section */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6 flex-1 text-slate-200">
          {/* Top 3 Podium Highlights */}
          {data?.leaderboard && data.leaderboard.length >= 3 && (
            <div className="grid grid-cols-3 gap-2 sm:gap-4 items-end pt-2 pb-2">
              {/* 2nd Place */}
              <div className="bg-gradient-to-t from-slate-900 via-slate-800/80 to-slate-800 border border-slate-600 rounded-2xl p-3 text-center flex flex-col items-center justify-between min-h-[140px] shadow-lg relative">
                <div className="w-8 h-8 rounded-full bg-slate-700 border border-slate-500 flex items-center justify-center text-white font-black text-xs -mt-6 shadow-md">
                  🥈
                </div>
                <div className="mt-1">
                  <div className="font-extrabold text-xs text-white truncate max-w-[90px] sm:max-w-[130px]">
                    {data.leaderboard[1]?.userName || 'Player 2'}
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono">
                    ${data.leaderboard[1]?.totalWagered.toFixed(2)} Wager
                  </div>
                </div>
                <div className="w-full bg-amber-500/20 border border-amber-500/40 rounded-xl py-1 text-amber-300 font-black text-xs mt-2">
                  +${data.leaderboard[1]?.projectedPrize.toFixed(2)} USDT
                </div>
              </div>

              {/* 1st Place (Champion) */}
              <div className="bg-gradient-to-t from-[#201503] via-[#352205] to-[#1c1203] border-2 border-yellow-400 rounded-2xl p-3.5 text-center flex flex-col items-center justify-between min-h-[165px] shadow-[0_0_25px_rgba(245,158,11,0.4)] relative">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-yellow-400 to-amber-600 border-2 border-white flex items-center justify-center text-black font-black text-sm -mt-8 shadow-xl animate-bounce">
                  👑
                </div>
                <div className="mt-1">
                  <div className="font-black text-sm text-yellow-300 truncate max-w-[100px] sm:max-w-[150px]">
                    {data.leaderboard[0]?.userName || 'Player 1'}
                  </div>
                  <div className="text-[10px] text-amber-200/80 font-mono">
                    ${data.leaderboard[0]?.totalWagered.toFixed(2)} Wager
                  </div>
                </div>
                <div className="w-full bg-yellow-500 text-black font-black text-xs py-1.5 rounded-xl shadow-md mt-2">
                  🏆 +${data.leaderboard[0]?.projectedPrize.toFixed(2)} USDT
                </div>
              </div>

              {/* 3rd Place */}
              <div className="bg-gradient-to-t from-amber-950/40 via-amber-900/30 to-amber-950/50 border border-amber-700/60 rounded-2xl p-3 text-center flex flex-col items-center justify-between min-h-[130px] shadow-lg relative">
                <div className="w-8 h-8 rounded-full bg-amber-800 border border-amber-600 flex items-center justify-center text-white font-black text-xs -mt-6 shadow-md">
                  🥉
                </div>
                <div className="mt-1">
                  <div className="font-extrabold text-xs text-white truncate max-w-[90px] sm:max-w-[130px]">
                    {data.leaderboard[2]?.userName || 'Player 3'}
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono">
                    ${data.leaderboard[2]?.totalWagered.toFixed(2)} Wager
                  </div>
                </div>
                <div className="w-full bg-amber-500/20 border border-amber-500/40 rounded-xl py-1 text-amber-300 font-black text-xs mt-2">
                  +${data.leaderboard[2]?.projectedPrize.toFixed(2)} USDT
                </div>
              </div>
            </div>
          )}

          {/* Full Leaderboard Table */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Medal className="w-4 h-4 text-amber-400" />
                Live Daily Bettor Standings (Top 20)
              </h3>
              <span className="text-[11px] text-slate-400">Updates live after each bet</span>
            </div>

            <div className="bg-[#060c16] border border-slate-800 rounded-2xl overflow-hidden shadow-md">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 text-[10px] uppercase text-slate-400 bg-[#091322]">
                      <th className="py-3 px-3">Rank</th>
                      <th className="py-3 px-3">Bettor</th>
                      <th className="py-3 px-3 text-right">Total Wagered</th>
                      <th className="py-3 px-3 text-center">Bets</th>
                      <th className="py-3 px-3 text-right">Projected Prize</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {data?.leaderboard && data.leaderboard.length > 0 ? (
                      data.leaderboard.map((item) => (
                        <tr
                          key={item.userId}
                          className={`hover:bg-slate-800/30 transition ${
                            item.rank === 1
                              ? 'bg-amber-500/10 font-bold'
                              : item.rank === 2
                              ? 'bg-slate-700/20 font-semibold'
                              : item.rank === 3
                              ? 'bg-amber-900/15'
                              : ''
                          }`}
                        >
                          <td className="py-3 px-3">
                            <span className={`w-6 h-6 rounded-full inline-flex items-center justify-center font-black text-xs ${
                              item.rank === 1
                                ? 'bg-yellow-400 text-black shadow-md'
                                : item.rank === 2
                                ? 'bg-slate-300 text-black'
                                : item.rank === 3
                                ? 'bg-amber-700 text-white'
                                : 'bg-slate-800 text-slate-300 border border-slate-700'
                            }`}>
                              {item.rank}
                            </span>
                          </td>
                          <td className="py-3 px-3">
                            <div className="font-bold text-white flex items-center gap-1.5">
                              <span>{item.userName}</span>
                              <span className="text-[10px] text-slate-500 font-mono">({item.userNodeId})</span>
                            </div>
                            <span className="text-[10px] text-cyan-400">{item.badge}</span>
                          </td>
                          <td className="py-3 px-3 text-right font-mono font-bold text-white">
                            ${item.totalWagered.toFixed(2)}
                          </td>
                          <td className="py-3 px-3 text-center font-mono text-slate-400">
                            {item.betsCount}
                          </td>
                          <td className="py-3 px-3 text-right font-mono font-extrabold text-emerald-400">
                            {item.projectedPrize > 0 ? `+$${item.projectedPrize.toFixed(2)}` : '—'}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-slate-500">
                          No bets placed in today's tournament yet. Be the first to wager and take #1 spot!
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Tournament Prize Rules Box */}
          <div className="bg-[#060c16] border border-slate-800 rounded-2xl p-4 space-y-2 text-xs">
            <div className="text-amber-400 font-bold text-xs uppercase flex items-center gap-2">
              <Award className="w-4 h-4 text-amber-400" />
              Tournament Rules & Prize Distribution
            </div>
            <div className="text-slate-300 font-sans leading-relaxed text-[11px] space-y-1.5">
              <p>
                1. Every real bet placed across Win Go Color Prediction, Dragon vs Tiger, and Aviator automatically counts towards your Daily Wager Volume.
              </p>
              <p>
                2. <strong>Prize Allocation:</strong>{' '}
                {data?.prizeBreakdown && data.prizeBreakdown.length > 0 ? (
                  data.prizeBreakdown.slice(0, 4).map((p) => `Rank ${p.rank} (${p.percent}%)`).join(', ') +
                  (data.prizeBreakdown.length > 4 ? ` and Top ${data.prizeBreakdown.length} share remainder.` : '.')
                ) : (
                  'Rank 1 (40%), Rank 2 (25%), Rank 3 (15%), Top 10 share remainder.'
                )}
              </p>
              <p>
                3. <strong>Min Wager Rule:</strong> Minimum <strong>${(data?.minWagerToQualify ?? 10).toFixed(2)} USDT</strong> total wager required to qualify for prize payout.
              </p>
              <p>
                4. Prizes are calculated daily at 00:00 UTC and automatically credited to your <strong>Winning Wallet</strong> with 100% instant withdrawal!
              </p>
            </div>
          </div>
        </div>

        {/* Footer CTA */}
        <div className="p-4 bg-[#060b14] border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="text-xs text-slate-400 text-center sm:text-left">
            Increase your rank by playing <strong className="text-amber-400">Win Go, Dragon Tiger & Aviator</strong>.
          </div>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              onClick={onClose}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition"
            >
              Close
            </button>
            {onNavigateToGames && (
              <button
                onClick={() => {
                  onClose();
                  onNavigateToGames();
                }}
                className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-black font-extrabold text-xs transition shadow-[0_0_15px_rgba(245,158,11,0.3)] flex items-center justify-center gap-1.5"
              >
                <Flame className="w-4 h-4" />
                Play & Climb Now →
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
