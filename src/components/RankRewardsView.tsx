import React, { useState } from 'react';
import { Award, Crown, Shield, Gem, Zap, CheckCircle2, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';
import { User, SystemSettings } from '../types';

interface RankRewardsViewProps {
  user: User;
  settings: SystemSettings;
  onClaimRankBonus: (rankId: string) => Promise<void>;
}

export const RankRewardsView: React.FC<RankRewardsViewProps> = ({
  user,
  settings,
  onClaimRankBonus,
}) => {
  const [claimingRankId, setClaimingRankId] = useState<string | null>(null);

  const handleClaimRank = async (rankId: string) => {
    setClaimingRankId(rankId);
    try {
      await onClaimRankBonus(rankId);
      confetti({
        particleCount: 120,
        spread: 90,
        origin: { y: 0.5 },
      });
    } finally {
      setClaimingRankId(null);
    }
  };

  return (
    <div className="space-y-6 font-mono pb-12">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-[#0d1728] via-[#0b1626] to-[#0a1220] border border-amber-500/40 rounded-3xl p-6 md:p-8 relative overflow-hidden shadow-[0_0_25px_rgba(245,158,11,0.15)]">
        <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 bg-amber-500/10 border border-amber-500/30 px-3 py-1 rounded-full text-xs font-bold text-amber-400 uppercase">
              <Award className="w-4 h-4 text-amber-400" />
              MLM Leadership Rewards
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Rank Leadership Qualification & Cash Bonuses
            </h2>
            <p className="text-xs text-slate-300 max-w-xl leading-relaxed">
              Build your team network volume and sponsor direct active nodes to qualify for prestigious leadership ranks and claim instant USDT rewards!
            </p>
          </div>

          <div className="bg-[#050911] border border-slate-800 rounded-2xl p-4 flex items-center gap-4 shrink-0">
            <Crown className="w-10 h-10 text-amber-400" />
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-bold block">Your Current Rank</span>
              <div className="text-lg font-extrabold text-amber-300">
                {user.rank && !['None', 'Unranked', 'No Rank', ''].includes(user.rank) ? user.rank : 'Member / Unranked'}
              </div>
              <span className="text-[10px] text-slate-400">{user.directReferralsCount} Direct Referrals Active</span>
            </div>
          </div>
        </div>
      </div>

      {/* Ranks Grid */}
      <div className="space-y-4">
        <div>
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-200 flex items-center gap-2">
            <Award className="w-4 h-4 text-amber-400" />
            Leadership Rank Qualifications
          </h3>
          <p className="text-xs text-slate-400">
            Meet the criteria for each rank tier below to claim your bonus payout.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {settings.ranks.map((rank) => {
            const isCurrentRank = user.rank === rank.name;

            return (
              <div
                key={rank.id}
                className={`bg-[#0c1524] rounded-2xl p-5 border flex flex-col justify-between space-y-4 transition ${
                  isCurrentRank
                    ? 'border-amber-500/80 shadow-[0_0_20px_rgba(245,158,11,0.2)]'
                    : 'border-slate-800 hover:border-amber-500/40'
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                    <span className="text-xs font-extrabold text-amber-300 uppercase flex items-center gap-1.5">
                      <Crown className="w-4 h-4" style={{ color: rank.color || '#f59e0b' }} />
                      {rank.name} Rank
                    </span>
                    <span
                      className="px-2 py-0.5 rounded text-[10px] font-bold uppercase border"
                      style={{
                        backgroundColor: `${rank.color || '#f59e0b'}15`,
                        color: rank.color || '#f59e0b',
                        borderColor: `${rank.color || '#f59e0b'}40`,
                      }}
                    >
                      {rank.name}
                    </span>
                  </div>

                  {/* Reward Details */}
                  <div className="bg-[#050911] border border-emerald-500/30 rounded-xl p-3">
                    <div className="text-[10px] text-slate-400 font-bold uppercase">Rank Prize / Reward</div>
                    <div className="text-sm font-extrabold text-white flex items-center justify-between">
                      <span className="text-emerald-300 truncate">{rank.rewardTitle || 'Cash Bonus'}</span>
                      <span className="text-emerald-400 font-extrabold shrink-0">${rank.bonusUsdt} USDT</span>
                    </div>
                  </div>

                  {/* Criteria Grid */}
                  <div className="space-y-1.5 text-xs text-slate-300 pt-1">
                    <div className="text-[10px] font-bold uppercase text-amber-400/90 tracking-wider">
                      Qualification Conditions:
                    </div>

                    <div className="grid grid-cols-2 gap-1.5 text-[10px]">
                      <div className="bg-[#070e1b] border border-slate-800 p-2 rounded-lg">
                        <span className="text-slate-400 block text-[9px] uppercase">Self Active Pkg</span>
                        <span className="font-bold text-cyan-300">${rank.minSelfPackagePrice || 0}+</span>
                      </div>

                      <div className="bg-[#070e1b] border border-slate-800 p-2 rounded-lg">
                        <span className="text-slate-400 block text-[9px] uppercase">Direct Sponsors</span>
                        <span className="font-bold text-indigo-300">
                          {user.directReferralsCount} / {rank.requiredDirects || 0}
                        </span>
                      </div>

                      <div className="bg-[#070e1b] border border-slate-800 p-2 rounded-lg">
                        <span className="text-slate-400 block text-[9px] uppercase">Same Pkg Team</span>
                        <span className="font-bold text-purple-300">{rank.requiredSamePackageCount || 0} Users</span>
                      </div>

                      <div className="bg-[#070e1b] border border-slate-800 p-2 rounded-lg">
                        <span className="text-slate-400 block text-[9px] uppercase">Up to Level</span>
                        <span className="font-bold text-pink-300">
                          {rank.upToLevel && rank.upToLevel > 0 ? `Level ${rank.upToLevel}` : 'Unlimited'}
                        </span>
                      </div>
                    </div>

                    {rank.requiredVolume && rank.requiredVolume > 0 ? (
                      <div className="flex justify-between text-[11px] bg-[#070e1b] p-2 rounded-lg border border-slate-800 mt-1">
                        <span className="text-slate-400">Req. Team Volume:</span>
                        <span className="font-bold text-amber-300">${rank.requiredVolume.toLocaleString()}</span>
                      </div>
                    ) : null}
                  </div>
                </div>

                <button
                  onClick={() => handleClaimRank(rank.id)}
                  disabled={claimingRankId === rank.id}
                  className="w-full py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black shadow-md"
                >
                  {claimingRankId === rank.id ? 'Validating Qualification...' : 'Claim Rank Reward'}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
