import React, { useState } from 'react';
import { Disc, ShoppingBag, Sparkles, ShieldCheck, Ticket, Gift, Clock, Flame } from 'lucide-react';
import confetti from 'canvas-confetti';
import { User, SystemSettings, SpinReward } from '../types';

interface GamificationViewProps {
  user: User;
  settings: SystemSettings;
  onSpinWheel: () => Promise<SpinReward | null>;
  onBuySpinTicket?: (qty: number) => Promise<boolean>;
  onClaimRankBonus?: (rankId: string) => Promise<void>;
}

export const GamificationView: React.FC<GamificationViewProps> = ({
  user,
  settings,
  onSpinWheel,
  onBuySpinTicket,
}) => {
  const [spinning, setSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [wonReward, setWonReward] = useState<SpinReward | null>(null);
  const [buyQty, setBuyQty] = useState<number>(1);
  const [buying, setBuying] = useState(false);

  const rewards = settings.spinWheelRewards || [];
  const ticketPrice = settings.spinTicketPrice !== undefined ? Number(settings.spinTicketPrice) : 1.0;
  const intervalHours = settings.spinWheelIntervalHours || 24;

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

    // Calculate rotation: cumulative 360-degree spins plus exact target angle for pointer at top (12 o'clock / 270 deg)
    const rewardIndex = rewards.findIndex((r) => r.id === reward.id || (r.label === reward.label && r.amount === reward.amount));
    const targetIdx = rewardIndex !== -1 ? rewardIndex : 0;
    const sliceAngle = 360 / (rewards.length || 1);
    const targetMidAngle = (targetIdx + 0.5) * sliceAngle;

    // Pointer is at 12 o'clock (270deg in SVG polar space).
    const targetOffset = (270 - targetMidAngle + 3600) % 360;
    const currentBase = Math.ceil(rotation / 360) * 360;
    const extraRounds = 360 * 8; // 8 full 360-degree rotations
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

  const handleBuyTickets = async (qty: number) => {
    if (!onBuySpinTicket || buying) return;
    setBuying(true);
    await onBuySpinTicket(qty);
    setBuying(false);
  };

  const totalProbWeight = rewards.reduce((sum, r) => sum + (r.probability || 0), 0);

  return (
    <div className="space-y-6 font-mono pb-12">
      {/* INTERACTIVE SPIN WHEEL HEADER */}
      <div className="bg-gradient-to-r from-[#0d1728] via-[#091220] to-[#0d1728] border border-pink-500/30 rounded-3xl p-6 md:p-8 relative overflow-hidden shadow-[0_0_30px_rgba(236,72,153,0.15)]">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          {/* Wheel Controls & Info */}
          <div className="space-y-5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 bg-pink-500/10 border border-pink-500/30 px-3 py-1 rounded-full text-xs font-bold text-pink-400 uppercase">
                <Disc className="w-4 h-4 animate-spin text-pink-400" />
                Lucky Spin Wheel
              </span>
              <span className="inline-flex items-center gap-1 bg-amber-500/10 border border-amber-500/30 px-3 py-1 rounded-full text-xs font-bold text-amber-400 uppercase">
                <Ticket className="w-3.5 h-3.5" />
                ${ticketPrice.toFixed(2)} / Spin
              </span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Spin & Win Up To <span className="text-pink-400">$50.00 USDT</span> Instant
            </h2>

            <p className="text-xs text-slate-300 leading-relaxed">
              Spin the wheel to win instant cash rewards credited straight to your Winning Wallet! Earn free daily spins, bonus spins on package activation & deposits, or buy extra spin tickets anytime.
            </p>

            {/* Spin Credit Balance Card */}
            <div className="bg-[#050911] border border-slate-800 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold block">
                  Your Available Spin Credits
                </span>
                <div className="text-2xl sm:text-3xl font-extrabold text-pink-400 flex items-center gap-2">
                  <span>{user.spinCredits}</span>
                  <span className="text-xs font-bold text-slate-400">Spins</span>
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

            {/* Win Alert Banner */}
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

          {/* Wheel Graphic Visual */}
          <div className="flex justify-center items-center relative">
            <div className="relative w-72 h-72 sm:w-80 sm:h-80 flex items-center justify-center">
              {/* Top Pointer Arrow */}
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-30 w-0 h-0 border-l-[14px] border-l-transparent border-r-[14px] border-r-transparent border-t-[24px] border-t-pink-500 drop-shadow-[0_0_15px_#ec4899]" />

              {/* Rotating SVG Wheel Container */}
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
                <svg viewBox="0 0 100 100" className="w-full h-full block">
                  {rewards.map((r, idx) => {
                    const sliceAngle = 360 / (rewards.length || 1);
                    const startAngle = idx * sliceAngle;
                    const endAngle = (idx + 1) * sliceAngle;
                    const midAngle = startAngle + sliceAngle / 2;
                    const midRad = (Math.PI * midAngle) / 180;

                    const x1 = 50 + 50 * Math.cos((Math.PI * startAngle) / 180);
                    const y1 = 50 + 50 * Math.sin((Math.PI * startAngle) / 180);
                    const x2 = 50 + 50 * Math.cos((Math.PI * endAngle) / 180);
                    const y2 = 50 + 50 * Math.sin((Math.PI * endAngle) / 180);

                    const pathData = `M 50 50 L ${x1} ${y1} A 50 50 0 0 1 ${x2} ${y2} Z`;

                    // Text coordinates centered along the slice radius
                    const textX = 50 + 32 * Math.cos(midRad);
                    const textY = 50 + 32 * Math.sin(midRad);

                    return (
                      <g key={r.id}>
                        <path d={pathData} fill={r.color} opacity={0.9} stroke="#050911" strokeWidth="0.8" />
                        <text
                          x={textX}
                          y={textY}
                          fill="#ffffff"
                          fontSize="3.5"
                          fontWeight="900"
                          textAnchor="middle"
                          dominantBaseline="central"
                          transform={`rotate(${midAngle}, ${textX}, ${textY})`}
                          style={{ textShadow: '0 1px 3px rgba(0,0,0,0.9)' }}
                        >
                          {r.label}
                        </text>
                      </g>
                    );
                  })}
                </svg>
              </div>

              {/* Static Center Hub Badge */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-pink-500 via-purple-600 to-indigo-900 border-2 border-white shadow-[0_0_20px_rgba(236,72,153,0.9)] flex items-center justify-center text-white font-extrabold text-[11px] tracking-tighter">
                  SPIN
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 2: BUY SPIN TICKETS WITH BALANCE */}
      <div className="bg-[#0b1320] border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-4">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-amber-400" />
              Buy Extra Spin Tickets
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Purchase spin credits directly using your main deposit balance @ <span className="text-amber-400 font-bold">${ticketPrice.toFixed(2)} USDT</span> per spin.
            </p>
          </div>
          <div className="text-right">
            <span className="text-[10px] text-slate-400 uppercase block font-bold">Main Balance</span>
            <span className="text-sm font-extrabold text-emerald-400">${(user.balance || 0).toFixed(2)} USDT</span>
          </div>
        </div>

        {/* Preset Packages */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[1, 5, 10].map((count) => {
            const cost = count * ticketPrice;
            const canAfford = (user.balance || 0) >= cost;

            return (
              <button
                key={count}
                onClick={() => handleBuyTickets(count)}
                disabled={!canAfford || buying}
                className={`p-4 rounded-2xl border text-left transition flex flex-col justify-between gap-2 ${
                  canAfford
                    ? 'bg-[#0e1a2e] border-amber-500/30 hover:border-amber-400 hover:bg-[#12223c]'
                    : 'bg-slate-900/50 border-slate-800 opacity-60 cursor-not-allowed'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-extrabold text-white flex items-center gap-1.5">
                    <Ticket className="w-4 h-4 text-amber-400" />
                    {count} {count === 1 ? 'Spin Ticket' : 'Spin Tickets'}
                  </span>
                  <span className="text-xs font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20">
                    ${cost.toFixed(2)}
                  </span>
                </div>
                <div className="text-[11px] text-slate-400">
                  Instant credit to spin balance
                </div>
              </button>
            );
          })}
        </div>

        {/* Custom Ticket Amount Input */}
        <div className="bg-[#050911] border border-slate-800 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Ticket className="w-5 h-5 text-purple-400 shrink-0" />
            <div>
              <span className="text-xs font-bold text-white block">Custom Spin Quantity</span>
              <span className="text-[10px] text-slate-400">Select any quantity (1 to 100)</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="number"
              min="1"
              max="100"
              value={buyQty}
              onChange={(e) => setBuyQty(Math.max(1, parseInt(e.target.value) || 1))}
              className="w-20 bg-[#0d1726] border border-slate-700 rounded-xl px-3 py-2 text-white font-extrabold text-xs text-center focus:outline-none focus:border-purple-400"
            />
            <button
              onClick={() => handleBuyTickets(buyQty)}
              disabled={(user.balance || 0) < buyQty * ticketPrice || buying}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
                (user.balance || 0) >= buyQty * ticketPrice && !buying
                  ? 'bg-amber-500 hover:bg-amber-400 text-black font-extrabold shadow-md'
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed'
              }`}
            >
              {buying ? 'Processing...' : `Buy for $${(buyQty * ticketPrice).toFixed(2)}`}
            </button>
          </div>
        </div>
      </div>

      {/* SECTION 3: WAYS TO EARN FREE SPINS & REWARDS BREAKDOWN */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Ways To Earn Free Spins */}
        <div className="bg-[#0b1320] border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2 border-b border-slate-800 pb-3">
            <Gift className="w-4 h-4 text-purple-400" />
            How To Earn Bonus Spin Credits
          </h3>

          <div className="space-y-3 text-xs">
            <div className="bg-[#050911] border border-slate-800/80 p-3.5 rounded-2xl flex items-start gap-3">
              <Clock className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-slate-200 block">1. Free Daily Recharge</span>
                <span className="text-slate-400 text-[11px]">
                  Get {settings.spinCreditsPerReset || 1} free spin credit automatically every {intervalHours} hours cycle.
                </span>
              </div>
            </div>

            <div className="bg-[#050911] border border-slate-800/80 p-3.5 rounded-2xl flex items-start gap-3">
              <Flame className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-slate-200 block">2. Package Purchase Bonus</span>
                <span className="text-slate-400 text-[11px]">
                  Activate MLM Investment Packages to receive bonus spins instantly (1 Spin per $10 package value).
                </span>
              </div>
            </div>

            <div className="bg-[#050911] border border-slate-800/80 p-3.5 rounded-2xl flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-slate-200 block">3. Deposit Approval Bonus</span>
                <span className="text-slate-400 text-[11px]">
                  Every approved deposit gets bonus spin credits credited straight to your account (1 Spin per $10 deposited).
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Wheel Odds & Rewards Table */}
        <div className="bg-[#0b1320] border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-pink-400" />
              Wheel Slices & Winning Probability
            </h3>
            <span className="text-[10px] text-pink-400 font-bold bg-pink-500/10 border border-pink-500/20 px-2 py-0.5 rounded-md">
              100% Provably Fair
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead>
                <tr className="border-b border-slate-800 text-[10px] uppercase text-slate-500 font-semibold">
                  <th className="py-2 px-1">Slice Reward</th>
                  <th className="py-2 px-1">Payout ($)</th>
                  <th className="py-2 px-1 text-right">Probability Weight</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50 text-[11px]">
                {rewards.map((r) => {
                  const probPercent = totalProbWeight > 0 ? ((r.probability / totalProbWeight) * 100).toFixed(1) : '0';

                  return (
                    <tr key={r.id} className="hover:bg-slate-800/30">
                      <td className="py-2.5 px-1 font-bold flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: r.color }} />
                        <span className="text-white">{r.label}</span>
                      </td>
                      <td className="py-2.5 px-1 font-mono font-bold text-emerald-400">
                        {r.amount > 0 ? `$${r.amount.toFixed(2)}` : '$0.00'}
                      </td>
                      <td className="py-2.5 px-1 font-mono text-right font-extrabold text-pink-400">
                        {probPercent}%
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
