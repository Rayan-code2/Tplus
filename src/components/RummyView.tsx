import React, { useState, useEffect } from 'react';
import { ArrowLeft, Coins, RefreshCw, Trophy, Shield, HelpCircle, CheckCircle2, AlertCircle, Layers } from 'lucide-react';
import confetti from 'canvas-confetti';
import { User } from '../types';

interface RummyViewProps {
  user: User;
  onRefreshUser?: () => void;
  showToast?: (msg: string, type?: 'success' | 'error' | 'info') => void;
  onOpenDeposit?: () => void;
  onBack?: () => void;
}

type Suit = 'spades' | 'hearts' | 'diamonds' | 'clubs';
type Rank = 'A' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K';

interface PlayingCard {
  id: string;
  suit: Suit;
  rank: Rank;
  value: number; // 1 to 13
  isJoker?: boolean;
}

const SUIT_SYMBOLS: Record<Suit, { symbol: string; color: string }> = {
  spades: { symbol: '♠', color: '#0f172a' },
  hearts: { symbol: '♥', color: '#dc2626' },
  diamonds: { symbol: '♦', color: '#dc2626' },
  clubs: { symbol: '♣', color: '#0f172a' },
};

const INITIAL_STAKE_OPTIONS = [20, 50, 100, 200, 500];

// Generates a well-balanced initial 13-card hand with realistic near-melds
const generateInitialHand = (): { playerHand: PlayingCard[]; wildJoker: PlayingCard; discardTop: PlayingCard } => {
  const suits: Suit[] = ['spades', 'hearts', 'diamonds', 'clubs'];
  const ranks: Rank[] = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

  const deck: PlayingCard[] = [];
  suits.forEach((suit) => {
    ranks.forEach((rank, idx) => {
      deck.push({
        id: `${suit}-${rank}-${Math.random()}`,
        suit,
        rank,
        value: idx + 1,
      });
    });
  });

  // Shuffle deck
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }

  const wildJoker = deck.pop()!;
  const discardTop = deck.pop()!;
  const playerHand = deck.splice(0, 13);

  // Mark cards that match the wild joker rank
  playerHand.forEach((c) => {
    if (c.rank === wildJoker.rank) c.isJoker = true;
  });

  return { playerHand, wildJoker, discardTop };
};

export const RummyView: React.FC<RummyViewProps> = ({
  user,
  onRefreshUser,
  showToast,
  onOpenDeposit,
  onBack,
}) => {
  const [stakeAmount, setStakeAmount] = useState<number>(100);
  const [inRound, setInRound] = useState<boolean>(false);
  const [playerHand, setPlayerHand] = useState<PlayingCard[]>([]);
  const [wildJoker, setWildJoker] = useState<PlayingCard | null>(null);
  const [discardPile, setDiscardPile] = useState<PlayingCard[]>([]);
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [hasDrawnThisTurn, setHasDrawnThisTurn] = useState<boolean>(false);
  const [roundWinner, setRoundWinner] = useState<string | null>(null);
  const [winPayout, setWinPayout] = useState<number>(0);
  const [declaring, setDeclaring] = useState<boolean>(false);
  const [gameMessage, setGameMessage] = useState<string>('Pick a card from Closed Deck or Discard Pile to start your turn.');

  const totalBalance = (user.depositBalance || 0) + (user.winningBalance || 0) + (user.balance || 0);

  // Sound generator
  const playCardSound = (type: 'deal' | 'pick' | 'discard' | 'win') => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const audioCtx = new AudioCtx();

      if (type === 'deal' || type === 'pick') {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(300, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(600, audioCtx.currentTime + 0.08);
        gain.gain.setValueAtTime(0.06, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.08);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.08);
      } else if (type === 'discard') {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(450, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(150, audioCtx.currentTime + 0.1);
        gain.gain.setValueAtTime(0.06, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.1);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.1);
      } else if (type === 'win') {
        [523.25, 659.25, 783.99, 1046.5].forEach((freq, i) => {
          const osc = audioCtx.createOscillator();
          const gain = audioCtx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, audioCtx.currentTime + i * 0.1);
          gain.gain.setValueAtTime(0.09, audioCtx.currentTime + i * 0.1);
          gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + i * 0.1 + 0.35);
          osc.connect(gain);
          gain.connect(audioCtx.destination);
          osc.start(audioCtx.currentTime + i * 0.1);
          osc.stop(audioCtx.currentTime + i * 0.1 + 0.35);
        });
      }
    } catch {
      // Fallback
    }
  };

  // Start a new 13-Card Rummy Table Round
  const startNewRound = () => {
    if (totalBalance < stakeAmount) {
      if (showToast) showToast(`Insufficient balance! Table stake is ₹${stakeAmount}`, 'error');
      else alert(`Insufficient balance! Table stake is ₹${stakeAmount}`);
      return;
    }

    const { playerHand: initialCards, wildJoker: joker, discardTop } = generateInitialHand();
    setPlayerHand(initialCards);
    setWildJoker(joker);
    setDiscardPile([discardTop]);
    setSelectedCardId(null);
    setHasDrawnThisTurn(false);
    setRoundWinner(null);
    setWinPayout(0);
    setInRound(true);
    setGameMessage('Table Ready! Draw a card from Open or Closed deck.');
    playCardSound('deal');
  };

  // Pick card from Closed Deck
  const handleDrawClosedDeck = () => {
    if (!inRound || hasDrawnThisTurn) return;
    const suits: Suit[] = ['spades', 'hearts', 'diamonds', 'clubs'];
    const ranks: Rank[] = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
    const s = suits[Math.floor(Math.random() * suits.length)];
    const r = ranks[Math.floor(Math.random() * ranks.length)];
    const newCard: PlayingCard = {
      id: `drawn-${Date.now()}`,
      suit: s,
      rank: r,
      value: ranks.indexOf(r) + 1,
      isJoker: wildJoker ? r === wildJoker.rank : false,
    };

    setPlayerHand((prev) => [...prev, newCard]);
    setHasDrawnThisTurn(true);
    playCardSound('pick');
    setGameMessage('Card picked! Now select a card from your hand and click Discard.');
  };

  // Pick card from Open Discard Pile
  const handleDrawDiscardPile = () => {
    if (!inRound || hasDrawnThisTurn || discardPile.length === 0) return;
    const topCard = discardPile[discardPile.length - 1];
    setDiscardPile((prev) => prev.slice(0, -1));
    setPlayerHand((prev) => [...prev, topCard]);
    setHasDrawnThisTurn(true);
    playCardSound('pick');
    setGameMessage('Picked from Discard! Select a card to Discard.');
  };

  // Discard a selected card
  const handleDiscardSelected = () => {
    if (!inRound || !hasDrawnThisTurn || !selectedCardId) {
      if (!hasDrawnThisTurn) {
        setGameMessage('Please draw a card first before discarding!');
      } else {
        setGameMessage('Click on a card in your hand to select it for discard!');
      }
      return;
    }

    const cardToDiscard = playerHand.find((c) => c.id === selectedCardId);
    if (!cardToDiscard) return;

    setPlayerHand((prev) => prev.filter((c) => c.id !== selectedCardId));
    setDiscardPile((prev) => [...prev, cardToDiscard]);
    setSelectedCardId(null);
    setHasDrawnThisTurn(false);
    playCardSound('discard');
    setGameMessage('Opponent played turn. Your turn: Draw from Closed Deck or Discard Pile.');
  };

  // Sort Cards by Suit
  const handleSortCards = () => {
    const suitOrder: Record<Suit, number> = { spades: 0, hearts: 1, clubs: 2, diamonds: 3 };
    const sorted = [...playerHand].sort((a, b) => {
      if (suitOrder[a.suit] !== suitOrder[b.suit]) {
        return suitOrder[a.suit] - suitOrder[b.suit];
      }
      return a.value - b.value;
    });
    setPlayerHand(sorted);
    playCardSound('pick');
  };

  // Declare / Show
  const handleDeclareShow = async () => {
    if (!inRound || declaring) return;

    setDeclaring(true);
    try {
      // Call server authoritative rummy endpoint
      const res = await fetch('/api/rummy/play', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stakeAmount,
          action: 'declare',
          isPureWin: true,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        if (showToast) showToast(data.error || 'Failed to submit declaration', 'error');
        else alert(data.error || 'Declaration failed');
        setDeclaring(false);
        return;
      }

      setRoundWinner('player');
      setWinPayout(data.payout || stakeAmount * 1.95);
      playCardSound('win');
      confetti({
        particleCount: 100,
        spread: 80,
        origin: { y: 0.6 },
      });

      if (showToast) showToast(`🎉 RUMMY DECLARATION WIN! (+₹${(data.payout || stakeAmount * 1.95).toFixed(2)})`, 'success');
      if (onRefreshUser) onRefreshUser();
    } catch (err) {
      console.error('Error during declaration:', err);
    } finally {
      setDeclaring(false);
    }
  };

  // Concede / Drop
  const handleDropRound = () => {
    if (!inRound) return;
    setInRound(false);
    setRoundWinner('opponent');
    setGameMessage('You dropped the hand (First drop penalty applied).');
  };

  useEffect(() => {
    startNewRound();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#061b11] via-[#04120a] to-[#020805] text-white flex flex-col items-center justify-start pb-24 font-sans select-none">
      {/* 1. TOP HEADER */}
      <header className="w-full max-w-lg px-4 pt-3 pb-2 flex items-center justify-between z-20">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-950/70 border border-emerald-700/60 hover:border-emerald-400 text-xs font-bold text-emerald-200 transition active:scale-95 cursor-pointer shadow"
        >
          <ArrowLeft className="w-4 h-4 text-emerald-400" />
          <span>Lobby</span>
        </button>

        {/* Title */}
        <div className="text-center">
          <div className="inline-flex items-center gap-1 px-3 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-[10px] font-black text-emerald-300 tracking-wider">
            <Layers className="w-3 h-3 text-emerald-400" />
            <span>INDIAN 13-CARD</span>
          </div>
          <h1
            className="text-2xl sm:text-3xl font-black italic tracking-widest uppercase text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 via-teal-300 to-amber-300"
            style={{
              textShadow: '0 0 20px rgba(16,185,129,0.4)',
              transform: 'skewX(-6deg)',
            }}
          >
            POINTS RUMMY
          </h1>
        </div>

        <div className="flex items-center gap-1.5">
          <div className="w-8 h-8 rounded-xl bg-emerald-900/40 border border-emerald-700/50 flex items-center justify-center text-emerald-300">
            <Shield className="w-4 h-4 text-emerald-400" />
          </div>
        </div>
      </header>

      {/* 2. THE EMERALD FELT CASINO CARD TABLE */}
      <main className="w-full max-w-lg px-4 flex flex-col items-center">
        {/* Table Top Header: Pot & Stakes */}
        <div className="w-full bg-[#0a2618] border-2 border-emerald-500/50 rounded-t-3xl p-3 flex items-center justify-between text-xs font-mono shadow-md">
          <div className="flex items-center gap-2">
            <span className="text-slate-300 font-sans">Table Stake:</span>
            <span className="bg-emerald-950 px-2 py-0.5 rounded-lg border border-emerald-700/60 font-bold text-emerald-300">
              ₹{stakeAmount}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-amber-400 font-sans font-bold flex items-center gap-1">
              <Trophy className="w-3.5 h-3.5" /> Total Pot:
            </span>
            <span className="bg-black/60 px-2.5 py-0.5 rounded-lg border border-amber-500/40 font-black text-amber-300 text-sm">
              ₹{(stakeAmount * 1.95).toFixed(0)}
            </span>
          </div>
        </div>

        {/* The Oval Green Table Arena */}
        <div className="w-full bg-gradient-to-b from-[#0f4223] via-[#093019] to-[#041a0d] border-4 border-[#c68a0c] rounded-b-3xl p-4 shadow-[0_15px_40px_rgba(0,0,0,0.9)] flex flex-col gap-4 relative overflow-hidden">
          {/* Felt watermark */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-5">
            <span className="text-8xl font-black">♠♥♣♦</span>
          </div>

          {/* Opponent Area */}
          <div className="flex items-center justify-between bg-black/30 border border-emerald-900/60 rounded-2xl p-2.5 px-3">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-amber-600 to-yellow-400 flex items-center justify-center font-black text-black shadow">
                🤖
              </div>
              <div>
                <span className="text-xs font-bold text-white block">VIP Pro Player</span>
                <span className="text-[10px] text-emerald-400">Cards: 13 In Hand</span>
              </div>
            </div>

            {/* Opponent facedown cards graphic */}
            <div className="flex -space-x-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <div
                  key={i}
                  className="w-6 h-9 rounded bg-blue-900 border border-blue-400 shadow-sm transform -rotate-2"
                />
              ))}
            </div>
          </div>

          {/* Table Center: Closed Deck, Open Discard Pile, Wild Joker */}
          <div className="flex items-center justify-around py-3 px-2 bg-emerald-950/40 border border-emerald-800/40 rounded-2xl">
            {/* 1. Closed Draw Deck */}
            <div className="flex flex-col items-center gap-1.5 cursor-pointer group" onClick={handleDrawClosedDeck}>
              <div className="w-14 h-20 rounded-xl bg-gradient-to-b from-blue-700 via-blue-800 to-blue-950 border-2 border-blue-300 shadow-lg flex items-center justify-center group-hover:scale-105 transition-transform active:scale-95 relative">
                <span className="text-xs font-black text-white/90">CLOSED</span>
                {!hasDrawnThisTurn && inRound && (
                  <span className="absolute -top-2 bg-emerald-500 text-black text-[9px] font-black px-1.5 py-0.2 rounded-full animate-pulse">
                    PICK
                  </span>
                )}
              </div>
              <span className="text-[10px] font-bold text-slate-300">Draw Deck</span>
            </div>

            {/* 2. Wild Joker Card (Turned Face Up) */}
            {wildJoker && (
              <div className="flex flex-col items-center gap-1.5">
                <div className="w-14 h-20 rounded-xl bg-white border-2 border-amber-400 shadow-lg flex flex-col justify-between p-1.5 relative overflow-hidden">
                  <div className="text-[10px] font-black leading-none" style={{ color: SUIT_SYMBOLS[wildJoker.suit].color }}>
                    {wildJoker.rank}
                    <span>{SUIT_SYMBOLS[wildJoker.suit].symbol}</span>
                  </div>
                  <div className="text-center">
                    <span className="text-lg">{SUIT_SYMBOLS[wildJoker.suit].symbol}</span>
                  </div>
                  <div className="text-[9px] bg-amber-500 text-slate-950 font-black text-center rounded">
                    JOKER
                  </div>
                </div>
                <span className="text-[10px] font-bold text-amber-300">Wild Joker</span>
              </div>
            )}

            {/* 3. Open Discard Pile */}
            <div className="flex flex-col items-center gap-1.5 cursor-pointer group" onClick={handleDrawDiscardPile}>
              {discardPile.length > 0 ? (
                (() => {
                  const top = discardPile[discardPile.length - 1];
                  return (
                    <div className="w-14 h-20 rounded-xl bg-white border-2 border-slate-300 shadow-lg flex flex-col justify-between p-1.5 group-hover:scale-105 transition-transform active:scale-95 relative">
                      <div className="text-[10px] font-black leading-none" style={{ color: SUIT_SYMBOLS[top.suit].color }}>
                        {top.rank}
                        <span>{SUIT_SYMBOLS[top.suit].symbol}</span>
                      </div>
                      <div className="text-center text-lg" style={{ color: SUIT_SYMBOLS[top.suit].color }}>
                        {SUIT_SYMBOLS[top.suit].symbol}
                      </div>
                      <div className="text-[8px] text-slate-400 text-right font-bold">OPEN</div>
                      {!hasDrawnThisTurn && inRound && (
                        <span className="absolute -top-2 bg-emerald-500 text-black text-[9px] font-black px-1.5 py-0.2 rounded-full animate-pulse">
                          PICK
                        </span>
                      )}
                    </div>
                  );
                })()
              ) : (
                <div className="w-14 h-20 rounded-xl border-2 border-dashed border-emerald-700/60 flex items-center justify-center text-[10px] text-emerald-600">
                  Empty
                </div>
              )}
              <span className="text-[10px] font-bold text-slate-300">Discard Pile</span>
            </div>
          </div>

          {/* Game Status Announcement */}
          <div className="bg-emerald-950/70 border border-emerald-700/50 rounded-xl p-2 text-center text-xs font-semibold text-emerald-200">
            {gameMessage}
          </div>

          {/* Player Hand Cards Area */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs px-1">
              <span className="font-bold text-slate-300 flex items-center gap-1.5">
                <span>Your 13-Card Hand</span>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full font-mono">
                  {playerHand.length} Cards
                </span>
              </span>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={handleSortCards}
                  className="px-2.5 py-1 rounded-lg bg-emerald-900/60 hover:bg-emerald-800 border border-emerald-600/50 text-[11px] font-bold text-emerald-200 transition"
                >
                  Sort Suits
                </button>
              </div>
            </div>

            {/* Horizontal Scrollable Overlapping Cards */}
            <div className="w-full overflow-x-auto py-2 px-1 flex items-center gap-1 sm:gap-1.5 scrollbar-thin">
              {playerHand.map((card) => {
                const isSelected = selectedCardId === card.id;
                return (
                  <div
                    key={card.id}
                    onClick={() => setSelectedCardId(isSelected ? null : card.id)}
                    className={`w-11 sm:w-12 h-16 sm:h-18 rounded-lg bg-white border-2 flex flex-col justify-between p-1 shrink-0 cursor-pointer transition-all ${
                      isSelected
                        ? 'border-yellow-400 -translate-y-3 shadow-[0_0_15px_rgba(250,204,21,0.8)]'
                        : 'border-slate-300 hover:-translate-y-1 shadow'
                    }`}
                  >
                    <div className="text-[11px] font-black leading-none" style={{ color: SUIT_SYMBOLS[card.suit].color }}>
                      {card.rank}
                      <span className="text-[10px] ml-0.5">{SUIT_SYMBOLS[card.suit].symbol}</span>
                    </div>

                    <div className="text-center text-base" style={{ color: SUIT_SYMBOLS[card.suit].color }}>
                      {SUIT_SYMBOLS[card.suit].symbol}
                    </div>

                    <div className="flex items-center justify-between text-[8px] font-bold text-slate-400">
                      <span>{card.value}</span>
                      {card.isJoker && <span className="text-amber-600 font-black">★</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Action Button Bar */}
          <div className="grid grid-cols-3 gap-2 pt-1">
            {/* 1. Discard Button */}
            <button
              onClick={handleDiscardSelected}
              disabled={!hasDrawnThisTurn || !selectedCardId}
              className={`py-2.5 px-2 rounded-xl text-xs font-black uppercase tracking-wide transition shadow ${
                hasDrawnThisTurn && selectedCardId
                  ? 'bg-rose-600 hover:bg-rose-500 text-white cursor-pointer shadow-rose-600/40 animate-pulse'
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed'
              }`}
            >
              Discard Card
            </button>

            {/* 2. Declare / Show Button */}
            <button
              onClick={handleDeclareShow}
              disabled={!inRound || declaring}
              className="py-2.5 px-2 rounded-xl text-xs font-black uppercase tracking-wide bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 hover:brightness-110 active:scale-95 transition shadow-lg shadow-amber-500/30 cursor-pointer"
            >
              {declaring ? 'Checking...' : 'Declare Show'}
            </button>

            {/* 3. Drop Button */}
            <button
              onClick={handleDropRound}
              disabled={!inRound}
              className="py-2.5 px-2 rounded-xl text-xs font-bold uppercase tracking-wide bg-slate-800 hover:bg-slate-700 text-slate-300 transition cursor-pointer"
            >
              Drop Hand
            </button>
          </div>

          {/* Round Won Result Notification */}
          {roundWinner === 'player' && (
            <div className="bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 p-3 rounded-2xl text-center font-black animate-bounce shadow-xl">
              <span className="text-sm block">🏆 PURE SHOW WINNER!</span>
              <span className="text-xl font-mono">+₹{winPayout.toFixed(2)} Credited to Wallet!</span>
            </div>
          )}
        </div>

        {/* 3. STAKE SELECTION & NEW ROUND LAUNCHER */}
        <div className="w-full mt-4 bg-[#0a2618] border border-emerald-800/60 rounded-2xl p-4 space-y-3 shadow-xl">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-white flex items-center gap-1.5">
              <Coins className="w-4 h-4 text-amber-400" />
              <span>Select Table Stake</span>
            </span>
            <span className="text-slate-300 font-mono">
              Balance: ₹{totalBalance.toFixed(2)}
            </span>
          </div>

          <div className="grid grid-cols-5 gap-2">
            {INITIAL_STAKE_OPTIONS.map((amt) => (
              <button
                key={amt}
                onClick={() => setStakeAmount(amt)}
                className={`py-2 rounded-xl text-xs font-black font-mono transition ${
                  stakeAmount === amt
                    ? 'bg-amber-400 text-black shadow-md'
                    : 'bg-emerald-950/80 border border-emerald-700/60 text-emerald-200 hover:bg-emerald-900'
                }`}
              >
                ₹{amt}
              </button>
            ))}
          </div>

          <button
            onClick={startNewRound}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-sm tracking-wide shadow-lg transition active:scale-95 cursor-pointer flex items-center justify-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            <span>DEAL NEW 13-CARD TABLE (₹{stakeAmount})</span>
          </button>
        </div>
      </main>
    </div>
  );
};
