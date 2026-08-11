import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Clock,
  Sparkles,
  Trophy,
  History,
  DollarSign,
  AlertCircle,
  CheckCircle2,
  HelpCircle,
  Dices,
  Flame,
  ChevronRight,
  Shield,
  Layers,
  ArrowUpRight,
} from 'lucide-react';
import { User, ColorPredictionBet, ColorPredictionResult } from '../types';

interface ColorPredictionViewProps {
  user: User;
  onRefreshUser: () => void;
  showToast: (message: string, type?: 'success' | 'error') => void;
}

type BetSelection = 'green' | 'red' | 'violet' | 'big' | 'small' | '0' | '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9';

export const ColorPredictionView: React.FC<ColorPredictionViewProps> = ({
  user,
  onRefreshUser,
  showToast,
}) => {
  const [currentPeriodId, setCurrentPeriodId] = useState<string>('');
  const [remainingSeconds, setRemainingSeconds] = useState<number>(60);
  const [isFreeze, setIsFreeze] = useState<boolean>(false);
  const [history, setHistory] = useState<ColorPredictionResult[]>([]);
  const [myBets, setMyBets] = useState<ColorPredictionBet[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'game' | 'history' | 'mybets' | 'rules'>('game');

  // Bet Modal State
  const [betModalOpen, setBetModalOpen] = useState<boolean>(false);
  const [selectedBet, setSelectedBet] = useState<BetSelection | null>(null);
  const [baseAmount, setBaseAmount] = useState<number>(1);
  const [multiplierCount, setMultiplierCount] = useState<number>(1);
  const [placingBet, setPlacingBet] = useState<boolean>(false);

  // Fetch Game State from Backend
  const fetchGameState = async () => {
    try {
      const storedId = user?.id || localStorage.getItem('tp_user_id') || '';
      const res = await fetch('/api/color-prediction', {
        headers: {
          'x-user-id': storedId,
        },
      });
      if (res.ok) {
        const data = await res.json();
        setCurrentPeriodId(data.currentPeriodId);
        setRemainingSeconds(data.remainingSeconds);
        setIsFreeze(data.isFreeze);
        setHistory(data.history || []);
        setMyBets(data.myBets || []);
      }
    } catch (err) {
      console.error('Failed to fetch Color Prediction state:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGameState();
    const interval = setInterval(() => {
      setRemainingSeconds((prev) => {
        if (prev <= 1) {
          fetchGameState();
          onRefreshUser();
          return 60;
        }
        if (prev <= 6) {
          setIsFreeze(true);
        } else {
          setIsFreeze(false);
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const openBetModal = (selection: BetSelection) => {
    if (isFreeze) {
      showToast('Betting is frozen for the last 5 seconds of the round!', 'error');
      return;
    }
    setSelectedBet(selection);
    setBaseAmount(1);
    setMultiplierCount(1);
    setBetModalOpen(true);
  };

  const handleConfirmBet = async () => {
    if (!selectedBet) return;
    const totalBet = baseAmount * multiplierCount;
    if (user.balance < totalBet) {
      showToast(`Insufficient balance! You need $${totalBet.toFixed(2)}, but have $${user.balance.toFixed(2)}.`, 'error');
      return;
    }

    setPlacingBet(true);
    try {
      const storedId = user?.id || localStorage.getItem('tp_user_id') || '';
      const res = await fetch('/api/color-prediction/bet', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': storedId,
        },
        body: JSON.stringify({
          selection: selectedBet,
          amount: baseAmount,
          contractCount: multiplierCount,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        showToast(data.message || 'Bet placed successfully!', 'success');
        setBetModalOpen(false);
        fetchGameState();
        onRefreshUser();
      } else {
        showToast(data.error || 'Failed to place bet.', 'error');
      }
    } catch (err) {
      showToast('Network error while placing bet.', 'error');
    } finally {
      setPlacingBet(false);
    }
  };

  // Helper to get Color Badge classes for results & buttons
  const getNumColorClasses = (num: number) => {
    if (num === 0) return 'bg-gradient-to-r from-red-600 to-purple-600 text-white shadow-[0_0_10px_rgba(168,85,247,0.4)]';
    if (num === 5) return 'bg-gradient-to-r from-emerald-500 to-purple-600 text-white shadow-[0_0_10px_rgba(168,85,247,0.4)]';
    if ([1, 3, 7, 9].includes(num)) return 'bg-emerald-500 text-black font-extrabold shadow-[0_0_10px_rgba(16,185,129,0.4)]';
    return 'bg-rose-500 text-white font-extrabold shadow-[0_0_10px_rgba(244,63,94,0.4)]';
  };

  const getSelectionBadge = (sel: string) => {
    if (sel === 'green') return <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 px-2 py-0.5 rounded-full text-xs font-bold">Green (2x)</span>;
    if (sel === 'red') return <span className="bg-rose-500/20 text-rose-400 border border-rose-500/40 px-2 py-0.5 rounded-full text-xs font-bold">Red (2x)</span>;
    if (sel === 'violet') return <span className="bg-purple-500/20 text-purple-400 border border-purple-500/40 px-2 py-0.5 rounded-full text-xs font-bold">Violet (4.5x)</span>;
    if (sel === 'big') return <span className="bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded-full text-xs font-bold">BIG (2x)</span>;
    if (sel === 'small') return <span className="bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 px-2 py-0.5 rounded-full text-xs font-bold">SMALL (2x)</span>;
    return <span className="bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 px-2.5 py-0.5 rounded-full text-xs font-bold">Num #{sel} (9x)</span>;
  };

  return (
    <div className="space-y-6 font-mono text-slate-100 max-w-6xl mx-auto pb-20">
      {/* Top Banner & Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0c1322] via-[#09182d] to-[#0d0f1a] border border-cyan-500/30 p-6 shadow-[0_0_30px_rgba(6,182,212,0.15)]">
        <div className="absolute top-0 right-0 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-60 h-60 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-cyan-500/20 border border-cyan-400/40 text-cyan-300 text-xs font-bold flex items-center gap-1.5 shadow-[0_0_12px_rgba(6,182,212,0.3)]">
                <Flame className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                WIN GO 1m COLOR PREDICTION
              </span>
              <span className="text-xs text-slate-400 font-sans">USDT Multiplier Game</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white flex items-center gap-3">
              Color Prediction Arena
              <Dices className="w-7 h-7 text-cyan-400 animate-bounce" />
            </h1>
            <p className="text-xs md:text-sm text-slate-400 max-w-xl font-sans">
              Predict Green, Violet, Red, Big/Small or Lucky Numbers (0-9) to win up to <strong className="text-amber-400">9x Instant USDT Payouts</strong> every 60 seconds!
            </p>
          </div>

          {/* User Wallet Balance Summary Card */}
          <div className="w-full lg:w-auto bg-[#070c14]/80 border border-cyan-500/40 rounded-2xl p-4 flex items-center justify-between lg:justify-start gap-4 shadow-[0_0_15px_rgba(0,0,0,0.6)]">
            <div>
              <div className="text-[10px] uppercase text-slate-400 tracking-wider font-semibold">Available Wallet</div>
              <div className="text-xl font-extrabold text-cyan-300 flex items-center gap-1">
                ${user.balance.toFixed(2)}
                <span className="text-xs text-slate-500 font-normal">USDT</span>
              </div>
            </div>
            <div className="h-10 w-[1px] bg-slate-800" />
            <div>
              <div className="text-[10px] uppercase text-slate-400 tracking-wider font-semibold">My Total Wins</div>
              <div className="text-lg font-bold text-emerald-400 flex items-center gap-1">
                ${user.totalEarned.toFixed(2)}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Game Stage Card */}
      <div className="bg-[#0b1320] border border-cyan-500/20 rounded-3xl p-4 md:p-6 space-y-6 shadow-xl relative overflow-hidden">
        
        {/* Period Header & Live Countdown Clock */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center bg-[#070d18] border border-cyan-500/30 rounded-2xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center text-cyan-300 shadow-[0_0_15px_rgba(6,182,212,0.3)]">
              <Clock className="w-6 h-6 animate-spin-slow" />
            </div>
            <div>
              <div className="text-xs text-slate-400 font-medium">Period Number</div>
              <div className="text-lg font-extrabold text-white tracking-widest flex items-center gap-2">
                #{currentPeriodId || '202608111001'}
                {isFreeze ? (
                  <span className="text-[10px] bg-red-500/20 text-red-400 border border-red-500/40 px-2 py-0.5 rounded-md animate-pulse">
                    COUNTDOWN FREEZE
                  </span>
                ) : (
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 px-2 py-0.5 rounded-md">
                    BETTING OPEN
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Large Visual Timer Box */}
          <div className="flex items-center justify-between md:justify-end gap-3 bg-[#0a111e] border border-slate-800 rounded-xl p-3 px-5">
            <div className="text-right">
              <div className="text-[10px] uppercase text-slate-400 font-semibold">Round Timer</div>
              <div className="text-xs text-slate-500">1 Min Win Go</div>
            </div>
            <div className="flex items-center gap-1 font-mono text-2xl font-black">
              <div className={`px-3 py-1.5 rounded-xl border ${isFreeze ? 'bg-red-500/20 border-red-500/50 text-red-400 shadow-[0_0_15px_rgba(239,68,68,0.4)] animate-pulse' : 'bg-cyan-500/20 border-cyan-500/40 text-cyan-300 shadow-[0_0_15px_rgba(6,182,212,0.2)]'}`}>
                00
              </div>
              <span className="text-cyan-400">:</span>
              <div className={`px-3 py-1.5 rounded-xl border ${isFreeze ? 'bg-red-500/20 border-red-500/50 text-red-400 shadow-[0_0_15px_rgba(239,68,68,0.4)] animate-pulse' : 'bg-cyan-500/20 border-cyan-500/40 text-cyan-300 shadow-[0_0_15px_rgba(6,182,212,0.2)]'}`}>
                {remainingSeconds < 10 ? `0${remainingSeconds}` : remainingSeconds}
              </div>
            </div>
          </div>
        </div>

        {/* 3 Main Color Buttons (Green / Violet / Red) */}
        <div className="space-y-2">
          <div className="text-xs uppercase text-slate-400 font-bold tracking-wider flex items-center justify-between">
            <span>Select Color Category</span>
            <span className="text-[11px] text-cyan-400 font-normal">Choose 1 or more options</span>
          </div>

          <div className="grid grid-cols-3 gap-3 md:gap-4">
            {/* Join Green */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              disabled={isFreeze}
              onClick={() => openBetModal('green')}
              className={`relative overflow-hidden py-4 rounded-2xl font-extrabold text-sm md:text-base transition duration-200 shadow-lg flex flex-col items-center justify-center gap-1 border border-emerald-400/50 ${
                isFreeze
                  ? 'opacity-50 cursor-not-allowed bg-emerald-900/30 text-emerald-300'
                  : 'bg-gradient-to-b from-emerald-500 to-emerald-700 text-black hover:from-emerald-400 hover:to-emerald-600 shadow-[0_0_20px_rgba(16,185,129,0.3)]'
              }`}
            >
              <div className="flex items-center gap-1.5 text-black font-black">
                <span>JOIN GREEN</span>
              </div>
              <span className="text-[11px] bg-black/30 px-2 py-0.5 rounded-full font-bold text-emerald-100">
                2X PAYOUT
              </span>
            </motion.button>

            {/* Join Violet */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              disabled={isFreeze}
              onClick={() => openBetModal('violet')}
              className={`relative overflow-hidden py-4 rounded-2xl font-extrabold text-sm md:text-base transition duration-200 shadow-lg flex flex-col items-center justify-center gap-1 border border-purple-400/50 ${
                isFreeze
                  ? 'opacity-50 cursor-not-allowed bg-purple-900/30 text-purple-300'
                  : 'bg-gradient-to-b from-purple-500 to-purple-800 text-white hover:from-purple-400 hover:to-purple-700 shadow-[0_0_20px_rgba(168,85,247,0.3)]'
              }`}
            >
              <div className="flex items-center gap-1.5 font-black">
                <span>JOIN VIOLET</span>
              </div>
              <span className="text-[11px] bg-black/40 px-2 py-0.5 rounded-full font-bold text-purple-200">
                4.5X PAYOUT
              </span>
            </motion.button>

            {/* Join Red */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              disabled={isFreeze}
              onClick={() => openBetModal('red')}
              className={`relative overflow-hidden py-4 rounded-2xl font-extrabold text-sm md:text-base transition duration-200 shadow-lg flex flex-col items-center justify-center gap-1 border border-rose-400/50 ${
                isFreeze
                  ? 'opacity-50 cursor-not-allowed bg-rose-900/30 text-rose-300'
                  : 'bg-gradient-to-b from-rose-500 to-rose-700 text-white hover:from-rose-400 hover:to-rose-600 shadow-[0_0_20px_rgba(244,63,94,0.3)]'
              }`}
            >
              <div className="flex items-center gap-1.5 font-black">
                <span>JOIN RED</span>
              </div>
              <span className="text-[11px] bg-black/30 px-2 py-0.5 rounded-full font-bold text-rose-100">
                2X PAYOUT
              </span>
            </motion.button>
          </div>
        </div>

        {/* Number Selection Grid (0-9 with 9x Payout) */}
        <div className="space-y-2">
          <div className="text-xs uppercase text-slate-400 font-bold tracking-wider flex items-center justify-between">
            <span>Select Lucky Number (0 - 9)</span>
            <span className="text-amber-400 font-bold text-xs bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 rounded-md">
              MEGA 9X PAYOUT
            </span>
          </div>

          <div className="grid grid-cols-5 md:grid-cols-10 gap-2 md:gap-3">
            {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => {
              const numClass = getNumColorClasses(num);
              return (
                <motion.button
                  key={num}
                  whileHover={{ scale: 1.08 }}
                  whileTap={{ scale: 0.92 }}
                  disabled={isFreeze}
                  onClick={() => openBetModal(String(num) as BetSelection)}
                  className={`h-14 rounded-2xl flex flex-col items-center justify-center font-black text-lg transition shadow-md border border-white/20 ${numClass} ${
                    isFreeze ? 'opacity-40 cursor-not-allowed' : 'hover:brightness-110'
                  }`}
                >
                  <span>{num}</span>
                  <span className="text-[9px] opacity-90 font-sans font-semibold">9x</span>
                </motion.button>
              );
            })}
          </div>
        </div>

        {/* Big / Small Selection Buttons */}
        <div className="grid grid-cols-2 gap-4 pt-2">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            disabled={isFreeze}
            onClick={() => openBetModal('big')}
            className={`py-3.5 rounded-2xl font-black text-sm md:text-base border border-amber-500/50 flex items-center justify-center gap-2 transition ${
              isFreeze
                ? 'opacity-50 cursor-not-allowed bg-amber-950/20 text-amber-500'
                : 'bg-gradient-to-r from-amber-500 to-amber-600 text-black hover:from-amber-400 hover:to-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.3)]'
            }`}
          >
            <span>BIG (5 - 9)</span>
            <span className="bg-black/20 text-amber-950 text-xs px-2 py-0.5 rounded-full font-bold">2X</span>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            disabled={isFreeze}
            onClick={() => openBetModal('small')}
            className={`py-3.5 rounded-2xl font-black text-sm md:text-base border border-cyan-500/50 flex items-center justify-center gap-2 transition ${
              isFreeze
                ? 'opacity-50 cursor-not-allowed bg-cyan-950/20 text-cyan-500'
                : 'bg-gradient-to-r from-cyan-500 to-blue-600 text-black hover:from-cyan-400 hover:to-blue-500 shadow-[0_0_15px_rgba(6,182,212,0.3)]'
            }`}
          >
            <span>SMALL (0 - 4)</span>
            <span className="bg-black/20 text-cyan-950 text-xs px-2 py-0.5 rounded-full font-bold">2X</span>
          </motion.button>
        </div>
      </div>

      {/* Navigation Tabs (Parity History / My Bets / Game Rules) */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('game')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
            activeTab === 'game'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-[0_0_12px_rgba(6,182,212,0.2)]'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
          }`}
        >
          <History className="w-4 h-4 text-cyan-400" />
          Game History
        </button>

        <button
          onClick={() => setActiveTab('mybets')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition relative ${
            activeTab === 'mybets'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-[0_0_12px_rgba(6,182,212,0.2)]'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
          }`}
        >
          <Dices className="w-4 h-4 text-amber-400" />
          My Bets ({myBets.length})
        </button>

        <button
          onClick={() => setActiveTab('rules')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
            activeTab === 'rules'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-[0_0_12px_rgba(6,182,212,0.2)]'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
          }`}
        >
          <HelpCircle className="w-4 h-4 text-indigo-400" />
          Multipliers & Rules
        </button>
      </div>

      {/* Tab Content 1: Game History / Parity Chart */}
      {activeTab === 'game' && (
        <div className="bg-[#0b1320] border border-cyan-500/20 rounded-2xl p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Trophy className="w-4 h-4 text-amber-400" />
              Parity Results Chart
            </h3>
            <span className="text-xs text-slate-400 font-sans">Last 50 rounds</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-[#070d18] text-slate-400 uppercase tracking-wider border-b border-slate-800">
                <tr>
                  <th className="p-3">Period</th>
                  <th className="p-3">Number</th>
                  <th className="p-3">Big/Small</th>
                  <th className="p-3">Result Color</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-200">
                {history.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="p-8 text-center text-slate-500 font-sans">
                      No game history recorded yet.
                    </td>
                  </tr>
                ) : (
                  history.map((row) => (
                    <tr key={row.periodId} className="hover:bg-slate-800/30 transition">
                      <td className="p-3 font-bold text-cyan-300">#{row.periodId}</td>
                      <td className="p-3">
                        <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-extrabold ${getNumColorClasses(row.number)}`}>
                          {row.number}
                        </span>
                      </td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${row.size === 'big' ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' : 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'}`}>
                          {row.size.toUpperCase()}
                        </span>
                      </td>
                      <td className="p-3">
                        {row.color === 'green' && (
                          <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 px-2.5 py-0.5 rounded-full text-xs font-bold">
                            Green
                          </span>
                        )}
                        {row.color === 'red' && (
                          <span className="bg-rose-500/20 text-rose-400 border border-rose-500/40 px-2.5 py-0.5 rounded-full text-xs font-bold">
                            Red
                          </span>
                        )}
                        {row.color === 'violet-green' && (
                          <span className="bg-gradient-to-r from-purple-500/20 to-emerald-500/20 text-purple-300 border border-purple-500/40 px-2.5 py-0.5 rounded-full text-xs font-bold">
                            Violet + Green
                          </span>
                        )}
                        {row.color === 'violet-red' && (
                          <span className="bg-gradient-to-r from-purple-500/20 to-rose-500/20 text-purple-300 border border-purple-500/40 px-2.5 py-0.5 rounded-full text-xs font-bold">
                            Violet + Red
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab Content 2: My Bets */}
      {activeTab === 'mybets' && (
        <div className="bg-[#0b1320] border border-cyan-500/20 rounded-2xl p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Dices className="w-4 h-4 text-cyan-400" />
              My Bet Log & Payouts
            </h3>
            <span className="text-xs text-slate-400 font-sans">Recent 30 bets</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-[#070d18] text-slate-400 uppercase tracking-wider border-b border-slate-800">
                <tr>
                  <th className="p-3">Period</th>
                  <th className="p-3">Selection</th>
                  <th className="p-3">Total Stake</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Payout</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-200">
                {myBets.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-slate-500 font-sans">
                      You haven't placed any bets yet in Color Prediction.
                    </td>
                  </tr>
                ) : (
                  myBets.map((bet) => (
                    <tr key={bet.id} className="hover:bg-slate-800/30 transition">
                      <td className="p-3 font-bold text-cyan-300">#{bet.periodId}</td>
                      <td className="p-3">{getSelectionBadge(bet.selection)}</td>
                      <td className="p-3 font-bold text-white">${bet.totalBet.toFixed(2)}</td>
                      <td className="p-3">
                        {bet.status === 'pending' && (
                          <span className="bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2.5 py-0.5 rounded-full text-xs font-bold animate-pulse">
                            Pending
                          </span>
                        )}
                        {bet.status === 'won' && (
                          <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 px-2.5 py-0.5 rounded-full text-xs font-bold flex items-center gap-1 w-max">
                            <CheckCircle2 className="w-3 h-3" />
                            WON
                          </span>
                        )}
                        {bet.status === 'lost' && (
                          <span className="bg-slate-800 text-slate-400 border border-slate-700 px-2.5 py-0.5 rounded-full text-xs font-medium">
                            Lost
                          </span>
                        )}
                      </td>
                      <td className="p-3 font-bold">
                        {bet.status === 'won' ? (
                          <span className="text-emerald-400 font-extrabold">+${bet.payout.toFixed(2)}</span>
                        ) : bet.status === 'pending' ? (
                          <span className="text-slate-500">Calculating...</span>
                        ) : (
                          <span className="text-slate-500">$0.00</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab Content 3: Rules & Multipliers */}
      {activeTab === 'rules' && (
        <div className="bg-[#0b1320] border border-cyan-500/20 rounded-2xl p-6 space-y-6 font-sans">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-2">
              <Shield className="w-5 h-5 text-cyan-400" />
              Color Prediction Rules & Multiplier Breakdown
            </h3>
            <p className="text-xs text-slate-400">
              Win Go is a 1-minute fast-paced color and number prediction game. Below are the official multiplier rates for each selection:
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
            <div className="bg-[#070d18] border border-emerald-500/30 rounded-xl p-4 space-y-2">
              <div className="text-emerald-400 font-bold text-sm flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-emerald-500" />
                GREEN SELECTION (2X)
              </div>
              <p className="text-slate-300 font-sans">
                If the result number is <strong>1, 3, 7, or 9</strong>, you win <strong>2x</strong> your bet amount.
                If the result is <strong>5</strong> (Green + Violet), you win <strong>1.5x</strong>.
              </p>
            </div>

            <div className="bg-[#070d18] border border-rose-500/30 rounded-xl p-4 space-y-2">
              <div className="text-rose-400 font-bold text-sm flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-rose-500" />
                RED SELECTION (2X)
              </div>
              <p className="text-slate-300 font-sans">
                If the result number is <strong>2, 4, 6, or 8</strong>, you win <strong>2x</strong> your bet amount.
                If the result is <strong>0</strong> (Red + Violet), you win <strong>1.5x</strong>.
              </p>
            </div>

            <div className="bg-[#070d18] border border-purple-500/30 rounded-xl p-4 space-y-2">
              <div className="text-purple-400 font-bold text-sm flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-purple-500" />
                VIOLET SELECTION (4.5X)
              </div>
              <p className="text-slate-300 font-sans">
                If the result number is <strong>0 or 5</strong>, you win <strong>4.5x</strong> your bet amount!
              </p>
            </div>

            <div className="bg-[#070d18] border border-indigo-500/30 rounded-xl p-4 space-y-2">
              <div className="text-indigo-400 font-bold text-sm flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                NUMBER SELECTION (9X)
              </div>
              <p className="text-slate-300 font-sans">
                If you predict the exact number (0 to 9) that appears, you win a massive <strong>9x</strong> payout!
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Interactive Bet Confirmation Modal */}
      <AnimatePresence>
        {betModalOpen && selectedBet && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-[#0c1524] border border-cyan-500/40 rounded-3xl p-6 w-full max-w-md space-y-6 shadow-[0_0_50px_rgba(6,182,212,0.25)] relative"
            >
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center text-cyan-300 font-bold">
                    <DollarSign className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold text-white">Place Bet Order</h3>
                    <p className="text-xs text-slate-400 font-sans">Period #{currentPeriodId}</p>
                  </div>
                </div>
                <button
                  onClick={() => setBetModalOpen(false)}
                  className="text-slate-400 hover:text-white text-lg font-bold p-1"
                >
                  ✕
                </button>
              </div>

              {/* Selection Badge Info */}
              <div className="bg-[#070d18] border border-slate-800 rounded-2xl p-4 flex items-center justify-between">
                <span className="text-xs text-slate-400 uppercase font-semibold">Your Selection</span>
                <div>{getSelectionBadge(selectedBet)}</div>
              </div>

              {/* Base Stake Presets ($1, $5, $10, $50, $100) */}
              <div className="space-y-2">
                <label className="text-xs text-slate-400 uppercase font-semibold block">Select Contract Unit ($)</label>
                <div className="grid grid-cols-5 gap-2">
                  {[1, 5, 10, 50, 100].map((amt) => (
                    <button
                      key={amt}
                      onClick={() => setBaseAmount(amt)}
                      className={`py-2 rounded-xl text-xs font-extrabold border transition ${
                        baseAmount === amt
                          ? 'bg-cyan-500 text-black border-cyan-300 shadow-[0_0_10px_rgba(6,182,212,0.4)]'
                          : 'bg-slate-800/60 text-slate-300 border-slate-700 hover:bg-slate-700'
                      }`}
                    >
                      ${amt}
                    </button>
                  ))}
                </div>
              </div>

              {/* Multiplier / Quantity Count (x1, x2, x5, x10, x20) */}
              <div className="space-y-2">
                <label className="text-xs text-slate-400 uppercase font-semibold block">Quantity Multiplier</label>
                <div className="grid grid-cols-5 gap-2">
                  {[1, 2, 5, 10, 20].map((count) => (
                    <button
                      key={count}
                      onClick={() => setMultiplierCount(count)}
                      className={`py-2 rounded-xl text-xs font-extrabold border transition ${
                        multiplierCount === count
                          ? 'bg-amber-500 text-black border-amber-300 shadow-[0_0_10px_rgba(245,158,11,0.4)]'
                          : 'bg-slate-800/60 text-slate-300 border-slate-700 hover:bg-slate-700'
                      }`}
                    >
                      x{count}
                    </button>
                  ))}
                </div>
              </div>

              {/* Total Bet Calculation Summary */}
              <div className="bg-[#070d18] border border-cyan-500/30 rounded-2xl p-4 space-y-2">
                <div className="flex justify-between text-xs text-slate-400">
                  <span>Contract Amount:</span>
                  <span className="text-white font-bold">${baseAmount}</span>
                </div>
                <div className="flex justify-between text-xs text-slate-400">
                  <span>Multiplier:</span>
                  <span className="text-white font-bold">x{multiplierCount}</span>
                </div>
                <div className="pt-2 border-t border-slate-800 flex justify-between items-center text-sm font-extrabold">
                  <span className="text-cyan-300">Total Bet Amount:</span>
                  <span className="text-xl text-emerald-400">${(baseAmount * multiplierCount).toFixed(2)} USDT</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  onClick={() => setBetModalOpen(false)}
                  className="py-3 rounded-2xl font-bold text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700"
                >
                  Cancel
                </button>

                <button
                  disabled={placingBet}
                  onClick={handleConfirmBet}
                  className="py-3 rounded-2xl font-black text-xs bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-black shadow-[0_0_20px_rgba(6,182,212,0.4)] transition flex items-center justify-center gap-2"
                >
                  {placingBet ? (
                    <span>Placing Bet...</span>
                  ) : (
                    <>
                      <span>CONFIRM BET</span>
                      <ChevronRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
