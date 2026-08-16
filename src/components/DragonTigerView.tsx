import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Trophy,
  History,
  DollarSign,
  HelpCircle,
  Flame,
  Shield,
  RotateCcw,
  Sparkles,
  Zap,
  CheckCircle2,
  XCircle,
  ArrowUpRight,
  TrendingUp,
  TrendingDown,
} from 'lucide-react';
import { User } from '../types';

interface DragonTigerViewProps {
  user: User;
  onRefreshUser: () => void;
  showToast: (message: string, type?: 'success' | 'error') => void;
  onOpenDeposit?: () => void;
  onOpenWithdraw?: () => void;
}

type BetChoice = 'dragon' | 'tiger' | 'tie';

export interface Card {
  suit: '♠' | '♥' | '♦' | '♣';
  value: string; // 'A', '2', '3'...'10', 'J', 'Q', 'K'
  rank: number; // 1 to 13
  color: 'red' | 'black';
}

export interface DragonTigerHistory {
  id: string;
  roundId: string;
  dragonCard: Card;
  tigerCard: Card;
  winner: 'dragon' | 'tiger' | 'tie';
  completedAt: string;
}

export interface DragonTigerBet {
  id: string;
  roundId: string;
  choice: BetChoice;
  amount: number;
  dragonCard?: Card;
  tigerCard?: Card;
  winner?: 'dragon' | 'tiger' | 'tie';
  payout: number;
  cashbackAwarded?: number;
  status: 'pending' | 'won' | 'lost';
  createdAt: string;
}

const SUITS: ('♠' | '♥' | '♦' | '♣')[] = ['♠', '♥', '♦', '♣'];
const VALUES = [
  { val: 'A', rank: 1 },
  { val: '2', rank: 2 },
  { val: '3', rank: 3 },
  { val: '4', rank: 4 },
  { val: '5', rank: 5 },
  { val: '6', rank: 6 },
  { val: '7', rank: 7 },
  { val: '8', rank: 8 },
  { val: '9', rank: 9 },
  { val: '10', rank: 10 },
  { val: 'J', rank: 11 },
  { val: 'Q', rank: 12 },
  { val: 'K', rank: 13 },
];

function getRandomCard(): Card {
  const suit = SUITS[Math.floor(Math.random() * SUITS.length)];
  const item = VALUES[Math.floor(Math.random() * VALUES.length)];
  const color = suit === '♥' || suit === '♦' ? 'red' : 'black';
  return {
    suit,
    value: item.val,
    rank: item.rank,
    color,
  };
}

export const DragonTigerView: React.FC<DragonTigerViewProps> = ({
  user,
  onRefreshUser,
  showToast,
  onOpenDeposit,
  onOpenWithdraw,
}) => {
  const [chipAmount, setChipAmount] = useState<number>(10);
  const [selectedChoice, setSelectedChoice] = useState<BetChoice | null>(null);
  const [gameState, setGameState] = useState<'idle' | 'betting' | 'dealing' | 'result'>('idle');
  const [dragonCard, setDragonCard] = useState<Card | null>(null);
  const [tigerCard, setTigerCard] = useState<Card | null>(null);
  const [winner, setWinner] = useState<'dragon' | 'tiger' | 'tie' | null>(null);
  const [roundId, setRoundId] = useState<string>(`DT-${Math.floor(100000 + Math.random() * 900000)}`);
  
  const [history, setHistory] = useState<DragonTigerHistory[]>([]);
  const [myBets, setMyBets] = useState<DragonTigerBet[]>([]);
  const [activeTab, setActiveTab] = useState<'game' | 'history' | 'mybets' | 'rules'>('game');
  const [placingBet, setPlacingBet] = useState<boolean>(false);

  // Result Modal State for Movie Poster Style Announcement
  const [resultModal, setResultModal] = useState<{
    isOpen: boolean;
    winner: 'dragon' | 'tiger' | 'tie';
    userChoice: BetChoice;
    winAmount: number;
    betAmount: number;
    roundId: string;
    cashbackAwarded?: number;
  } | null>(null);

  // Real total winnings calculated from actual won bets in Dragon Tiger
  const totalGameWinnings = myBets
    .filter((b) => b.status === 'won')
    .reduce((acc, b) => acc + (b.payout || 0), 0);

  const getChoiceBadge = (choice: BetChoice) => {
    switch (choice) {
      case 'dragon':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-rose-500/20 text-rose-300 border border-rose-500/50 shadow-[0_0_10px_rgba(244,63,94,0.3)]">
            <span className="text-sm">🐉</span>
            <span>DRAGON</span>
            <span className="text-[10px] text-rose-400 font-bold bg-rose-950/80 px-1.5 py-0.5 rounded">2.0X</span>
          </span>
        );
      case 'tiger':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-amber-500/20 text-amber-300 border border-amber-500/50 shadow-[0_0_10px_rgba(245,158,11,0.3)]">
            <span className="text-sm">🐅</span>
            <span>TIGER</span>
            <span className="text-[10px] text-amber-400 font-bold bg-amber-950/80 px-1.5 py-0.5 rounded">2.0X</span>
          </span>
        );
      case 'tie':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/50 shadow-[0_0_10px_rgba(16,185,129,0.3)]">
            <span className="text-sm">👔</span>
            <span>TIE</span>
            <span className="text-[10px] text-emerald-400 font-bold bg-emerald-950/80 px-1.5 py-0.5 rounded">8.0X</span>
          </span>
        );
    }
  };

  const getWinnerBadge = (winChoice?: 'dragon' | 'tiger' | 'tie') => {
    if (!winChoice) return <span className="text-slate-500 font-mono">—</span>;
    switch (winChoice) {
      case 'dragon':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-black bg-rose-500/20 text-rose-400 border border-rose-500/40">
            <span>🐉</span> Dragon
          </span>
        );
      case 'tiger':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-black bg-amber-500/20 text-amber-300 border border-amber-500/40">
            <span>🐅</span> Tiger
          </span>
        );
      case 'tie':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-black bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
            <span>👔</span> Tie (8X)
          </span>
        );
    }
  };

  // Fetch or setup local state
  useEffect(() => {
    fetchGameState();
  }, []);

  const fetchGameState = async () => {
    try {
      const storedId = user?.id || localStorage.getItem('tp_user_id') || '';
      const res = await fetch('/api/dragon-tiger', {
        headers: { 'x-user-id': storedId },
      });
      if (res.ok) {
        const data = await res.json();
        setHistory(data.history || []);
        setMyBets(data.myBets || []);
      }
    } catch (e) {
      console.error('Failed to fetch Dragon Tiger state', e);
    }
  };

  const handlePlaceBet = async (choice: BetChoice) => {
    if (gameState === 'dealing') {
      showToast('Card dealing in progress, please wait!', 'error');
      return;
    }

    const totalAvail = (user?.balance || 0) + (user?.winningBalance || 0) + (user?.depositBalance || 0);
    if (totalAvail < chipAmount) {
      showToast(`Insufficient balance! Required: $${chipAmount.toFixed(2)} USDT (Available: $${totalAvail.toFixed(2)})`, 'error');
      return;
    }

    setSelectedChoice(choice);
    setPlacingBet(true);
    setGameState('dealing');

    try {
      const storedId = user?.id || user?.nodeId || localStorage.getItem('tp_user_id') || '';
      const res = await fetch('/api/dragon-tiger/bet', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': storedId,
        },
        body: JSON.stringify({
          choice,
          amount: chipAmount,
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        // Animate deal cards
        setDragonCard(data.dragonCard);
        setTigerCard(data.tigerCard);
        setWinner(data.winner);

        setTimeout(() => {
          setGameState('result');
          setResultModal({
            isOpen: true,
            winner: data.winner,
            userChoice: choice,
            winAmount: data.isWin ? (data.payout || 0) : 0,
            betAmount: chipAmount,
            roundId: data.roundId || roundId,
            cashbackAwarded: data.cashbackAwarded,
          });
          if (data.isWin) {
            showToast(`🎉 WINNER! You won $${data.payout.toFixed(2)} USDT on ${choice.toUpperCase()}!`, 'success');
          } else if (data.cashbackAwarded > 0) {
            showToast(`🛡️ 50% First 3 Bets Loss Shield Activated! +$${data.cashbackAwarded.toFixed(2)} USDT refunded!`, 'success');
          } else {
            showToast(`Round finished! Result: ${data.winner.toUpperCase()} won.`, 'error');
          }
          fetchGameState();
          onRefreshUser();
          setRoundId(`DT-${Math.floor(100000 + Math.random() * 900000)}`);
        }, 1200);

      } else {
        // Local Client-Side Fallback if server endpoint missing
        runClientGameFallback(choice);
      }
    } catch (err) {
      runClientGameFallback(choice);
    } finally {
      setPlacingBet(false);
    }
  };

  // Client-side execution if offline or direct fallback
  const runClientGameFallback = (choice: BetChoice) => {
    const dCard = getRandomCard();
    const tCard = getRandomCard();

    let win: 'dragon' | 'tiger' | 'tie' = 'dragon';
    if (dCard.rank > tCard.rank) win = 'dragon';
    else if (tCard.rank > dCard.rank) win = 'tiger';
    else win = 'tie';

    setDragonCard(dCard);
    setTigerCard(tCard);
    setWinner(win);

    const isWin = choice === win;
    let multiplier = 2.0;
    if (choice === 'tie') multiplier = 8.0;

    const payout = isWin ? chipAmount * multiplier : 0;

    // Deduct user balance locally & trigger state update
    if (isWin) {
      user.winningBalance = (user.winningBalance || 0) + (payout - chipAmount);
      user.totalEarned = (user.totalEarned || 0) + (payout - chipAmount);
    } else {
      let rem = chipAmount;
      if ((user.winningBalance || 0) >= rem) {
        user.winningBalance = (user.winningBalance || 0) - rem;
        rem = 0;
      } else if ((user.winningBalance || 0) > 0) {
        rem -= user.winningBalance;
        user.winningBalance = 0;
      }
      if (rem > 0 && (user.depositBalance || 0) >= rem) {
        user.depositBalance = (user.depositBalance || 0) - rem;
        rem = 0;
      } else if (rem > 0 && (user.depositBalance || 0) > 0) {
        rem -= user.depositBalance;
        user.depositBalance = 0;
      }
      if (rem > 0) {
        user.balance = Math.max(0, (user.balance || 0) - rem);
      }
    }

    const newHist: DragonTigerHistory = {
      id: `h-${Date.now()}`,
      roundId,
      dragonCard: dCard,
      tigerCard: tCard,
      winner: win,
      completedAt: new Date().toISOString(),
    };

    const newBet: DragonTigerBet = {
      id: `b-${Date.now()}`,
      roundId,
      choice,
      amount: chipAmount,
      dragonCard: dCard,
      tigerCard: tCard,
      winner: win,
      payout,
      status: isWin ? 'won' : 'lost',
      createdAt: new Date().toISOString(),
    };

    setTimeout(() => {
      setGameState('result');
      setHistory((prev) => [newHist, ...prev.slice(0, 49)]);
      setMyBets((prev) => [newBet, ...prev.slice(0, 29)]);

      setResultModal({
        isOpen: true,
        winner: win,
        userChoice: choice,
        winAmount: isWin ? payout : 0,
        betAmount: chipAmount,
        roundId,
      });

      if (isWin) {
        showToast(`🎉 WINNER! You won $${payout.toFixed(2)} USDT on ${choice.toUpperCase()}!`, 'success');
      } else {
        showToast(`Round finished! Result: ${win.toUpperCase()} won.`, 'error');
      }

      onRefreshUser();
      setRoundId(`DT-${Math.floor(100000 + Math.random() * 900000)}`);
    }, 1200);
  };

  const renderCardVisual = (card: Card | null, label: string, accentColor: string) => {
    return (
      <div className="flex flex-col items-center space-y-1.5 sm:space-y-2 shrink-0">
        <span className={`text-[9px] sm:text-xs font-black tracking-wider uppercase ${accentColor}`}>
          {label}
        </span>
        <div
          className={`w-20 h-28 sm:w-28 sm:h-40 md:w-32 md:h-44 rounded-xl sm:rounded-2xl border flex flex-col justify-between p-1.5 sm:p-2.5 shadow-2xl relative transition-all duration-500 transform ${
            card
              ? 'bg-gradient-to-br from-slate-100 to-slate-200 border-white text-slate-900 scale-100 rotate-0'
              : 'bg-[#070e1b] border-slate-800 scale-95'
          }`}
        >
          {card ? (
            <>
              {/* Top Left Rank */}
              <div className="flex flex-col items-start leading-none font-black">
                <span className={`text-sm sm:text-xl ${card.color === 'red' ? 'text-rose-600' : 'text-slate-900'}`}>
                  {card.value}
                </span>
                <span className={`text-xs sm:text-base ${card.color === 'red' ? 'text-rose-600' : 'text-slate-900'}`}>
                  {card.suit}
                </span>
              </div>

              {/* Center Suit Symbol */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <span className={`text-2xl sm:text-4xl ${card.color === 'red' ? 'text-rose-600/90' : 'text-slate-900/90'}`}>
                  {card.suit}
                </span>
              </div>

              {/* Bottom Right Rank (Inverted) */}
              <div className="flex flex-col items-end leading-none font-black rotate-180">
                <span className={`text-sm sm:text-xl ${card.color === 'red' ? 'text-rose-600' : 'text-slate-900'}`}>
                  {card.value}
                </span>
                <span className={`text-xs sm:text-base ${card.color === 'red' ? 'text-rose-600' : 'text-slate-900'}`}>
                  {card.suit}
                </span>
              </div>
            </>
          ) : (
            <div className="w-full h-full rounded-lg bg-gradient-to-br from-slate-900 to-[#0b1526] border border-cyan-500/20 flex flex-col items-center justify-center p-1 text-center space-y-1">
              <Sparkles className="w-5 h-5 sm:w-7 sm:h-7 text-cyan-400/50 animate-pulse" />
              <span className="text-[8px] sm:text-[10px] text-slate-500 font-mono">CARD</span>
            </div>
          )}
        </div>

        {card && (
          <div className="text-center font-mono text-[9px] sm:text-xs">
            <span className="text-slate-400">Value: </span>
            <strong className="text-amber-400 font-bold">{card.value} ({card.rank} Pt)</strong>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6 font-mono text-slate-100 max-w-6xl mx-auto pb-20">
      {/* Top Banner Header with Dragon vs Tiger Artwork Background */}
      <div className="relative overflow-hidden rounded-3xl border border-amber-500/40 p-6 shadow-[0_0_35px_rgba(245,158,11,0.2)] bg-gradient-to-r from-[#2c080b] via-[#3a1d07] to-[#1a0a22]">
        {/* Background Image Overlay with Oriental Glow & Sunburst */}
        <div 
          className="absolute inset-0 bg-cover bg-center opacity-30 mix-blend-overlay pointer-events-none" 
          style={{ backgroundImage: `url('https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?q=80&w=1600&auto=format&fit=crop')` }}
        />
        
        {/* Oriental Radial Sunburst Lighting */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-0 right-0 w-80 h-80 bg-rose-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-60 h-60 bg-amber-600/20 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-amber-500/20 border border-amber-400/50 text-amber-300 text-xs font-bold flex items-center gap-1.5 shadow-[0_0_12px_rgba(245,158,11,0.4)]">
                <Flame className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                DRAGON VS TIGER CASINO ARENA
              </span>
              <span className="text-xs text-amber-200/80 font-sans font-semibold">High Speed 1-Card Duel</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-amber-100 flex items-center gap-3">
              🐉 Dragon vs Tiger 🐅
            </h1>
            <p className="text-xs md:text-sm text-slate-300 max-w-xl font-sans">
              Choose Dragon, Tiger, or Tie! Highest card rank wins up to <strong className="text-amber-400">8X Instant Payout</strong> with zero server lag.
            </p>
          </div>

          {/* User Balance Card */}
          <div className="w-full lg:w-auto bg-[#0d0711]/90 border border-amber-500/40 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between lg:justify-start gap-5 shadow-2xl backdrop-blur-md">
            <div className="flex items-center gap-4">
              <div>
                <div className="text-[10px] uppercase text-cyan-300 tracking-wider font-extrabold flex items-center gap-1">
                  <span>💳 Deposit Wallet</span>
                </div>
                <div className="text-lg font-black text-cyan-300">
                  ${(user?.depositBalance || 0).toFixed(2)} <span className="text-xs text-slate-500 font-normal">USDT</span>
                </div>
              </div>
              <div className="h-10 w-[1px] bg-amber-500/20" />
              <div>
                <div className="text-[10px] uppercase text-amber-400 tracking-wider font-extrabold flex items-center gap-1">
                  <span>🎮 Winning Wallet</span>
                </div>
                <div className="text-lg font-black text-amber-300">
                  ${(user?.winningBalance || 0).toFixed(2)} <span className="text-xs text-slate-500 font-normal">USDT</span>
                </div>
              </div>
            </div>

            {/* Quick Deposit & Withdraw Buttons */}
            <div className="flex items-center gap-2 border-t sm:border-t-0 sm:border-l border-amber-500/20 pt-2 sm:pt-0 sm:pl-4 w-full sm:w-auto justify-end">
              {onOpenDeposit && (
                <button
                  onClick={onOpenDeposit}
                  className="px-3.5 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/50 text-xs font-black transition shadow-[0_0_10px_rgba(16,185,129,0.2)]"
                >
                  + Deposit
                </button>
              )}
              {onOpenWithdraw && (
                <button
                  onClick={onOpenWithdraw}
                  className="px-3.5 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/50 text-xs font-black transition shadow-[0_0_10px_rgba(245,158,11,0.2)]"
                >
                  Withdraw
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Arena Battle Canvas Card - REAL CASINO FELT TABLE WITH DRAGON & TIGER ARTWORK */}
      <div className="bg-gradient-to-b from-[#21090a] via-[#1c0e05] to-[#0d050c] border-4 border-amber-500/50 rounded-3xl p-3 sm:p-6 space-y-5 shadow-[0_0_50px_rgba(245,158,11,0.25)] relative overflow-hidden">
        {/* Table Background Image Overlay */}
        <div 
          className="absolute inset-0 bg-cover bg-center opacity-25 pointer-events-none mix-blend-color-dodge" 
          style={{ backgroundImage: `url('https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=1600&auto=format&fit=crop')` }}
        />

        {/* Table Stitched Gold Border Effect */}
        <div className="absolute inset-1 border border-dashed border-amber-400/40 rounded-2xl pointer-events-none" />

        {/* Round Header & Live Active Players Meter */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-[#030f0a]/80 border border-emerald-500/30 rounded-2xl p-3.5 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-400/50 flex items-center justify-center text-amber-400 font-extrabold shadow-[0_0_15px_rgba(245,158,11,0.3)]">
              <Zap className="w-5 h-5 animate-bounce" />
            </div>
            <div>
              <div className="text-[10px] text-slate-400 uppercase font-semibold flex items-center gap-2">
                <span>Round #{roundId}</span>
                <span className="text-emerald-400 font-mono">• 384 Players Live</span>
              </div>
              <div className="text-xs sm:text-sm font-extrabold text-amber-300 tracking-wider">MACAU D-T TABLE #01</div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 font-sans">Status:</span>
            {gameState === 'dealing' ? (
              <span className="px-3 py-1 bg-amber-500/20 border border-amber-500/50 text-amber-300 text-xs font-bold rounded-full animate-pulse flex items-center gap-1 shadow-[0_0_12px_rgba(245,158,11,0.3)]">
                <RotateCcw className="w-3.5 h-3.5 animate-spin" />
                DEALING CARDS...
              </span>
            ) : gameState === 'result' ? (
              <span className="px-3 py-1 bg-emerald-500/20 border border-emerald-500/50 text-emerald-400 text-xs font-bold rounded-full flex items-center gap-1 shadow-[0_0_12px_rgba(16,185,129,0.3)]">
                <Trophy className="w-3.5 h-3.5" />
                ROUND FINISHED
              </span>
            ) : (
              <span className="px-3 py-1 bg-cyan-500/20 border border-cyan-500/50 text-cyan-300 text-xs font-bold rounded-full shadow-[0_0_12px_rgba(6,182,212,0.3)]">
                BETTING OPEN
              </span>
            )}
          </div>
        </div>

        {/* Real Casino Roadmap / Trend History (Bead Plate Matrix Grid) */}
        <div className="bg-[#020b07]/90 border border-emerald-500/20 rounded-2xl p-3 space-y-2">
          <div className="flex items-center justify-between text-[11px] font-bold text-slate-300">
            <span className="flex items-center gap-1.5 text-amber-300">
              <History className="w-3.5 h-3.5 text-amber-400" />
              CASINO ROADMAP (BEAD PLATE)
            </span>
            <div className="flex items-center gap-3 text-[10px]">
              <span className="flex items-center gap-1 text-rose-400">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block" /> Dragon ({history.filter(h => h.winner === 'dragon').length})
              </span>
              <span className="flex items-center gap-1 text-amber-400">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" /> Tiger ({history.filter(h => h.winner === 'tiger').length})
              </span>
              <span className="flex items-center gap-1 text-emerald-400">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" /> Tie ({history.filter(h => h.winner === 'tie').length})
              </span>
            </div>
          </div>

          {/* Matrix Dots Row */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
            {history.length === 0 ? (
              <div className="text-[11px] text-slate-500 italic py-1">No history rounds recorded yet...</div>
            ) : (
              history.slice(0, 24).map((item, idx) => (
                <div
                  key={item.id || idx}
                  title={`Round #${item.roundId} - Winner: ${item.winner.toUpperCase()}`}
                  className={`w-7 h-7 shrink-0 rounded-full flex items-center justify-center font-extrabold text-[11px] shadow-md border ${
                    item.winner === 'dragon'
                      ? 'bg-gradient-to-br from-rose-500 to-rose-700 text-white border-rose-300 shadow-[0_0_8px_rgba(244,63,94,0.5)]'
                      : item.winner === 'tiger'
                      ? 'bg-gradient-to-br from-amber-400 to-amber-600 text-black border-amber-200 shadow-[0_0_8px_rgba(245,158,11,0.5)]'
                      : 'bg-gradient-to-br from-emerald-500 to-emerald-700 text-white border-emerald-300 shadow-[0_0_8px_rgba(16,185,129,0.5)]'
                  }`}
                >
                  {item.winner === 'dragon' && 'D'}
                  {item.winner === 'tiger' && 'T'}
                  {item.winner === 'tie' && 'TIE'}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Duel Card Arena (Dragon Left vs Tiger Right) with Poster-Style Image Artwork Background */}
        <div className="relative bg-gradient-to-r from-[#2a070e] via-[#1c0d03] to-[#210c03] border-2 border-amber-500/60 rounded-3xl p-4 sm:p-6 md:p-8 flex flex-row items-center justify-between sm:justify-around gap-2 sm:gap-6 shadow-[0_0_40px_rgba(245,158,11,0.3)] overflow-hidden">
          {/* Background Poster Image Overlay */}
          <div 
            className="absolute inset-0 bg-cover bg-center opacity-30 mix-blend-color-dodge pointer-events-none" 
            style={{ backgroundImage: `url('https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?q=80&w=1600&auto=format&fit=crop')` }}
          />

          {/* Oriental Sunburst Center Ray Glow */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 sm:w-96 sm:h-96 bg-amber-500/20 rounded-full blur-3xl pointer-events-none" />

          {/* Left Side Dragon Artwork Glow */}
          <div className="absolute left-0 top-0 bottom-0 w-1/3 bg-gradient-to-r from-emerald-600/20 to-transparent pointer-events-none flex items-center justify-start pl-2 opacity-40">
            <span className="text-7xl sm:text-9xl filter drop-shadow-[0_0_20px_rgba(16,185,129,0.8)] select-none">🐉</span>
          </div>

          {/* Right Side Tiger Artwork Glow */}
          <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-gradient-to-l from-amber-600/20 to-transparent pointer-events-none flex items-center justify-end pr-2 opacity-40">
            <span className="text-7xl sm:text-9xl filter drop-shadow-[0_0_20px_rgba(245,158,11,0.8)] select-none">🐅</span>
          </div>

          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none text-amber-500/20 text-5xl sm:text-7xl md:text-9xl font-black opacity-30 select-none tracking-widest">
            VS
          </div>

          {/* Dragon Visual */}
          <div className="relative z-10">
            {renderCardVisual(dragonCard, '🐉 DRAGON (2.0X)', 'text-rose-400')}
          </div>

          {/* Result Banner in Center */}
          <div className="z-10 flex flex-col items-center justify-center space-y-2">
            {winner ? (
              <motion.div
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className={`px-5 py-2.5 sm:px-6 sm:py-3 rounded-2xl border-2 font-black text-sm sm:text-lg md:text-xl shadow-2xl uppercase text-center ${
                  winner === 'dragon'
                    ? 'bg-rose-600 text-white border-rose-400 shadow-[0_0_30px_rgba(244,63,94,0.8)] animate-pulse'
                    : winner === 'tiger'
                    ? 'bg-amber-500 text-black border-amber-300 shadow-[0_0_30px_rgba(245,158,11,0.8)] animate-pulse'
                    : 'bg-emerald-600 text-white border-emerald-400 shadow-[0_0_30px_rgba(16,185,129,0.8)] animate-pulse'
                }`}
              >
                {winner === 'dragon' && '🐉 DRAGON WINS!'}
                {winner === 'tiger' && '🐅 TIGER WINS!'}
                {winner === 'tie' && '👔 TIE MATCH (8X)!'}
              </motion.div>
            ) : (
              <div className="text-center font-sans space-y-1">
                <span className="text-xs text-amber-200/90 uppercase tracking-widest block font-extrabold drop-shadow">LIVE DEALER</span>
                <span className="text-xs text-amber-300 font-mono font-bold bg-black/60 px-3.5 py-1.5 rounded-full border border-amber-500/50 shadow-lg backdrop-blur-sm">
                  Place Bet & Deal
                </span>
              </div>
            )}
          </div>

          {/* Tiger Visual */}
          <div className="relative z-10">
            {renderCardVisual(tigerCard, '🐅 TIGER (2.0X)', 'text-amber-400')}
          </div>
        </div>

        {/* REAL 3D CASINO GOLD CHIPS SELECTOR ($1, $5, $10, $50, $100, $500) */}
        <div className="space-y-2.5 bg-[#020d08]/80 border border-amber-500/30 rounded-2xl p-3.5">
          <div className="text-xs uppercase text-slate-300 font-bold tracking-wider flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-amber-400">
              <Sparkles className="w-3.5 h-3.5" /> SELECT YOUR CHIP STAKE
            </span>
            <span className="text-cyan-300 font-extrabold bg-cyan-500/10 border border-cyan-500/30 px-2.5 py-0.5 rounded-lg">
              Selected: ${chipAmount} USDT
            </span>
          </div>

          <div className="grid grid-cols-6 gap-2 sm:gap-3">
            {[1, 5, 10, 50, 100, 500].map((amt) => {
              const isSelected = chipAmount === amt;
              return (
                <button
                  key={amt}
                  onClick={() => setChipAmount(amt)}
                  className={`py-2.5 sm:py-3 rounded-2xl font-black text-xs sm:text-sm transition-all duration-200 flex flex-col items-center justify-center relative shadow-xl ${
                    isSelected
                      ? 'bg-gradient-to-b from-amber-300 via-amber-500 to-amber-700 text-black border-2 border-white scale-110 shadow-[0_0_20px_rgba(245,158,11,0.8)] z-10'
                      : 'bg-gradient-to-b from-slate-800 to-slate-900 text-slate-200 border border-amber-500/30 hover:border-amber-400/60 hover:scale-105'
                  }`}
                >
                  {/* Inner Metallic Coin Ring */}
                  <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full border-2 flex items-center justify-center shadow-inner ${
                    isSelected ? 'border-amber-900 bg-amber-400 text-black' : 'border-slate-600 bg-slate-800 text-amber-300'
                  }`}>
                    <span className="font-extrabold">${amt}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* 3 Main Betting Action Options (Dragon 2X / Tie 8X / Tiger 2X in a Single Compact Row) */}
        <div className="grid grid-cols-3 gap-2 sm:gap-3 pt-2">
          {/* Dragon Button */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            disabled={gameState === 'dealing' || placingBet}
            onClick={() => handlePlaceBet('dragon')}
            className={`py-3 sm:py-3.5 rounded-2xl font-black text-sm sm:text-base border-2 transition shadow-xl flex items-center justify-center gap-1.5 ${
              gameState === 'dealing'
                ? 'opacity-50 cursor-not-allowed bg-rose-950/20 text-rose-400 border-rose-900/40'
                : 'bg-gradient-to-b from-rose-500 to-rose-700 text-white border-rose-400/80 hover:from-rose-400 hover:to-rose-600 shadow-[0_0_20px_rgba(244,63,94,0.4)]'
            }`}
          >
            <span className="text-lg sm:text-xl">🐉</span>
            <span className="font-extrabold tracking-wide">2X</span>
          </motion.button>

          {/* Tie Button */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            disabled={gameState === 'dealing' || placingBet}
            onClick={() => handlePlaceBet('tie')}
            className={`py-3 sm:py-3.5 rounded-2xl font-black text-sm sm:text-base border-2 transition shadow-xl flex items-center justify-center gap-1.5 ${
              gameState === 'dealing'
                ? 'opacity-50 cursor-not-allowed bg-emerald-950/20 text-emerald-400 border-emerald-900/40'
                : 'bg-gradient-to-b from-emerald-500 to-emerald-700 text-white border-emerald-400/80 hover:from-emerald-400 hover:to-emerald-600 shadow-[0_0_20px_rgba(16,185,129,0.4)]'
            }`}
          >
            <span className="text-lg sm:text-xl">👔</span>
            <span className="font-extrabold tracking-wide">8X</span>
          </motion.button>

          {/* Tiger Button */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            disabled={gameState === 'dealing' || placingBet}
            onClick={() => handlePlaceBet('tiger')}
            className={`py-3 sm:py-3.5 rounded-2xl font-black text-sm sm:text-base border-2 transition shadow-xl flex items-center justify-center gap-1.5 ${
              gameState === 'dealing'
                ? 'opacity-50 cursor-not-allowed bg-amber-950/20 text-amber-400 border-amber-900/40'
                : 'bg-gradient-to-b from-amber-500 to-amber-600 text-black border-amber-300 hover:from-amber-400 hover:to-amber-500 shadow-[0_0_20px_rgba(245,158,11,0.4)]'
            }`}
          >
            <span className="text-lg sm:text-xl">🐅</span>
            <span className="font-extrabold tracking-wide">2X</span>
          </motion.button>
        </div>
      </div>

      {/* Navigation Tabs (Round History / My Bets & Win-Loss / Rules) */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('game')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition ${
            activeTab === 'game'
              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 shadow-[0_0_12px_rgba(244,63,94,0.2)]'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
          }`}
        >
          <History className="w-4 h-4 text-rose-400" />
          <span>Round History</span>
          <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded-full font-mono">
            {history.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('mybets')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition ${
            activeTab === 'mybets'
              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-[0_0_12px_rgba(245,158,11,0.2)]'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
          }`}
        >
          <Trophy className="w-4 h-4 text-amber-400" />
          <span>My Bets & Win/Loss</span>
          <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-full font-mono">
            {myBets.length}
          </span>
          {myBets.filter((b) => b.status === 'won').length > 0 && (
            <span className="text-[10px] bg-emerald-500 text-black font-black px-2 py-0.5 rounded-full shadow">
              {myBets.filter((b) => b.status === 'won').length} WON
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('rules')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition ${
            activeTab === 'rules'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-[0_0_12px_rgba(6,182,212,0.2)]'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
          }`}
        >
          <HelpCircle className="w-4 h-4 text-cyan-400" />
          <span>Card Rankings & Rules</span>
        </button>
      </div>

      {/* Tab 1: Round History with User Bet Tracking */}
      {activeTab === 'game' && (
        <div className="bg-[#0b1320] border border-slate-800 rounded-2xl p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <History className="w-4 h-4 text-rose-400" />
              Recent Rounds History (Live Results)
            </h3>
            <span className="text-xs text-slate-400 font-sans">Shows winner & your win/loss status</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-[#070d18] text-slate-400 uppercase tracking-wider border-b border-slate-800">
                <tr>
                  <th className="p-3">Round ID</th>
                  <th className="p-3">Dragon Card</th>
                  <th className="p-3">Tiger Card</th>
                  <th className="p-3">Winner Result</th>
                  <th className="p-3">Your Bet & Outcome</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-200">
                {history.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-slate-500 font-sans">
                      No game history recorded yet. Place a bet to start!
                    </td>
                  </tr>
                ) : (
                  history.map((row) => {
                    // Check if current user participated in this round
                    const userBet = myBets.find((b) => b.roundId === row.roundId);
                    const diff = Math.abs(row.dragonCard.rank - row.tigerCard.rank);

                    return (
                      <tr key={row.id} className="hover:bg-slate-800/30 transition">
                        <td className="p-3 font-bold text-slate-300 whitespace-nowrap">
                          #{row.roundId}
                        </td>
                        <td className="p-3 font-bold">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border font-mono ${
                              row.dragonCard.color === 'red'
                                ? 'bg-rose-950/30 border-rose-500/40 text-rose-400'
                                : 'bg-slate-900 border-slate-700 text-slate-200'
                            }`}
                          >
                            <span className="text-sm font-extrabold">{row.dragonCard.value}</span>
                            <span className="text-base">{row.dragonCard.suit}</span>
                            <span className="text-[10px] text-slate-400 opacity-80">({row.dragonCard.rank}pt)</span>
                          </span>
                        </td>
                        <td className="p-3 font-bold">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border font-mono ${
                              row.tigerCard.color === 'red'
                                ? 'bg-amber-950/30 border-amber-500/40 text-amber-400'
                                : 'bg-slate-900 border-slate-700 text-slate-200'
                            }`}
                          >
                            <span className="text-sm font-extrabold">{row.tigerCard.value}</span>
                            <span className="text-base">{row.tigerCard.suit}</span>
                            <span className="text-[10px] text-slate-400 opacity-80">({row.tigerCard.rank}pt)</span>
                          </span>
                        </td>
                        <td className="p-3 whitespace-nowrap">
                          {row.winner === 'dragon' && (
                            <span className="bg-rose-500/20 text-rose-300 border border-rose-500/40 px-2.5 py-1 rounded-full text-xs font-bold inline-flex items-center gap-1">
                              🐉 Dragon Won {diff > 0 && <span className="text-[10px] text-rose-400 font-mono">(+{diff})</span>}
                            </span>
                          )}
                          {row.winner === 'tiger' && (
                            <span className="bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2.5 py-1 rounded-full text-xs font-bold inline-flex items-center gap-1">
                              🐅 Tiger Won {diff > 0 && <span className="text-[10px] text-amber-400 font-mono">(+{diff})</span>}
                            </span>
                          )}
                          {row.winner === 'tie' && (
                            <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2.5 py-1 rounded-full text-xs font-bold inline-flex items-center gap-1">
                              👔 Tie Match (8X)
                            </span>
                          )}
                        </td>
                        <td className="p-3 whitespace-nowrap">
                          {userBet ? (
                            userBet.status === 'won' ? (
                              <div className="flex items-center gap-1.5">
                                <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/50 px-2.5 py-1 rounded-full text-xs font-black inline-flex items-center gap-1 shadow-[0_0_10px_rgba(16,185,129,0.2)]">
                                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                                  YOU WON +${userBet.payout.toFixed(2)}
                                </span>
                                <span className="text-[10px] text-slate-400 uppercase font-bold">
                                  (Bet: {userBet.choice})
                                </span>
                              </div>
                            ) : (
                              <div className="flex flex-col gap-0.5">
                                <div className="flex items-center gap-1.5">
                                  <span className="bg-rose-500/20 text-rose-400 border border-rose-500/40 px-2.5 py-1 rounded-full text-xs font-bold inline-flex items-center gap-1">
                                    <XCircle className="w-3.5 h-3.5 text-rose-400" />
                                    LOST -${userBet.amount.toFixed(2)}
                                  </span>
                                  <span className="text-[10px] text-slate-400 uppercase font-bold">
                                    (Bet: {userBet.choice})
                                  </span>
                                </div>
                                {userBet.cashbackAwarded && userBet.cashbackAwarded > 0 ? (
                                  <span className="text-[10px] text-purple-300 font-bold flex items-center gap-1 pl-1">
                                    🛡️ 50% Shield Refunded: +${userBet.cashbackAwarded.toFixed(2)}
                                  </span>
                                ) : null}
                              </div>
                            )
                          ) : (
                            <span className="text-slate-500 text-xs italic">— No bet placed</span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: My Bets Log & Detailed Win/Loss Analysis */}
      {activeTab === 'mybets' && (
        <div className="space-y-4">
          {/* Real-time Performance & Win/Loss Summary Metrics */}
          {(() => {
            const totalBets = myBets.length;
            const wonBets = myBets.filter((b) => b.status === 'won').length;
            const lostBets = myBets.filter((b) => b.status === 'lost').length;
            const winRate = totalBets > 0 ? ((wonBets / totalBets) * 100).toFixed(1) : '0.0';
            const totalWagered = myBets.reduce((acc, b) => acc + (b.amount || 0), 0);
            const totalPaid = myBets.filter((b) => b.status === 'won').reduce((acc, b) => acc + (b.payout || 0), 0);
            const totalShieldRefunded = myBets.reduce((acc, b) => acc + (b.cashbackAwarded || 0), 0);
            const netProfit = totalPaid + totalShieldRefunded - totalWagered;

            return (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-sans">
                {/* Total Bets */}
                <div className="bg-[#0b1320] border border-slate-800 rounded-2xl p-3.5 flex flex-col justify-between">
                  <div className="flex items-center justify-between text-slate-400 text-xs font-bold uppercase">
                    <span>Total Bets</span>
                    <History className="w-3.5 h-3.5 text-cyan-400" />
                  </div>
                  <div className="mt-2">
                    <div className="text-xl sm:text-2xl font-black text-white font-mono">{totalBets}</div>
                    <div className="text-[11px] text-slate-400 font-mono">Wagered: ${totalWagered.toFixed(2)}</div>
                  </div>
                </div>

                {/* Win Rate */}
                <div className="bg-[#0b1320] border border-slate-800 rounded-2xl p-3.5 flex flex-col justify-between">
                  <div className="flex items-center justify-between text-slate-400 text-xs font-bold uppercase">
                    <span>Wins & Win Rate</span>
                    <Trophy className="w-3.5 h-3.5 text-amber-400" />
                  </div>
                  <div className="mt-2">
                    <div className="text-xl sm:text-2xl font-black text-emerald-400 font-mono flex items-center gap-1.5">
                      <span>{wonBets}</span>
                      <span className="text-xs text-amber-300 font-bold bg-amber-500/20 px-1.5 py-0.5 rounded">
                        {winRate}%
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400 font-mono">Lost: {lostBets} bets</div>
                  </div>
                </div>

                {/* Total Payout Won */}
                <div className="bg-[#0b1320] border border-slate-800 rounded-2xl p-3.5 flex flex-col justify-between">
                  <div className="flex items-center justify-between text-slate-400 text-xs font-bold uppercase">
                    <span>Total Payout Won</span>
                    <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                  </div>
                  <div className="mt-2">
                    <div className="text-xl sm:text-2xl font-black text-emerald-400 font-mono">
                      +${totalPaid.toFixed(2)}
                    </div>
                    <div className="text-[11px] text-purple-300 font-mono flex items-center gap-1">
                      <Shield className="w-3 h-3 text-purple-400 inline" /> Shield: +${totalShieldRefunded.toFixed(2)}
                    </div>
                  </div>
                </div>

                {/* Net Profit / Loss */}
                <div className={`border rounded-2xl p-3.5 flex flex-col justify-between ${
                  netProfit >= 0
                    ? 'bg-emerald-950/20 border-emerald-500/40 shadow-[0_0_15px_rgba(16,185,129,0.15)]'
                    : 'bg-rose-950/20 border-rose-500/40 shadow-[0_0_15px_rgba(244,63,94,0.15)]'
                }`}>
                  <div className="flex items-center justify-between text-slate-400 text-xs font-bold uppercase">
                    <span>Net Profit / Loss</span>
                    {netProfit >= 0 ? (
                      <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <TrendingDown className="w-3.5 h-3.5 text-rose-400" />
                    )}
                  </div>
                  <div className="mt-2">
                    <div className={`text-xl sm:text-2xl font-black font-mono ${
                      netProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'
                    }`}>
                      {netProfit >= 0 ? `+$${netProfit.toFixed(2)}` : `-$${Math.abs(netProfit).toFixed(2)}`}
                    </div>
                    <div className="text-[11px] text-slate-400 font-mono">
                      {netProfit >= 0 ? 'In Profit 🚀' : 'Net Deficit'}
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* Detailed Bet Log Table */}
          <div className="bg-[#0b1320] border border-slate-800 rounded-2xl p-4 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Trophy className="w-4 h-4 text-amber-400" />
                My Bet History & Detailed Win/Loss Records
              </h3>
              <span className="text-xs text-slate-400 font-sans">Sorted by latest deal</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-[#070d18] text-slate-400 uppercase tracking-wider border-b border-slate-800">
                  <tr>
                    <th className="p-3">Round ID & Time</th>
                    <th className="p-3">Your Selection</th>
                    <th className="p-3">Deal Cards & Result</th>
                    <th className="p-3">Stake</th>
                    <th className="p-3">Win / Loss Status</th>
                    <th className="p-3">Payout & Return</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-200">
                  {myBets.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-slate-500 font-sans">
                        You haven't placed any bets yet in Dragon vs Tiger. Place a bet on Dragon, Tiger, or Tie!
                      </td>
                    </tr>
                  ) : (
                    myBets.map((bet) => {
                      const formattedTime = bet.createdAt
                        ? new Date(bet.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
                        : 'Recent';

                      return (
                        <tr key={bet.id} className="hover:bg-slate-800/30 transition">
                          {/* Round ID & Time */}
                          <td className="p-3">
                            <div className="font-bold text-slate-200">#{bet.roundId}</div>
                            <div className="text-[10px] text-slate-400 font-sans">{formattedTime}</div>
                          </td>

                          {/* Your Selection */}
                          <td className="p-3">
                            {getChoiceBadge(bet.choice)}
                          </td>

                          {/* Cards & Outcome */}
                          <td className="p-3">
                            {bet.dragonCard && bet.tigerCard ? (
                              <div className="flex flex-col gap-1">
                                <div className="flex items-center gap-1.5 font-mono text-xs">
                                  <span className={bet.dragonCard.color === 'red' ? 'text-rose-400 font-bold' : 'text-slate-200 font-bold'}>
                                    🐉 {bet.dragonCard.value}{bet.dragonCard.suit} ({bet.dragonCard.rank})
                                  </span>
                                  <span className="text-slate-500">vs</span>
                                  <span className={bet.tigerCard.color === 'red' ? 'text-amber-400 font-bold' : 'text-slate-200 font-bold'}>
                                    🐅 {bet.tigerCard.value}{bet.tigerCard.suit} ({bet.tigerCard.rank})
                                  </span>
                                </div>
                                <div className="text-[11px]">
                                  {getWinnerBadge(bet.winner)}
                                </div>
                              </div>
                            ) : (
                              <div>{getWinnerBadge(bet.winner)}</div>
                            )}
                          </td>

                          {/* Stake */}
                          <td className="p-3 font-bold text-white font-mono">
                            ${bet.amount.toFixed(2)}
                          </td>

                          {/* Win / Loss Status */}
                          <td className="p-3">
                            {bet.status === 'won' ? (
                              <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/50 px-3 py-1 rounded-full text-xs font-black inline-flex items-center gap-1.5 shadow-[0_0_10px_rgba(16,185,129,0.3)]">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                                🏆 WON
                              </span>
                            ) : (
                              <div className="flex flex-col gap-1">
                                <span className="bg-rose-500/20 text-rose-400 border border-rose-500/40 px-3 py-1 rounded-full text-xs font-bold inline-flex items-center gap-1.5">
                                  <XCircle className="w-3.5 h-3.5 text-rose-400" />
                                  LOST
                                </span>
                                {bet.cashbackAwarded && bet.cashbackAwarded > 0 ? (
                                  <span className="text-[10px] bg-purple-950/60 text-purple-300 border border-purple-500/40 px-2 py-0.5 rounded-md font-bold flex items-center gap-1">
                                    🛡️ 50% Shield Refunded: +${bet.cashbackAwarded.toFixed(2)}
                                  </span>
                                ) : null}
                              </div>
                            )}
                          </td>

                          {/* Payout & Return */}
                          <td className="p-3 font-mono">
                            {bet.status === 'won' ? (
                              <div>
                                <div className="text-emerald-400 font-black text-sm">
                                  +${bet.payout.toFixed(2)}
                                </div>
                                <div className="text-[10px] text-emerald-300/80 font-bold">
                                  Profit: +${(bet.payout - bet.amount).toFixed(2)}
                                </div>
                              </div>
                            ) : bet.cashbackAwarded && bet.cashbackAwarded > 0 ? (
                              <div>
                                <div className="text-rose-400 font-bold text-xs line-through">
                                  -${bet.amount.toFixed(2)}
                                </div>
                                <div className="text-purple-300 font-black text-xs">
                                  +${bet.cashbackAwarded.toFixed(2)} Refund
                                </div>
                              </div>
                            ) : (
                              <div className="text-rose-400 font-bold text-xs">
                                -${bet.amount.toFixed(2)}
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Card Rules */}
      {activeTab === 'rules' && (
        <div className="bg-[#0b1320] border border-slate-800 rounded-2xl p-6 space-y-6 font-sans">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-2">
              <Shield className="w-5 h-5 text-rose-400" />
              Dragon vs Tiger Official Rules & Card Hierarchy
            </h3>
            <p className="text-xs text-slate-400">
              Dragon vs Tiger is a fast-paced 1-card casino game. Below is the official card ranking:
            </p>
          </div>

          <div className="bg-[#070d18] border border-slate-800 rounded-xl p-4 space-y-3 font-mono text-xs">
            <div className="text-amber-400 font-bold text-sm">CARD RANKINGS (HIGHEST TO LOWEST):</div>
            <div className="text-slate-300 flex flex-wrap gap-2">
              <span className="px-2 py-1 bg-slate-800 rounded border border-slate-700 font-bold text-amber-300">King (K) = 13</span>
              <span className="px-2 py-1 bg-slate-800 rounded border border-slate-700 font-bold text-amber-300">Queen (Q) = 12</span>
              <span className="px-2 py-1 bg-slate-800 rounded border border-slate-700 font-bold text-amber-300">Jack (J) = 11</span>
              <span className="px-2 py-1 bg-slate-800 rounded border border-slate-700">10, 9, 8, 7, 6, 5, 4, 3, 2</span>
              <span className="px-2 py-1 bg-slate-800 rounded border border-slate-700 font-bold text-slate-400">Ace (A) = 1</span>
            </div>
            <p className="text-slate-400 text-xs font-sans">
              - **Dragon Bet**: Wins 2.0x if Dragon card is higher than Tiger card.<br />
              - **Tiger Bet**: Wins 2.0x if Tiger card is higher than Dragon card.<br />
              - **Tie Bet**: Wins 8.0x if both cards have the exact same rank!
            </p>
          </div>
        </div>
      )}

      {/* FULL SCREEN MOVIE TITLE STYLE DRAGON VS TIGER RESULT POPUP MODAL */}
      <AnimatePresence>
        {resultModal && resultModal.isOpen && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-xl pointer-events-auto p-4 overflow-y-auto"
            onClick={() => setResultModal(null)}
          >
            <motion.div
              initial={{ scale: 0.3, opacity: 0, rotateX: 45 }}
              animate={{ scale: 1, opacity: 1, rotateX: 0 }}
              exit={{ scale: 0.3, opacity: 0, rotateX: -45 }}
              transition={{ type: 'spring', damping: 15, stiffness: 200 }}
              onClick={(e) => e.stopPropagation()}
              className={`
                relative w-full max-w-3xl p-8 md:p-12 rounded-[2.5rem] text-center border-4 shadow-[0_0_120px_rgba(0,0,0,0.95)] overflow-hidden space-y-8
                ${resultModal.winner === 'dragon' ? 'bg-gradient-to-b from-[#2a080c] via-[#1a0306] to-[#0d0103] border-rose-500/80 shadow-rose-600/40' : ''}
                ${resultModal.winner === 'tiger' ? 'bg-gradient-to-b from-[#2a1d08] via-[#1a1103] to-[#0d0801] border-amber-500/80 shadow-amber-600/40' : ''}
                ${resultModal.winner === 'tie' ? 'bg-gradient-to-b from-[#082a1a] via-[#031a0e] to-[#010d07] border-emerald-500/80 shadow-emerald-600/40' : ''}
              `}
            >
              {/* Close Button */}
              <button
                onClick={() => setResultModal(null)}
                className="absolute top-6 right-6 w-10 h-10 rounded-full bg-slate-800/80 text-slate-300 hover:text-white flex items-center justify-center text-base font-bold border border-slate-700 transition z-10"
              >
                ✕
              </button>

              {/* Movie Poster Ambient Glow & Spotlight */}
              <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full blur-[100px] pointer-events-none bg-amber-400/25" />

              {/* Movie Intro Top Eyebrow */}
              <div className="space-y-1">
                <span className="text-xs md:text-sm font-black tracking-[0.4em] uppercase text-amber-400/90 drop-shadow-[0_2px_10px_rgba(245,158,11,0.5)]">
                  🎬 OFFICIAL ROUND RESULT 🎬
                </span>
                <div className="h-0.5 w-32 mx-auto bg-gradient-to-r from-transparent via-amber-400 to-transparent" />
              </div>

              {/* MOVIE TITLE STYLE MAIN HEADER */}
              <div className="relative space-y-3">
                <div className="text-6xl md:text-8xl font-black tracking-tighter uppercase leading-none italic font-serif">
                  {resultModal.winner === 'dragon' && (
                    <span className="bg-gradient-to-b from-rose-200 via-rose-500 to-red-800 bg-clip-text text-transparent drop-shadow-[0_10px_20px_rgba(225,29,72,0.8)]">
                      DRAGON WINS
                    </span>
                  )}
                  {resultModal.winner === 'tiger' && (
                    <span className="bg-gradient-to-b from-amber-100 via-amber-400 to-yellow-700 bg-clip-text text-transparent drop-shadow-[0_10px_20px_rgba(245,158,11,0.8)]">
                      TIGER WINS
                    </span>
                  )}
                  {resultModal.winner === 'tie' && (
                    <span className="bg-gradient-to-b from-emerald-100 via-emerald-400 to-teal-800 bg-clip-text text-transparent drop-shadow-[0_10px_20px_rgba(16,185,129,0.8)]">
                      ROUND TIE
                    </span>
                  )}
                </div>
                <p className="text-xs md:text-sm font-mono uppercase tracking-[0.3em] text-slate-300 font-extrabold">
                  ROUND PERIOD #{resultModal.roundId}
                </p>
              </div>

              {/* BLOCKBUSTER WINNING BANNER */}
              {resultModal.winAmount > 0 ? (
                <div className="relative bg-gradient-to-r from-emerald-950/80 via-emerald-900/60 to-emerald-950/80 border-2 border-emerald-400/80 rounded-3xl p-6 md:p-8 shadow-[0_0_50px_rgba(16,185,129,0.3)] space-y-2">
                  <div className="text-sm md:text-base font-black tracking-[0.2em] text-amber-300 uppercase flex items-center justify-center gap-2">
                    <Trophy className="w-6 h-6 text-amber-400 animate-bounce" />
                    <span>🏆 BLOCKBUSTER WINNER! 🏆</span>
                  </div>
                  <div className="text-5xl md:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-yellow-300 to-emerald-300 drop-shadow-[0_5px_15px_rgba(245,158,11,0.7)]">
                    +${resultModal.winAmount.toFixed(2)} USDT
                  </div>
                  <p className="text-xs md:text-sm text-emerald-200 font-extrabold tracking-wide">
                    🎉 Credited instantly to your 🎮 Winning Wallet!
                  </p>
                </div>
              ) : (
                <div className="bg-slate-900/80 border-2 border-slate-700/80 rounded-3xl p-6 space-y-3">
                  <p className="text-xl md:text-2xl font-black text-rose-400 uppercase tracking-widest">
                    NO WIN THIS ROUND
                  </p>
                  <p className="text-xs md:text-sm text-slate-300 font-medium">
                    Play again in the next round for a chance to win big rewards!
                  </p>
                  {resultModal.cashbackAwarded && resultModal.cashbackAwarded > 0 ? (
                    <div className="bg-purple-950/60 border border-purple-500/50 rounded-2xl p-3.5 flex items-center justify-center gap-2.5 text-purple-300 text-xs md:text-sm font-bold">
                      <Shield className="w-5 h-5 text-purple-400 shrink-0" />
                      <span>🛡️ First 3 Bets 50% Loss Shield: +${resultModal.cashbackAwarded.toFixed(2)} USDT Refunded!</span>
                    </div>
                  ) : null}
                </div>
              )}

              {/* Game Matchup Details */}
              <div className="bg-[#050913]/90 border-2 border-amber-500/30 rounded-3xl p-6 space-y-3 text-left shadow-inner">
                <div className="flex justify-between items-center text-xs md:text-sm">
                  <span className="text-slate-400 font-bold uppercase tracking-wider">Your Bet Choice:</span>
                  <span className="text-amber-300 font-black uppercase text-sm">{resultModal.userChoice}</span>
                </div>
                <div className="flex justify-between items-center text-xs md:text-sm">
                  <span className="text-slate-400 font-bold uppercase tracking-wider">Stake Placed:</span>
                  <span className="text-white font-black">${resultModal.betAmount.toFixed(2)} USDT</span>
                </div>
              </div>

              {/* ACTION BUTTON */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setResultModal(null);
                }}
                className="w-full py-5 bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 hover:from-amber-400 hover:to-yellow-300 text-black font-black text-base md:text-xl uppercase tracking-[0.2em] rounded-2xl shadow-[0_0_30px_rgba(245,158,11,0.5)] transition-transform active:scale-95"
              >
                🎬 CONTINUE GAME 🎬
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
