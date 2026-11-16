import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Shield, RotateCw, Plus, Minus, Gift, Ticket, Trophy, Sparkles, Check, ChevronDown, ChevronUp, Wallet } from 'lucide-react';
import confetti from 'canvas-confetti';
import { User, SystemSettings, SpinReward } from '../types';

interface GamificationViewProps {
  user: User;
  settings: SystemSettings;
  onSpinWheel?: () => Promise<SpinReward | null>;
  onBuySpinTicket?: (qty: number) => Promise<boolean>;
  onDailyCheckin?: () => Promise<void>;
  onOpenTournament?: () => void;
  onClaimRankBonus?: (rankId: string) => Promise<void>;
  onOpenDeposit?: () => void;
  onBack?: () => void;
  onRefreshUser?: () => void;
}

// 16 Slices configuration exactly matching the reference image:
// Slice 0 (Top / 12 o'clock): Golden sector with Treasure Chest (14X / 40X)
// Slices 1..15: Alternating sectors (Deep Ruby Magenta vs Azure Sky Blue) with Pink & Blue Faceted Diamonds
interface WheelSlice {
  index: number;
  type: 'chest' | 'pink_diamond' | 'blue_diamond';
  bgColor: string;
  gemColor: 'chest' | 'pink' | 'blue';
}

const WHEEL_SLICES: WheelSlice[] = [
  { index: 0, type: 'chest', bgColor: '#ffea79', gemColor: 'chest' },       // 12 o'clock - Gold Treasure Chest
  { index: 1, type: 'pink_diamond', bgColor: '#1976d2', gemColor: 'pink' }, // Blue slice, pink gem
  { index: 2, type: 'blue_diamond', bgColor: '#ad1457', gemColor: 'blue' }, // Pink slice, blue gem
  { index: 3, type: 'pink_diamond', bgColor: '#1976d2', gemColor: 'pink' }, // Blue slice, pink gem
  { index: 4, type: 'blue_diamond', bgColor: '#ad1457', gemColor: 'blue' }, // Pink slice, blue gem
  { index: 5, type: 'pink_diamond', bgColor: '#1976d2', gemColor: 'pink' }, // Blue slice, pink gem
  { index: 6, type: 'blue_diamond', bgColor: '#ad1457', gemColor: 'blue' }, // Pink slice, blue gem
  { index: 7, type: 'pink_diamond', bgColor: '#1976d2', gemColor: 'pink' }, // Blue slice, pink gem
  { index: 8, type: 'pink_diamond', bgColor: '#ad1457', gemColor: 'pink' }, // Pink slice, pink gem
  { index: 9, type: 'blue_diamond', bgColor: '#1976d2', gemColor: 'blue' }, // Blue slice, blue gem
  { index: 10, type: 'pink_diamond', bgColor: '#ad1457', gemColor: 'pink' },// Pink slice, pink gem
  { index: 11, type: 'blue_diamond', bgColor: '#1976d2', gemColor: 'blue' },// Blue slice, blue gem
  { index: 12, type: 'pink_diamond', bgColor: '#ad1457', gemColor: 'pink' },// Pink slice, pink gem
  { index: 13, type: 'blue_diamond', bgColor: '#1976d2', gemColor: 'blue' },// Blue slice, blue gem
  { index: 14, type: 'pink_diamond', bgColor: '#ad1457', gemColor: 'pink' },// Pink slice, pink gem
  { index: 15, type: 'blue_diamond', bgColor: '#1976d2', gemColor: 'blue' },// Blue slice, blue gem
];

export const GamificationView: React.FC<GamificationViewProps> = ({
  user,
  settings,
  onDailyCheckin,
  onOpenTournament,
  onOpenDeposit,
  onBack,
  onRefreshUser,
}) => {
  // Game states
  const [isHighRisk, setIsHighRisk] = useState<boolean>(false);
  const [betAmount, setBetAmount] = useState<number>(100);
  const [useFreeSpin, setUseFreeSpin] = useState<boolean>(user.spinCredits > 0);
  const [spinning, setSpinning] = useState<boolean>(false);
  const [rotation, setRotation] = useState<number>(0);
  const [winAmount, setWinAmount] = useState<number>(0);
  const [lastWinType, setLastWinType] = useState<string | null>(null);
  const [showExtras, setShowExtras] = useState<boolean>(false);
  const [checkingIn, setCheckingIn] = useState<boolean>(false);
  const [buyQty, setBuyQty] = useState<number>(1);
  const [buying, setBuying] = useState<boolean>(false);

  const totalBalance = (user.depositBalance || 0) + (user.winningBalance || 0) + (user.balance || 0);

  // Auto-switch to free spin if available initially
  useEffect(() => {
    if (user.spinCredits > 0) {
      setUseFreeSpin(true);
    }
  }, [user.spinCredits]);

  // Sound generator using Web Audio API
  const playWheelSound = (count: number, delay: number) => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const audioCtx = new AudioCtx();

      const tick = (remaining: number, currentDelay: number) => {
        if (remaining <= 0) return;
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(500 + Math.random() * 150, audioCtx.currentTime);
        gain.gain.setValueAtTime(0.04, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.04);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.04);

        setTimeout(() => {
          tick(remaining - 1, currentDelay * 1.09);
        }, currentDelay);
      };

      tick(count, delay);
    } catch (e) {
      // Audio playback fallback silent
    }
  };

  const playWinFanfare = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const audioCtx = new AudioCtx();
      const notes = [440, 554, 659, 880];
      notes.forEach((freq, i) => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, audioCtx.currentTime + i * 0.1);
        gain.gain.setValueAtTime(0.08, audioCtx.currentTime + i * 0.1);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + i * 0.1 + 0.3);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(audioCtx.currentTime + i * 0.1);
        osc.stop(audioCtx.currentTime + i * 0.1 + 0.3);
      });
    } catch (e) {
      // Silent fallback
    }
  };

  // Adjust Bet Amount
  const handleIncreaseBet = () => {
    const steps = [10, 20, 50, 100, 200, 500, 1000, 2000, 5000];
    const next = steps.find((s) => s > betAmount) || betAmount + 500;
    setBetAmount(next);
  };

  const handleDecreaseBet = () => {
    const steps = [10, 20, 50, 100, 200, 500, 1000, 2000, 5000];
    const prev = [...steps].reverse().find((s) => s < betAmount) || 10;
    setBetAmount(Math.max(10, prev));
  };

  // Core Spin Action
  const handleSpinClick = async () => {
    if (spinning) return;

    if (!useFreeSpin && totalBalance < betAmount) {
      alert(`Insufficient balance! Your balance is ₹${totalBalance.toFixed(2)}, but bet amount is ₹${betAmount}.`);
      return;
    }

    if (useFreeSpin && user.spinCredits <= 0) {
      setUseFreeSpin(false);
      return;
    }

    setSpinning(true);
    setLastWinType(null);

    try {
      // Call server authoritative spin endpoint
      const res = await fetch('/api/spin/play', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          betAmount: useFreeSpin ? 100 : betAmount,
          isHighRisk,
          useSpinCredit: useFreeSpin,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        alert(data.error || 'Failed to place spin bet');
        setSpinning(false);
        return;
      }

      // Calculate destination angle
      // 16 slices: 360 / 16 = 22.5 deg each.
      // Slice 0 is centered at top (12 o'clock, 0 deg).
      // When wheel rotates CLOCKWISE by angle R, the slice at 12 o'clock is: (16 - (R / 22.5) % 16) % 16
      // Therefore, to put sliceIndex at top: targetDeg = (16 - sliceIndex) * 22.5
      const sliceIdx = data.sliceIndex || 0;
      const sliceDeg = 360 / 16;
      const targetOffset = (16 - sliceIdx) * sliceDeg;

      // Add 7 to 9 full 360 turns to build suspense
      const fullRotations = 360 * 8;
      const currentMod = rotation % 360;
      let delta = targetOffset - currentMod;
      if (delta <= 0) delta += 360;
      const newRotation = rotation + fullRotations + delta;

      setRotation(newRotation);
      playWheelSound(24, 70);

      // Finish spin after 4.5s
      setTimeout(() => {
        setSpinning(false);
        setWinAmount(data.payout || 0);
        setLastWinType(data.type);

        if (data.payout > 0) {
          playWinFanfare();
          confetti({
            particleCount: data.type === 'chest' ? 120 : 60,
            spread: 70,
            origin: { y: 0.65 },
          });
        }

        if (data.isRespin) {
          confetti({
            particleCount: 50,
            spread: 50,
            origin: { y: 0.7 },
          });
        }

        if (onRefreshUser) onRefreshUser();
      }, 4500);
    } catch (err) {
      console.error('Error playing spin:', err);
      setSpinning(false);
    }
  };

  const handleDailyCheckinClick = async () => {
    if (checkingIn || !onDailyCheckin) return;
    setCheckingIn(true);
    try {
      await onDailyCheckin();
      confetti({ particleCount: 60, spread: 55, origin: { y: 0.7 } });
      if (onRefreshUser) onRefreshUser();
    } finally {
      setCheckingIn(false);
    }
  };

  const handleBuyTickets = async (qty: number) => {
    setBuying(true);
    try {
      const res = await fetch('/api/spin/buy-ticket', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ qty }),
      });
      const data = await res.json();
      if (data.success) {
        confetti({ particleCount: 50, spread: 50, origin: { y: 0.6 } });
        if (onRefreshUser) onRefreshUser();
      } else {
        alert(data.error || 'Failed to buy tickets');
      }
    } finally {
      setBuying(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#071638] text-white flex flex-col items-center justify-start pb-20 select-none overflow-x-hidden font-sans">
      {/* 1. TOP HEADER - IDENTICAL TO SCREENSHOT */}
      <header className="w-full max-w-md px-4 pt-3 pb-2 flex items-center justify-between z-20">
        {/* Left: Back / Brand */}
        <div className="flex items-center gap-1.5">
          {onBack ? (
            <button
              onClick={onBack}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-950/70 border border-blue-700/60 hover:border-cyan-400 text-xs font-bold text-sky-200 hover:text-white transition active:scale-95 shadow cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-cyan-400" />
              <span>Back</span>
            </button>
          ) : (
            <div className="flex items-center gap-1 text-[11px] font-black tracking-tight text-white/90">
              <span className="text-cyan-400 font-extrabold">Slot</span>
              <span className="text-yellow-400">Catalog</span>
              <span className="text-[9px] text-slate-400">.com</span>
            </div>
          )}
        </div>

        {/* Center: Stylized Italic Golden "WHEEL" Title */}
        <div className="text-center">
          <h1
            className="text-2xl sm:text-3xl font-black italic tracking-wider uppercase"
            style={{
              color: '#ffc107',
              textShadow: '0 2px 0 #b37400, 0 4px 10px rgba(0,0,0,0.8), 0 0 15px rgba(255,193,7,0.4)',
              transform: 'skewX(-6deg)',
            }}
          >
            WHEEL
          </h1>
        </div>

        {/* Right: Provably Fair Shield Badge */}
        <div className="flex items-center gap-1">
          <div className="w-7 h-7 rounded-lg bg-blue-900/40 border border-blue-600/30 flex items-center justify-center text-blue-300 shadow">
            <Shield className="w-4 h-4 text-sky-400" />
          </div>
        </div>
      </header>

      {/* 2. THE MAIN STAGE: 2-TIER CONCENTRIC WHEEL */}
      <main className="w-full max-w-md flex flex-col items-center px-4 pt-1 pb-3 relative">
        {/* Wheel Container Box */}
        <div className="relative w-[320px] h-[320px] sm:w-[350px] sm:h-[350px] flex items-center justify-center my-2">
          {/* Ambient Radial Glow behind wheel */}
          <div className="absolute inset-4 rounded-full bg-blue-600/20 blur-2xl pointer-events-none" />

          {/* Outer Ring Drop Shadow & Metallic Rim */}
          <div className="absolute inset-0 rounded-full border-[6px] border-[#0c2e68] shadow-[0_10px_35px_rgba(0,0,0,0.8),inset_0_0_20px_rgba(0,0,0,0.8)] pointer-events-none z-10" />

          {/* ROTATING SVG WHEEL */}
          <div
            className="w-full h-full rounded-full relative overflow-hidden"
            style={{
              transform: `rotate(${rotation}deg)`,
              transformOrigin: '50% 50%',
              WebkitTransformOrigin: '50% 50%',
              willChange: 'transform',
              transitionDuration: spinning ? '4.5s' : '0s',
              transitionTimingFunction: 'cubic-bezier(0.12, 0.8, 0.25, 1.0)',
            }}
          >
            <svg viewBox="0 0 400 400" className="w-full h-full block">
              <defs>
                {/* Metallic and gem gradients */}
                <linearGradient id="goldChestGrad" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#fff385" />
                  <stop offset="50%" stopColor="#ffc107" />
                  <stop offset="100%" stopColor="#d38300" />
                </linearGradient>

                <linearGradient id="pinkGemGrad" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#ff94c2" />
                  <stop offset="40%" stopColor="#f06292" />
                  <stop offset="100%" stopColor="#c2185b" />
                </linearGradient>

                <linearGradient id="blueGemGrad" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#90caf9" />
                  <stop offset="40%" stopColor="#42a5f5" />
                  <stop offset="100%" stopColor="#1565c0" />
                </linearGradient>

                <radialGradient id="innerWheelGrad" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#1e5cb3" />
                  <stop offset="80%" stopColor="#123d7d" />
                  <stop offset="100%" stopColor="#0b2857" />
                </radialGradient>
              </defs>

              {/* TIER 1: OUTER 16 SLICES */}
              {WHEEL_SLICES.map((slice) => {
                const anglePerSlice = 360 / 16; // 22.5 deg
                // Center slice 0 at -90 deg (12 o'clock)
                const startAngle = slice.index * anglePerSlice - 90 - anglePerSlice / 2;
                const endAngle = startAngle + anglePerSlice;
                const midAngle = startAngle + anglePerSlice / 2;

                const radStart = (startAngle * Math.PI) / 180;
                const radEnd = (endAngle * Math.PI) / 180;
                const radMid = (midAngle * Math.PI) / 180;

                // Outer radius = 196, Inner radius = 135
                const R_out = 196;
                const R_in = 135;

                const x1 = 200 + R_out * Math.cos(radStart);
                const y1 = 200 + R_out * Math.sin(radStart);
                const x2 = 200 + R_out * Math.cos(radEnd);
                const y2 = 200 + R_out * Math.sin(radEnd);

                const x3 = 200 + R_in * Math.cos(radEnd);
                const y3 = 200 + R_in * Math.sin(radEnd);
                const x4 = 200 + R_in * Math.cos(radStart);
                const y4 = 200 + R_in * Math.sin(radStart);

                const pathData = `M ${x1} ${y1} A ${R_out} ${R_out} 0 0 1 ${x2} ${y2} L ${x3} ${y3} A ${R_in} ${R_in} 0 0 0 ${x4} ${y4} Z`;

                // Gem center position along mid angle at radius = 165
                const gemR = 165;
                const gemX = 200 + gemR * Math.cos(radMid);
                const gemY = 200 + gemR * Math.sin(radMid);

                return (
                  <g key={`slice-${slice.index}`}>
                    {/* Slice background */}
                    <path
                      d={pathData}
                      fill={slice.bgColor}
                      stroke="#0b234e"
                      strokeWidth="1.2"
                    />

                    {/* Subtle segment radial line / shade */}
                    <line
                      x1={x4}
                      y1={y4}
                      x2={x1}
                      y2={y1}
                      stroke="rgba(0,0,0,0.25)"
                      strokeWidth="1"
                    />

                    {/* GEM OR CHEST GRAPHIC */}
                    {slice.gemColor === 'chest' ? (
                      // 3D Treasure Chest at Slice 0
                      <g transform={`translate(${gemX}, ${gemY}) rotate(${midAngle + 90}) scale(0.95)`}>
                        {/* Chest base shadow */}
                        <ellipse cx="0" cy="14" rx="18" ry="4" fill="rgba(0,0,0,0.4)" />
                        {/* Chest wooden body */}
                        <path d="M -16 -2 L 16 -2 L 14 12 L -14 12 Z" fill="#b71c1c" stroke="#ffe082" strokeWidth="1" />
                        {/* Wooden plank stripes */}
                        <line x1="-15" y1="5" x2="15" y2="5" stroke="#7f0000" strokeWidth="1" />
                        {/* Golden corner brackets */}
                        <rect x="-16" y="-2" width="4" height="14" fill="#ffd54f" />
                        <rect x="12" y="-2" width="4" height="14" fill="#ffd54f" />
                        <rect x="-4" y="2" width="8" height="7" fill="#ffb300" rx="1" />
                        <circle cx="0" cy="5.5" r="1.2" fill="#3e2723" />
                        {/* Curved chest lid */}
                        <path d="M -16 -2 Q 0 -16 16 -2 Z" fill="#d32f2f" stroke="#ffe082" strokeWidth="1.2" />
                        <path d="M -12 -5 Q 0 -13 12 -5" fill="none" stroke="#ffd54f" strokeWidth="1.8" />
                        {/* Shiny gold coins peak */}
                        <circle cx="-5" cy="-2" r="2.5" fill="#fff59d" stroke="#fbc02d" strokeWidth="0.5" />
                        <circle cx="5" cy="-2" r="2.5" fill="#fff59d" stroke="#fbc02d" strokeWidth="0.5" />
                        <circle cx="0" cy="-3" r="3" fill="#ffe082" stroke="#fbc02d" strokeWidth="0.5" />
                      </g>
                    ) : slice.gemColor === 'pink' ? (
                      // 3D Faceted Pink Diamond
                      <g transform={`translate(${gemX}, ${gemY}) rotate(${midAngle + 90}) scale(0.85)`}>
                        {/* Top Table Facet */}
                        <polygon points="-7,-9 7,-9 12,-3 -12,-3" fill="#ff80ab" stroke="#f50057" strokeWidth="0.6" />
                        {/* Center Pavilion Facets */}
                        <polygon points="-12,-3 0,11 -4,-3" fill="#c2185b" stroke="#880e4f" strokeWidth="0.6" />
                        <polygon points="-4,-3 0,11 4,-3" fill="#f06292" stroke="#ad1457" strokeWidth="0.6" />
                        <polygon points="4,-3 0,11 12,-3" fill="#e91e63" stroke="#880e4f" strokeWidth="0.6" />
                        {/* Sparkle Highlight */}
                        <polygon points="-4,-7 -2,-8 -3,-6 -1,-7" fill="#ffffff" opacity="0.9" />
                      </g>
                    ) : (
                      // 3D Faceted Blue Diamond
                      <g transform={`translate(${gemX}, ${gemY}) rotate(${midAngle + 90}) scale(0.85)`}>
                        {/* Top Table Facet */}
                        <polygon points="-7,-9 7,-9 12,-3 -12,-3" fill="#82b1ff" stroke="#2979ff" strokeWidth="0.6" />
                        {/* Center Pavilion Facets */}
                        <polygon points="-12,-3 0,11 -4,-3" fill="#1565c0" stroke="#0d47a1" strokeWidth="0.6" />
                        <polygon points="-4,-3 0,11 4,-3" fill="#42a5f5" stroke="#1976d2" strokeWidth="0.6" />
                        <polygon points="4,-3 0,11 12,-3" fill="#1e88e5" stroke="#0d47a1" strokeWidth="0.6" />
                        {/* Sparkle Highlight */}
                        <polygon points="-4,-7 -2,-8 -3,-6 -1,-7" fill="#ffffff" opacity="0.9" />
                      </g>
                    )}
                  </g>
                );
              })}

              {/* TIER 2: INNER BLUE CONCENTRIC WHEEL */}
              <circle cx="200" cy="200" r="135" fill="url(#innerWheelGrad)" stroke="#092047" strokeWidth="2" />

              {/* Inner radial divider lines */}
              {Array.from({ length: 8 }).map((_, i) => {
                const angle = i * 45;
                const rad = (angle * Math.PI) / 180;
                const ix1 = 200 + 45 * Math.cos(rad);
                const iy1 = 200 + 45 * Math.sin(rad);
                const ix2 = 200 + 135 * Math.cos(rad);
                const iy2 = 200 + 135 * Math.sin(rad);
                return (
                  <line
                    key={`inner-line-${i}`}
                    x1={ix1}
                    y1={iy1}
                    x2={ix2}
                    y2={iy2}
                    stroke="rgba(255,255,255,0.08)"
                    strokeWidth="1.5"
                  />
                );
              })}

              {/* RE SPIN SECTOR (At 6 o'clock on the wheel, angle = 90 in polar SVG coordinates) */}
              {(() => {
                const rStart = (75 * Math.PI) / 180;
                const rEnd = (105 * Math.PI) / 180;
                const p1x = 200 + 135 * Math.cos(rStart);
                const p1y = 200 + 135 * Math.sin(rStart);
                const p2x = 200 + 135 * Math.cos(rEnd);
                const p2y = 200 + 135 * Math.sin(rEnd);
                const p3x = 200 + 45 * Math.cos(rEnd);
                const p3y = 200 + 45 * Math.sin(rEnd);
                const p4x = 200 + 45 * Math.cos(rStart);
                const p4y = 200 + 45 * Math.sin(rStart);

                const respinPath = `M ${p1x} ${p1y} A 135 135 0 0 1 ${p2x} ${p2y} L ${p3x} ${p3y} A 45 45 0 0 0 ${p4x} ${p4y} Z`;

                return (
                  <g>
                    <path d={respinPath} fill="#f4511e" stroke="#bf360c" strokeWidth="1" />
                    <text
                      x="200"
                      y="290"
                      fill="#ffffff"
                      fontSize="9.5"
                      fontWeight="900"
                      textAnchor="middle"
                      letterSpacing="1.2"
                      transform="rotate(90, 200, 290)"
                      style={{ textShadow: '0 1px 2px rgba(0,0,0,0.8)' }}
                    >
                      RE SPIN
                    </text>
                  </g>
                );
              })()}

              {/* CENTER HUB CAP */}
              <circle cx="200" cy="200" r="45" fill="#1565c0" stroke="#0d47a1" strokeWidth="3" />
              <circle cx="200" cy="200" r="22" fill="#1976d2" stroke="#42a5f5" strokeWidth="1.5" />
              <circle cx="200" cy="200" r="7" fill="#00e5ff" />
            </svg>
          </div>

          {/* STATIC OVERLAY: GOLDEN POINTER FRAME AT 12 O'CLOCK (EXACTLY AS IN SCREENSHOT) */}
          <div className="absolute inset-0 pointer-events-none z-30 flex items-center justify-center">
            <svg viewBox="0 0 400 400" className="w-full h-full block">
              <defs>
                <linearGradient id="pointerGoldGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#fff9c4" />
                  <stop offset="35%" stopColor="#ffeb3b" />
                  <stop offset="70%" stopColor="#fbc02d" />
                  <stop offset="100%" stopColor="#f57f17" />
                </linearGradient>

                <filter id="pointerShadow" x="-20%" y="-20%" width="140%" height="140%">
                  <feDropShadow dx="0" dy="4" stdDeviation="4" floodColor="#000000" floodOpacity="0.7" />
                </filter>
              </defs>

              {/* 12 o'clock Golden Pointer Wedge Frame */}
              <g filter="url(#pointerShadow)">
                {/* Outer frame wrapping the top segment */}
                <polygon
                  points="166,4 234,4 220,70 180,70"
                  fill="url(#pointerGoldGrad)"
                  stroke="#fff59d"
                  strokeWidth="2"
                  opacity="0.95"
                />

                {/* Inner cutout highlight */}
                <polygon
                  points="171,9 229,9 216,65 184,65"
                  fill="none"
                  stroke="#bf360c"
                  strokeWidth="0.8"
                  opacity="0.7"
                />

                {/* Top Outer Red Arrow pointing down */}
                <polygon points="200,10 193,1 207,1" fill="#d50000" stroke="#b71c1c" strokeWidth="0.8" />

                {/* Lower Golden Wedge extending to center hub */}
                <polygon
                  points="180,70 220,70 200,200"
                  fill="url(#pointerGoldGrad)"
                  stroke="#fff59d"
                  strokeWidth="2"
                  opacity="0.95"
                />

                {/* Inner Arrow pointer pointing down */}
                <polygon points="200,77 194,70 206,70" fill="#d50000" stroke="#b71c1c" strokeWidth="0.8" />

                {/* Bold Red "X2" Multiplier inside the inner pointer wedge */}
                <text
                  x="200"
                  y="125"
                  fill="#b71c1c"
                  fontSize="21"
                  fontWeight="900"
                  textAnchor="middle"
                  dominantBaseline="central"
                  transform="rotate(90, 200, 125)"
                  style={{
                    fontFamily: 'Arial Black, Impact, sans-serif',
                    textShadow: '0 1px 0 #ffebee, 0 2px 2px rgba(0,0,0,0.6)',
                  }}
                >
                  X2
                </text>
              </g>
            </svg>
          </div>
        </div>

        {/* 3. LOWER CONTROL PANEL - EXACT 1:1 MATCH TO SCREENSHOT */}
        <div className="w-full bg-[#0a1e48] border border-[#1b3d7a] rounded-3xl p-3.5 sm:p-4 mt-2 shadow-[0_10px_25px_rgba(0,0,0,0.5)] flex flex-col gap-3">
          {/* ROW 1: HIGH RISK SWITCH */}
          <div className="flex items-center justify-center gap-2.5">
            <span className="text-xs sm:text-sm font-black tracking-wider uppercase text-white">
              HIGH RISK
            </span>
            <button
              onClick={() => setIsHighRisk(!isHighRisk)}
              disabled={spinning}
              className={`relative inline-flex h-6 w-14 items-center rounded-full transition-colors focus:outline-none p-0.5 cursor-pointer ${
                isHighRisk ? 'bg-amber-500' : 'bg-slate-700/80 border border-slate-600'
              }`}
            >
              <span
                className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition-transform flex items-center justify-center text-[9px] font-black text-slate-800 ${
                  isHighRisk ? 'translate-x-8 text-amber-700' : 'translate-x-0'
                }`}
              >
                {isHighRisk ? 'ON' : 'OFF'}
              </span>
            </button>
          </div>

          {/* ROW 2: PAYOUT MULTIPLIERS (PINK GEM, CHEST, BLUE GEM) */}
          <div className="grid grid-cols-3 gap-2">
            {/* 1. Pink Gem Card */}
            <div className="bg-gradient-to-r from-[#ad1457] to-[#880e4f] border border-pink-400/40 rounded-xl py-2 px-1 flex items-center justify-center gap-1.5 shadow">
              {/* Pink Diamond Icon */}
              <svg viewBox="0 0 24 24" className="w-4 h-4 shrink-0 drop-shadow">
                <polygon points="6,3 18,3 22,9 12,21 2,9" fill="#ff80ab" stroke="#f50057" strokeWidth="1" />
                <polygon points="2,9 12,21 12,9" fill="#c2185b" />
                <polygon points="12,9 12,21 22,9" fill="#e91e63" />
              </svg>
              <span className="text-xs sm:text-sm font-black text-white tracking-wide">
                {isHighRisk ? '3 X' : '2 X'}
              </span>
            </div>

            {/* 2. Treasure Chest Card */}
            <div className="bg-gradient-to-r from-[#f59e0b] to-[#d97706] border border-amber-300/60 rounded-xl py-2 px-1 flex items-center justify-center gap-1.5 shadow">
              {/* Treasure Chest Icon */}
              <div className="text-sm shrink-0">📦</div>
              <span className="text-xs sm:text-sm font-black text-white tracking-wide">
                {isHighRisk ? '40 X' : '14 X'}
              </span>
            </div>

            {/* 3. Blue Gem Card */}
            <div className="bg-gradient-to-r from-[#1976d2] to-[#0d47a1] border border-blue-400/40 rounded-xl py-2 px-1 flex items-center justify-center gap-1.5 shadow">
              {/* Blue Diamond Icon */}
              <svg viewBox="0 0 24 24" className="w-4 h-4 shrink-0 drop-shadow">
                <polygon points="6,3 18,3 22,9 12,21 2,9" fill="#82b1ff" stroke="#2979ff" strokeWidth="1" />
                <polygon points="2,9 12,21 12,9" fill="#1565c0" />
                <polygon points="12,9 12,21 22,9" fill="#1e88e5" />
              </svg>
              <span className="text-xs sm:text-sm font-black text-white tracking-wide">
                {isHighRisk ? '3 X' : '2 X'}
              </span>
            </div>
          </div>

          {/* ROW 3: BALANCE & WIN STATS BAR */}
          <div className="flex items-center justify-between text-xs sm:text-sm font-mono pt-1 px-1">
            <div className="flex items-center gap-1 text-slate-200">
              <span className="text-slate-400 font-sans text-xs">Balance :</span>
              <span className="text-amber-400">🪙</span>
              <span className="font-black text-white">
                ₹{totalBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-slate-400 font-sans text-xs">WIN :</span>
              <span className={`font-black ${winAmount > 0 ? 'text-emerald-400 text-sm animate-pulse' : 'text-slate-300'}`}>
                {winAmount > 0 ? `₹${winAmount.toFixed(2)}` : '0'}
              </span>
            </div>
          </div>

          {/* ROW 4: ACTION CONTROLS (BET ADJUSTER + SPIN / AUTO BUTTON) */}
          <div className="grid grid-cols-2 gap-3 pt-1">
            {/* Left Button: Cyan-Blue Bet Adjuster */}
            <div className="bg-[#124285] hover:bg-[#154d9b] border border-cyan-400/30 rounded-2xl p-1.5 flex items-center justify-between shadow">
              <button
                onClick={handleDecreaseBet}
                disabled={spinning || useFreeSpin}
                className="w-8 h-8 rounded-xl bg-blue-900/80 hover:bg-cyan-600/40 active:scale-95 text-white font-bold flex items-center justify-center transition disabled:opacity-40"
              >
                <Minus className="w-4 h-4 text-cyan-300" />
              </button>

              <div className="text-center px-1">
                <span className="text-[10px] text-cyan-300 uppercase block font-bold leading-none">
                  {useFreeSpin ? 'Free Spin' : 'Bet'}
                </span>
                <span className="text-base font-black text-white">
                  {useFreeSpin ? '1 🎟️' : betAmount}
                </span>
              </div>

              <button
                onClick={handleIncreaseBet}
                disabled={spinning || useFreeSpin}
                className="w-8 h-8 rounded-xl bg-blue-900/80 hover:bg-cyan-600/40 active:scale-95 text-white font-bold flex items-center justify-center transition disabled:opacity-40"
              >
                <Plus className="w-4 h-4 text-cyan-300" />
              </button>
            </div>

            {/* Right Button: Golden-Yellow SPIN Button */}
            <button
              onClick={handleSpinClick}
              disabled={spinning}
              className={`w-full h-full py-2.5 px-4 rounded-2xl font-black text-sm sm:text-base tracking-wide transition shadow-lg flex items-center justify-center gap-2 active:scale-95 cursor-pointer ${
                spinning
                  ? 'bg-amber-600/80 text-amber-200 cursor-wait'
                  : 'bg-gradient-to-b from-[#ffd54f] via-[#ffb300] to-[#f57f17] text-slate-950 hover:brightness-110 shadow-[0_4px_15px_rgba(255,179,0,0.4)]'
              }`}
            >
              <RotateCw className={`w-4 h-4 sm:w-5 sm:h-5 ${spinning ? 'animate-spin' : ''}`} />
              <span>{spinning ? 'Spinning...' : 'SPIN'}</span>
            </button>
          </div>

          {/* Quick Free Spin & Balance Status */}
          {user.spinCredits > 0 && (
            <div className="flex items-center justify-between bg-amber-500/10 border border-amber-500/30 rounded-xl px-3 py-1.5 text-xs text-amber-300">
              <span className="flex items-center gap-1 font-bold">
                <Gift className="w-3.5 h-3.5 text-amber-400" />
                <span>{user.spinCredits} Free Spins Available</span>
              </span>
              <button
                onClick={() => setUseFreeSpin(!useFreeSpin)}
                className={`px-2 py-0.5 rounded text-[10px] font-bold transition ${
                  useFreeSpin ? 'bg-amber-400 text-black' : 'bg-slate-800 text-slate-300'
                }`}
              >
                {useFreeSpin ? 'Using Free Spin' : 'Use Wallet Balance'}
              </button>
            </div>
          )}

          {/* Win Notice / Celebration banner */}
          {lastWinType && winAmount > 0 && (
            <div className="bg-emerald-500/20 border border-emerald-500/40 rounded-xl p-2 text-center animate-bounce">
              <span className="text-xs font-bold text-emerald-300 uppercase">
                🎉 Won ₹{winAmount.toFixed(2)} on {lastWinType.replace('_', ' ').toUpperCase()}!
              </span>
            </div>
          )}
        </div>

        {/* 4. EXPANDABLE EXTRA FEATURES (Daily Check-in, Tournament, Buy Tickets) */}
        <div className="w-full mt-3">
          <button
            onClick={() => setShowExtras(!showExtras)}
            className="w-full flex items-center justify-between text-xs text-slate-400 hover:text-slate-200 bg-[#0a1e48]/60 border border-blue-900/50 rounded-2xl px-4 py-2.5 transition"
          >
            <span className="font-bold flex items-center gap-1.5 text-sky-300">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Free Spins, Daily Check-in & Rewards</span>
            </span>
            {showExtras ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>

          {showExtras && (
            <div className="space-y-4 pt-3 text-xs">
              {/* Daily Check-in Free Spin Card */}
              <div className="bg-[#0c2254] border border-blue-800/60 rounded-2xl p-4 flex items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <div className="text-white font-bold flex items-center gap-1.5">
                    <Gift className="w-4 h-4 text-pink-400" />
                    <span>Daily Free Spin Check-in</span>
                  </div>
                  <p className="text-slate-400 text-[11px]">
                    Claim 1 free spin ticket every day to play the wheel!
                  </p>
                </div>
                <button
                  onClick={handleDailyCheckinClick}
                  disabled={checkingIn}
                  className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-black text-xs shadow shrink-0"
                >
                  {checkingIn ? 'Claiming...' : 'Claim Free Spin'}
                </button>
              </div>

              {/* Buy Extra Spin Tickets */}
              <div className="bg-[#0c2254] border border-blue-800/60 rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between border-b border-blue-900/60 pb-2">
                  <span className="font-bold text-white flex items-center gap-1.5">
                    <Ticket className="w-4 h-4 text-amber-400" />
                    <span>Buy Extra Spin Tickets</span>
                  </span>
                  <span className="text-[11px] text-amber-300 font-mono">
                    ₹{Number(settings.spinTicketPrice || 10).toFixed(0)} / spin
                  </span>
                </div>

                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    {[1, 5, 10].map((count) => (
                      <button
                        key={count}
                        onClick={() => handleBuyTickets(count)}
                        disabled={buying}
                        className="px-3 py-1.5 rounded-xl bg-blue-950/80 border border-blue-700 hover:border-amber-400 text-white font-bold text-xs"
                      >
                        +{count}
                      </button>
                    ))}
                  </div>

                  {onOpenDeposit && (
                    <button
                      onClick={onOpenDeposit}
                      className="px-3 py-1.5 rounded-xl bg-emerald-600/30 border border-emerald-500/40 text-emerald-300 font-bold text-xs flex items-center gap-1"
                    >
                      <Wallet className="w-3 h-3" />
                      Deposit
                    </button>
                  )}
                </div>
              </div>

              {/* Tournament Teaser */}
              {onOpenTournament && (
                <div className="bg-gradient-to-r from-amber-950/40 to-yellow-950/40 border border-amber-500/30 rounded-2xl p-4 flex items-center justify-between">
                  <div>
                    <span className="text-amber-300 font-bold block flex items-center gap-1">
                      <Trophy className="w-3.5 h-3.5 text-amber-400" />
                      Daily Bettor Tournament
                    </span>
                    <span className="text-[11px] text-amber-200/70">Win shares of the guaranteed pot</span>
                  </div>
                  <button
                    onClick={onOpenTournament}
                    className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-xs"
                  >
                    View Pot →
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};
