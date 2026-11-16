import React, { useState } from 'react';
import { ArrowLeft, Sparkles, Coins, Plus, Minus, RotateCw, Trophy, Volume2, VolumeX, Shield, HelpCircle } from 'lucide-react';
import confetti from 'canvas-confetti';
import { User } from '../types';

interface Slot777ViewProps {
  user: User;
  onRefreshUser?: () => void;
  showToast?: (msg: string, type?: 'success' | 'error' | 'info') => void;
  onOpenDeposit?: () => void;
  onOpenWithdraw?: () => void;
  onBack?: () => void;
}

type SymbolType = 'seven' | 'diamond' | 'bell' | 'bar' | 'cherry' | 'lemon' | 'clover';

interface SymbolMeta {
  type: SymbolType;
  label: string;
  emoji: string;
  color: string;
  multiplier: number;
}

const SYMBOL_LIST: SymbolMeta[] = [
  { type: 'seven', label: 'Lucky 7', emoji: '7️⃣', color: '#ef4444', multiplier: 50 },
  { type: 'diamond', label: 'Diamond', emoji: '💎', color: '#06b6d4', multiplier: 25 },
  { type: 'bell', label: 'Golden Bell', emoji: '🔔', color: '#eab308', multiplier: 15 },
  { type: 'bar', label: 'Triple BAR', emoji: '🍫', color: '#a855f7', multiplier: 10 },
  { type: 'cherry', label: 'Sweet Cherry', emoji: '🍒', color: '#f43f5e', multiplier: 8 },
  { type: 'lemon', label: 'Lemon Splash', emoji: '🍋', color: '#facc15', multiplier: 5 },
  { type: 'clover', label: 'Lucky Clover', emoji: '🍀', color: '#10b981', multiplier: 3 },
];

export const Slot777View: React.FC<Slot777ViewProps> = ({
  user,
  onRefreshUser,
  showToast,
  onOpenDeposit,
  onBack,
}) => {
  const [betAmount, setBetAmount] = useState<number>(100);
  const [reels, setReels] = useState<SymbolType[]>(['seven', 'seven', 'seven']);
  const [spinning, setSpinning] = useState<boolean>(false);
  const [winAmount, setWinAmount] = useState<number>(0);
  const [winTitle, setWinTitle] = useState<string>('');
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [showPaytable, setShowPaytable] = useState<boolean>(false);

  const totalBalance = (user.depositBalance || 0) + (user.winningBalance || 0) + (user.balance || 0);

  // Sound generator
  const playSound = (type: 'spin' | 'stop' | 'win') => {
    if (!soundEnabled) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const audioCtx = new AudioCtx();

      if (type === 'spin') {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(160, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(80, audioCtx.currentTime + 1.2);
        gain.gain.setValueAtTime(0.04, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 1.2);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + 1.2);
      } else if (type === 'stop') {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(320, audioCtx.currentTime);
        gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.12);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.12);
      } else if (type === 'win') {
        [440, 554, 659, 880, 1108].forEach((freq, i) => {
          const osc = audioCtx.createOscillator();
          const gain = audioCtx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, audioCtx.currentTime + i * 0.08);
          gain.gain.setValueAtTime(0.07, audioCtx.currentTime + i * 0.08);
          gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + i * 0.08 + 0.25);
          osc.connect(gain);
          gain.connect(audioCtx.destination);
          osc.start(audioCtx.currentTime + i * 0.08);
          osc.stop(audioCtx.currentTime + i * 0.08 + 0.25);
        });
      }
    } catch {
      // Audio fallback
    }
  };

  const handleBetStep = (delta: number) => {
    const steps = [10, 20, 50, 100, 200, 500, 1000, 2000, 5000];
    const currentIndex = steps.findIndex((s) => s >= betAmount);
    let nextIdx = (currentIndex === -1 ? 3 : currentIndex) + delta;
    nextIdx = Math.max(0, Math.min(steps.length - 1, nextIdx));
    setBetAmount(steps[nextIdx]);
  };

  const handleSpin = async () => {
    if (spinning) return;
    if (totalBalance < betAmount) {
      if (showToast) showToast(`Insufficient balance! Available: ₹${totalBalance.toFixed(2)}`, 'error');
      else alert(`Insufficient balance! Available: ₹${totalBalance.toFixed(2)}`);
      return;
    }

    setSpinning(true);
    setWinAmount(0);
    setWinTitle('');
    playSound('spin');

    // Simulate animated fast cycle before server result lands
    const interval = setInterval(() => {
      setReels([
        SYMBOL_LIST[Math.floor(Math.random() * SYMBOL_LIST.length)].type,
        SYMBOL_LIST[Math.floor(Math.random() * SYMBOL_LIST.length)].type,
        SYMBOL_LIST[Math.floor(Math.random() * SYMBOL_LIST.length)].type,
      ]);
    }, 80);

    try {
      const res = await fetch('/api/slot777/spin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ betAmount }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        clearInterval(interval);
        setSpinning(false);
        if (showToast) showToast(data.error || 'Spin failed', 'error');
        else alert(data.error || 'Spin failed');
        return;
      }

      // Stop reels sequentially for suspense
      setTimeout(() => {
        clearInterval(interval);
        setReels([data.reels[0], data.reels[1], data.reels[2]]);
        setSpinning(false);
        playSound('stop');

        if (data.payout > 0) {
          setWinAmount(data.payout);
          setWinTitle(data.winTitle);
          playSound('win');
          confetti({
            particleCount: data.multiplier >= 25 ? 120 : 60,
            spread: 70,
            origin: { y: 0.6 },
          });
          if (showToast) showToast(`🎉 ${data.winTitle} (+₹${data.payout.toFixed(2)})`, 'success');
        }

        if (onRefreshUser) onRefreshUser();
      }, 1600);
    } catch (err) {
      clearInterval(interval);
      setSpinning(false);
      console.error('Error during 777 spin:', err);
    }
  };

  const renderSymbol = (type: SymbolType) => {
    const meta = SYMBOL_LIST.find((s) => s.type === type) || SYMBOL_LIST[0];
    return (
      <div className="flex flex-col items-center justify-center p-2 text-center select-none">
        <span className="text-4xl sm:text-5xl filter drop-shadow-[0_4px_8px_rgba(0,0,0,0.6)] animate-pulse">
          {meta.emoji}
        </span>
        <span
          className="text-[10px] sm:text-xs font-black uppercase tracking-wider mt-1"
          style={{ color: meta.color }}
        >
          {meta.label}
        </span>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#1a001a] via-[#0d001a] to-[#05000a] text-white flex flex-col items-center justify-start pb-24 font-sans select-none">
      {/* 1. TOP HEADER */}
      <header className="w-full max-w-md px-4 pt-3 pb-2 flex items-center justify-between z-20">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-950/70 border border-purple-700/60 hover:border-pink-500 text-xs font-bold text-pink-200 transition active:scale-95 cursor-pointer shadow"
        >
          <ArrowLeft className="w-4 h-4 text-pink-400" />
          <span>Lobby</span>
        </button>

        {/* Marquee Glowing Title */}
        <div className="text-center">
          <div className="inline-flex items-center gap-1 px-3 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-[10px] font-black text-amber-300 tracking-wider">
            <Sparkles className="w-3 h-3 text-amber-400" />
            <span>VEGAS CASINO</span>
          </div>
          <h1
            className="text-2xl sm:text-3xl font-black italic tracking-widest uppercase text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-amber-400 to-yellow-500"
            style={{
              textShadow: '0 0 20px rgba(234,179,8,0.5)',
              transform: 'skewX(-6deg)',
            }}
          >
            777 SLOTS
          </h1>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="w-8 h-8 rounded-xl bg-purple-900/40 border border-purple-700/50 flex items-center justify-center text-purple-300 hover:text-white"
          >
            {soundEnabled ? <Volume2 className="w-4 h-4 text-pink-400" /> : <VolumeX className="w-4 h-4 text-slate-500" />}
          </button>
          <button
            onClick={() => setShowPaytable(!showPaytable)}
            className="w-8 h-8 rounded-xl bg-purple-900/40 border border-purple-700/50 flex items-center justify-center text-purple-300 hover:text-white"
            title="Paytable"
          >
            <HelpCircle className="w-4 h-4 text-amber-400" />
          </button>
        </div>
      </header>

      {/* 2. THE 777 SLOT MACHINE CABINET */}
      <main className="w-full max-w-md px-4 flex flex-col items-center">
        {/* Jackpot Marquee Sign */}
        <div className="w-full bg-gradient-to-r from-yellow-600 via-amber-500 to-yellow-600 rounded-t-3xl p-2.5 border-4 border-yellow-300 shadow-[0_0_30px_rgba(245,158,11,0.5)] flex items-center justify-between text-slate-950 font-black">
          <div className="flex items-center gap-1.5 text-xs sm:text-sm">
            <Trophy className="w-4 h-4 text-slate-950 animate-bounce" />
            <span>JACKPOT 50X:</span>
          </div>
          <span className="text-base sm:text-lg font-mono font-extrabold tracking-tight bg-black text-amber-400 px-3 py-0.5 rounded-xl border border-yellow-400">
            ₹{(betAmount * 50).toLocaleString()}
          </span>
        </div>

        {/* Slot Cabinet Body */}
        <div className="w-full bg-gradient-to-b from-[#2a0845] via-[#1b002b] to-[#0f0019] border-4 border-t-0 border-yellow-400 rounded-b-3xl p-4 sm:p-5 shadow-[0_15px_40px_rgba(0,0,0,0.9)] flex flex-col gap-4 relative">
          {/* Side Light Bulbs simulation */}
          <div className="flex justify-between px-2 -mt-1">
            {['🔴', '🟡', '🟢', '🔵', '🟣', '🟡', '🔴'].map((bulb, i) => (
              <span key={i} className="text-[10px] animate-pulse" style={{ animationDelay: `${i * 120}ms` }}>
                {bulb}
              </span>
            ))}
          </div>

          {/* 3 Mechanical Reels Display Window */}
          <div className="relative bg-[#0a0014] border-4 border-[#ffb300] rounded-2xl p-2 sm:p-3 shadow-[inset_0_0_25px_rgba(0,0,0,0.9)] overflow-hidden">
            {/* Center Payline Indicator Laser */}
            <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-[2px] bg-gradient-to-r from-transparent via-red-500 to-transparent pointer-events-none z-20 opacity-80" />
            <div className="absolute -left-1 top-1/2 -translate-y-1/2 text-xs font-bold text-red-500 z-20">▶</div>
            <div className="absolute -right-1 top-1/2 -translate-y-1/2 text-xs font-bold text-red-500 z-20">◀</div>

            {/* Reels Grid */}
            <div className="grid grid-cols-3 gap-2 sm:gap-3 bg-gradient-to-b from-[#180026] via-[#240038] to-[#180026] rounded-xl p-2 border border-purple-900/60">
              {reels.map((symbol, idx) => (
                <div
                  key={idx}
                  className={`bg-gradient-to-b from-[#100019] via-[#1a0026] to-[#100019] border-2 border-purple-800/80 rounded-xl h-28 sm:h-32 flex items-center justify-center relative overflow-hidden shadow-inner ${
                    spinning ? 'blur-[1px] scale-95 transition-all' : 'transition-transform'
                  }`}
                >
                  {renderSymbol(symbol)}
                </div>
              ))}
            </div>
          </div>

          {/* Win Announcement Banner */}
          {winAmount > 0 && (
            <div className="bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 text-slate-950 rounded-xl p-2.5 text-center font-black animate-bounce shadow-[0_0_20px_rgba(245,158,11,0.6)]">
              <span className="text-xs uppercase block">{winTitle}</span>
              <span className="text-xl font-mono">Won +₹{winAmount.toFixed(2)}!</span>
            </div>
          )}

          {/* Balance & Win Stats Bar */}
          <div className="flex items-center justify-between text-xs sm:text-sm font-mono bg-purple-950/60 border border-purple-800/60 rounded-xl p-2.5">
            <div className="flex items-center gap-1">
              <span className="text-slate-400 text-xs font-sans">Balance:</span>
              <Coins className="w-3.5 h-3.5 text-amber-400" />
              <span className="font-bold text-white">₹{totalBalance.toFixed(2)}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-slate-400 text-xs font-sans">Win:</span>
              <span className={`font-bold ${winAmount > 0 ? 'text-emerald-400' : 'text-slate-300'}`}>
                {winAmount > 0 ? `₹${winAmount.toFixed(2)}` : '₹0.00'}
              </span>
            </div>
          </div>

          {/* Controls: Bet Adjuster & Big Golden Spin Lever/Button */}
          <div className="grid grid-cols-2 gap-3 pt-1">
            {/* Bet Controller */}
            <div className="bg-purple-950/90 border border-purple-700/70 rounded-2xl p-1.5 flex items-center justify-between shadow">
              <button
                onClick={() => handleBetStep(-1)}
                disabled={spinning}
                className="w-8 h-8 rounded-xl bg-purple-900/80 hover:bg-purple-800 text-white font-bold flex items-center justify-center transition disabled:opacity-40"
              >
                <Minus className="w-4 h-4 text-pink-300" />
              </button>
              <div className="text-center">
                <span className="text-[10px] text-pink-300 uppercase block font-bold leading-none">Bet</span>
                <span className="text-base font-black text-white font-mono">₹{betAmount}</span>
              </div>
              <button
                onClick={() => handleBetStep(1)}
                disabled={spinning}
                className="w-8 h-8 rounded-xl bg-purple-900/80 hover:bg-purple-800 text-white font-bold flex items-center justify-center transition disabled:opacity-40"
              >
                <Plus className="w-4 h-4 text-pink-300" />
              </button>
            </div>

            {/* Giant Glowing SPIN Button */}
            <button
              onClick={handleSpin}
              disabled={spinning}
              className={`w-full py-3 px-4 rounded-2xl font-black text-base tracking-wider uppercase transition shadow-xl flex items-center justify-center gap-2 active:scale-95 cursor-pointer ${
                spinning
                  ? 'bg-amber-700 text-amber-200 cursor-wait'
                  : 'bg-gradient-to-b from-[#ffd54f] via-[#ffb300] to-[#f57f17] text-slate-950 hover:brightness-110 shadow-[0_4px_20px_rgba(255,179,0,0.5)] border-2 border-yellow-200'
              }`}
            >
              <RotateCw className={`w-5 h-5 ${spinning ? 'animate-spin' : ''}`} />
              <span>{spinning ? 'SPINNING...' : 'SPIN 777'}</span>
            </button>
          </div>

          {/* Quick Bet Presets */}
          <div className="flex items-center justify-center gap-2 pt-1">
            {[10, 50, 100, 500, 1000].map((amt) => (
              <button
                key={amt}
                onClick={() => setBetAmount(amt)}
                disabled={spinning}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition font-mono ${
                  betAmount === amt
                    ? 'bg-pink-600 text-white shadow-sm'
                    : 'bg-purple-950/60 text-purple-300 border border-purple-800/40 hover:bg-purple-900/60'
                }`}
              >
                ₹{amt}
              </button>
            ))}
          </div>
        </div>

        {/* 3. PAYTABLE DRAWER */}
        {showPaytable && (
          <div className="w-full mt-4 bg-[#140024] border border-purple-800 rounded-2xl p-4 space-y-3 shadow-xl text-xs">
            <div className="flex items-center justify-between border-b border-purple-900 pb-2">
              <span className="font-black text-amber-300 uppercase flex items-center gap-1.5">
                <Trophy className="w-4 h-4 text-amber-400" />
                777 Slot Payout Multipliers
              </span>
              <span className="text-[10px] text-slate-400">Center Payline</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {SYMBOL_LIST.map((s) => (
                <div key={s.type} className="bg-purple-950/40 border border-purple-900/60 rounded-xl p-2 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xl">{s.emoji}</span>
                    <span className="text-white font-bold">{s.label}</span>
                  </div>
                  <span className="font-mono font-black text-amber-400">{s.multiplier}X</span>
                </div>
              ))}
            </div>
            <p className="text-[11px] text-slate-400 text-center">
              * Matches on the center payline pay out instantly to your Winning Wallet!
            </p>
          </div>
        )}

        {/* Deposit Quick Bar */}
        {onOpenDeposit && (
          <div className="w-full mt-4 flex items-center justify-between bg-purple-950/40 border border-purple-900/50 rounded-2xl p-3">
            <span className="text-xs text-slate-300">Need more balance for higher bets?</span>
            <button
              onClick={onOpenDeposit}
              className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white font-black text-xs shadow"
            >
              + Deposit
            </button>
          </div>
        )}
      </main>
    </div>
  );
};
