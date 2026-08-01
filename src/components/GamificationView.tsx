import React, { useState } from 'react';
import {
  Disc,
  Award,
  Crown,
  Shield,
  Gem,
  Zap,
  CheckCircle2,
  Sparkles,
  RotateCcw,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { User, SystemSettings, SpinReward } from '../types';

interface GamificationViewProps {
  user: User;
  settings: SystemSettings;
  onSpinWheel: () => Promise<SpinReward | null>;
  onClaimRankBonus: (rankId: string) => Promise<void>;
}

export const GamificationView: React.FC<GamificationViewProps> = ({
  user,
  settings,
  onSpinWheel,
  onClaimRankBonus,
}) => {
  const [spinning, setSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [wonReward, setWonReward] = useState<SpinReward | null>(null);
  const [claimingRankId, setClaimingRankId] = useState<string | null>(null);

  const rewards = settings.spinWheelRewards;

  const handleSpinClick = async () => {
    if (user.spinCredits <= 0 || spinning) return;

    setSpinning(true);
    setWonReward(null);

    // Call server API to pick winning reward
    const reward = await onSpinWheel();

    if (!reward) {
      setSpinning(false);
      return;
    }

    // Play tick sound using Web Audio API during spin
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const playTicks = (count: number, delay: number) => {
        if (count <= 0) return;
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(600 + Math.random() * 200, audioCtx.currentTime);
        gain.gain.setValueAtTime(0.05, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.05);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.05);

        setTimeout(() => {
          playTicks(count - 1, delay * 1.08); // Decelerating ticks
        }, delay);
      };
      playTicks(28, 60);
    } catch (e) {
      // Audio fallback silent
    }

    // Calculate rotation: cumulative 360-degree spins plus exact target angle for pointer at top (12 o'clock)
    const rewardIndex = rewards.findIndex((r) => r.id === reward.id);
    const sliceAngle = 360 / rewards.length;
    
    // Pointer is at 12 o'clock (270deg in SVG space).
    // Target slice center angle = (rewardIndex + 0.5) * sliceAngle
    const targetOffset = (270 - (rewardIndex + 0.5) * sliceAngle + 3600) % 360;
    const currentBase = Math.ceil(rotation / 360) * 360;
    const extraRounds = 360 * 8; // 8 full 360-degree rotations for dramatic spin effect
    const finalRotation = currentBase + extraRounds + targetOffset;

    setRotation(finalRotation);

    setTimeout(() => {
      setSpinning(false);
      setWonReward(reward);

      if (reward.amount > 0) {
        confetti({
          particleCount: 120,
          spread: 80,
          origin: { y: 0.6 },
        });
      }
    }, 4500);
  };

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
    <div className="space-y-10 font-mono pb-12">
      {/* SECTION 1: INTERACTIVE SPIN WHEEL */}
      <div className="bg-gradient-to-r from-[#0d1728] via-[#091220] to-[#0d1728] border border-pink-500/30 rounded-3xl p-6 md:p-8 relative overflow-hidden shadow-[0_0_30px_rgba(236,72,153,0.1)]">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          {/* Wheel Description */}
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 bg-pink-500/10 border border-pink-500/30 px-3 py-1 rounded-full text-xs font-bold text-pink-400 uppercase">
              <Disc className="w-4 h-4 animate-spin" />
              Cyber Daily Spin Wheel
            </div>
            <h2 className="text-3xl font-extrabold text-white tracking-tight">
              Spin & Win Up To <span className="text-pink-400">$50 USDT</span> Instant
            </h2>
            <p className="text-xs text-slate-300 leading-relaxed">
              Earn free spin credits every day or when you activate package upgrades and refer active direct nodes!
            </p>

            <div className="bg-[#050911] border border-slate-800 rounded-2xl p-4 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold">
                  Spin Credits Left
                </span>
                <div className="text-2xl font-extrabold text-pink-400">
                  {user.spinCredits} Spins
                </div>
              </div>
              <button
                onClick={handleSpinClick}
                disabled={user.spinCredits <= 0 || spinning}
                className={`px-6 py-3.5 rounded-xl font-extrabold text-xs transition shadow-lg ${
                  user.spinCredits > 0 && !spinning
                    ? 'bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-400 hover:to-purple-500 text-white shadow-[0_0_20px_rgba(236,72,153,0.4)]'
                    : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                }`}
              >
                {spinning ? 'Spinning Wheel...' : 'SPIN WHEEL NOW'}
              </button>
            </div>

            {wonReward && (
              <div className="p-4 bg-emerald-500/20 border border-emerald-500/50 rounded-2xl text-center space-y-1 animate-bounce">
                <span className="text-xs font-bold text-emerald-300 uppercase">
                  🎉 Congratulations!
                </span>
                <div className="text-xl font-extrabold text-white">
                  You won {wonReward.label}!
                </div>
              </div>
            )}
          </div>

          {/* Wheel Graphic */}
          <div className="flex justify-center items-center relative">
            <div className="relative w-72 h-72 sm:w-80 sm:h-80 flex items-center justify-center">
              {/* Top Pointer Arrow */}
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-30 w-0 h-0 border-l-[14px] border-l-transparent border-r-[14px] border-r-transparent border-t-[24px] border-t-pink-500 drop-shadow-[0_0_15px_#ec4899]" />

              {/* Rotating Wheel Container - Sharp Hardware Accelerated Rotation */}
              <div
                className="w-full h-full rounded-full border-4 border-pink-500/80 shadow-[0_0_50px_rgba(236,72,153,0.4)] relative overflow-hidden shrink-0"
                style={{
                  transform: `rotate(${rotation}deg)`,
                  transformOrigin: '50% 50%',
                  WebkitTransformOrigin: '50% 50%',
                  willChange: 'transform',
                  backfaceVisibility: 'hidden',
                  WebkitBackfaceVisibility: 'hidden',
                  transitionDuration: spinning ? '4.5s' : '0s',
                  transitionTimingFunction: 'cubic-bezier(0.15, 0.85, 0.2, 1.0)',
                }}
              >
                {/* SVG Wheel Slices */}
                <svg viewBox="0 0 100 100" className="w-full h-full block">
                  {rewards.map((r, idx) => {
                    const sliceAngle = 360 / rewards.length;
                    const startAngle = idx * sliceAngle;
                    const endAngle = (idx + 1) * sliceAngle;

                    const x1 = 50 + 50 * Math.cos((Math.PI * startAngle) / 180);
                    const y1 = 50 + 50 * Math.sin((Math.PI * startAngle) / 180);
                    const x2 = 50 + 50 * Math.cos((Math.PI * endAngle) / 180);
                    const y2 = 50 + 50 * Math.sin((Math.PI * endAngle) / 180);

                    const pathData = `M 50 50 L ${x1} ${y1} A 50 50 0 0 1 ${x2} ${y2} Z`;

                    return (
                      <g key={r.id}>
                        <path d={pathData} fill={r.color} opacity={0.9} stroke="#050911" strokeWidth="0.8" />
                        <text
                          x="50"
                          y="18"
                          fill="#ffffff"
                          fontSize="3.8"
                          fontWeight="900"
                          textAnchor="middle"
                          transform={`rotate(${startAngle + sliceAngle / 2}, 50, 50)`}
                          style={{ textShadow: '0 1px 3px rgba(0,0,0,0.8)' }}
                        >
                          {r.label}
                        </text>
                      </g>
                    );
                  })}
                </svg>
              </div>

              {/* Static Center Hub Badge (Stays perfectly still & sharp in middle) */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-pink-500 via-purple-600 to-indigo-900 border-2 border-white shadow-[0_0_20px_rgba(236,72,153,0.9)] flex items-center justify-center text-white font-extrabold text-[11px] tracking-tighter">
                  SPIN
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 2: RANK LEADERSHIP REWARDS */}
      <div className="space-y-4">
        <div>
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-200 flex items-center gap-2">
            <Award className="w-4 h-4 text-amber-400" />
            Leadership Rank Qualification & One-Time Bonuses
          </h3>
          <p className="text-xs text-slate-400">
            Build team volume and direct referrals to unlock rank status and claim USDT rewards.
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
