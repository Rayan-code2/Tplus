import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  ArrowLeft, Menu, Volume2, VolumeX, Shield, HelpCircle, 
  Minus, Plus, ChevronDown, Check, X, Award, Flame, RefreshCw, 
  Sparkles, History, UserCheck, AlertCircle, Info, ExternalLink
} from 'lucide-react';
import { User, AviatorState, AviatorBet } from '../types';

interface AviatorViewProps {
  user: User;
  onRefreshUser: () => void;
  showToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
  onOpenDeposit?: () => void;
  onOpenWithdraw?: () => void;
  onBack?: () => void;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  alpha: number;
  color: string;
  life: number;
  maxLife: number;
}

interface SimulatedLiveBet {
  id: string;
  username: string;
  avatar: string;
  betAmount: number;
  cashedOut: boolean;
  cashoutMultiplier: number | null;
  payout: number;
  targetMultiplier: number;
}

export interface MyBetHistoryItem {
  id: string;
  time: string;
  betAmount: number;
  cashedOut: boolean;
  multiplier: number | null;
  payout: number;
}

// Generate crisp colorful SVG avatars for simulated live players matching video
const getAvatarUrl = (seed: number) => {
  const bgColors = ['#1e3a8a', '#581c87', '#831843', '#064e3b', '#78350f', '#164e63', '#7f1d1d', '#312e81', '#14532d', '#701a75', '#1e293b', '#374151'];
  const glyphs = ['🐯', '🐺', '🦁', '🚀', '⚡', '👑', '🔥', '💎', '🎯', '🦅', '⭐', '🎲', '👾', '🦊', '🐼', '🐉', '🏆', '🎩', '🤺', '🥇'];
  const bg = bgColors[seed % bgColors.length];
  const glyph = glyphs[seed % glyphs.length];
  return `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 36 36"><circle cx="18" cy="18" r="18" fill="${encodeURIComponent(bg)}"/><text x="50%" y="54%" font-size="16" text-anchor="middle" dominant-baseline="central">${glyph}</text></svg>`;
};

// Exact simulated bet templates matching the reference video frames 00:01-00:15
const BET_TEMPLATES = [
  { username: 'h***2', stake: 8000, target: 8.50, avatarSeed: 0 },
  { username: 'a***4', stake: 8000, target: 12.00, avatarSeed: 1 },
  { username: 'p***2', stake: 8000, target: 15.00, avatarSeed: 2 },
  { username: 'y***1', stake: 7500, target: 7.38, avatarSeed: 3 },
  { username: 'x***5', stake: 7100, target: 9.20, avatarSeed: 4 },
  { username: 'x***3', stake: 6900, target: 4.46, avatarSeed: 5 },
  { username: 'i***8', stake: 6300, target: 2.79, avatarSeed: 6 },
  { username: 'g***8', stake: 5900, target: 1.54, avatarSeed: 7 },
  { username: 'w***0', stake: 5700, target: 1.18, avatarSeed: 8 },
  { username: 'a***6', stake: 5700, target: 5.94, avatarSeed: 9 },
  { username: 'j***8', stake: 4500, target: 1.23, avatarSeed: 10 },
  { username: 'g***7', stake: 4200, target: 1.82, avatarSeed: 11 },
  { username: 'a***9', stake: 3400, target: 6.47, avatarSeed: 12 },
  { username: 'j***6', stake: 3000, target: 1.17, avatarSeed: 13 },
  { username: 'w***1', stake: 2500, target: 1.77, avatarSeed: 14 },
  { username: 'a***8', stake: 2500, target: 3.12, avatarSeed: 15 },
  { username: 'x***1', stake: 1900, target: 4.05, avatarSeed: 16 },
  { username: 'x***5', stake: 850, target: 4.02, avatarSeed: 17 },
  { username: 'z***9', stake: 790, target: 1.40, avatarSeed: 18 },
  { username: 'y***1', stake: 740, target: 7.38, avatarSeed: 19 },
  { username: 'z***4', stake: 700, target: 1.19, avatarSeed: 20 },
  { username: 'w***1', stake: 630, target: 1.71, avatarSeed: 21 },
  { username: 'd***7', stake: 630, target: 2.10, avatarSeed: 22 },
  { username: 'f***5', stake: 620, target: 5.79, avatarSeed: 23 },
  { username: 'n***6', stake: 610, target: 5.49, avatarSeed: 24 },
  { username: 'b***5', stake: 610, target: 4.51, avatarSeed: 25 },
  { username: 'b***5', stake: 580, target: 3.80, avatarSeed: 26 },
  { username: 'z***9', stake: 560, target: 1.68, avatarSeed: 27 },
  { username: 'i***0', stake: 540, target: 1.44, avatarSeed: 28 },
  { username: 'l***0', stake: 500, target: 3.91, avatarSeed: 29 },
  { username: 'n***0', stake: 500, target: 2.25, avatarSeed: 30 },
  { username: 't***0', stake: 440, target: 2.07, avatarSeed: 31 },
  { username: 'm***0', stake: 400, target: 4.46, avatarSeed: 32 },
  { username: 'b***1', stake: 380, target: 3.59, avatarSeed: 33 },
  { username: 'c***4', stake: 350, target: 1.34, avatarSeed: 34 },
  { username: 'k***8', stake: 300, target: 1.25, avatarSeed: 35 },
  { username: 's***2', stake: 250, target: 2.45, avatarSeed: 36 },
  { username: 'u***9', stake: 200, target: 1.62, avatarSeed: 37 },
  { username: 'r***5', stake: 150, target: 1.15, avatarSeed: 38 },
  { username: 'v***3', stake: 100, target: 3.30, avatarSeed: 39 },
];

// Top tab data matching reference video frames 00:19-00:26
const TOP_WINS_DATA = [
  { id: 'top-1', user: 'z***8', date: '26-11-08', betInr: 110.00, winInr: 799999.20, resultMult: 7272.72, roundMax: 8769.46, avatarSeed: 3 },
  { id: 'top-2', user: 'a***7', date: '26-11-08', betInr: 150.00, winInr: 799999.50, resultMult: 5333.33, roundMax: 8769.46, avatarSeed: 7 },
  { id: 'top-3', user: 'y***2', date: '26-11-08', betInr: 52.00, winInr: 149183.84, resultMult: 2868.92, roundMax: 8769.46, avatarSeed: 12 },
  { id: 'top-4', user: 'n***3', date: '26-11-08', betInr: 290.00, winInr: 799999.80, resultMult: 2758.62, roundMax: 8769.46, avatarSeed: 18 },
  { id: 'top-5', user: 'd***9', date: '26-11-08', betInr: 95.00, winInr: 685420.00, resultMult: 7214.94, roundMax: 8769.46, avatarSeed: 22 },
  { id: 'top-6', user: 'p***4', date: '26-11-08', betInr: 180.00, winInr: 624500.00, resultMult: 3469.44, roundMax: 8769.46, avatarSeed: 15 },
  { id: 'top-7', user: 'k***1', date: '26-11-08', betInr: 200.00, winInr: 580000.00, resultMult: 2900.00, roundMax: 8769.46, avatarSeed: 9 },
  { id: 'top-8', user: 'e***9', date: '26-11-08', betInr: 350.00, winInr: 525000.00, resultMult: 1500.00, roundMax: 8769.46, avatarSeed: 14 },
];

export const AviatorView: React.FC<AviatorViewProps> = ({
  user,
  onRefreshUser,
  showToast,
  onOpenDeposit,
  onOpenWithdraw,
  onBack,
}) => {
  // Game Mode: default 'real' (live Main Wallet balance) vs 'fun' (optional demo mode)
  const [gameMode, setGameMode] = useState<'fun' | 'real'>('real');
  const [funBalance, setFunBalance] = useState<number>(10000.0);

  // Sound FX
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const engineOscRef = useRef<OscillatorNode | null>(null);
  const engineGainRef = useRef<GainNode | null>(null);

  // Modals & Drawers
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState<boolean>(false);
  const [isFairnessModalOpen, setIsFairnessModalOpen] = useState<boolean>(false);
  const [isRulesModalOpen, setIsRulesModalOpen] = useState<boolean>(false);

  // Active Bottom Ledger Tab: 'all' | 'my' | 'top' matching reference video
  const [ledgerTab, setLedgerTab] = useState<'all' | 'my' | 'top'>('all');
  const [topFilterCategory, setTopFilterCategory] = useState<'x' | 'win' | 'rounds'>('win');
  const [topFilterTime, setTopFilterTime] = useState<'day' | 'month' | 'year'>('day');
  const [totalBetsCount, setTotalBetsCount] = useState<number>(1572);

  // My Bets History for 'My Bets' tab
  const [myBetHistory, setMyBetHistory] = useState<MyBetHistoryItem[]>(() => {
    try {
      const saved = localStorage.getItem('aviator_my_bets');
      if (saved) return JSON.parse(saved);
    } catch {}
    return [
      { id: 'h-1', time: '11:00', betAmount: 10, cashedOut: true, multiplier: 1.85, payout: 18.50 },
      { id: 'h-2', time: '10:58', betAmount: 100, cashedOut: true, multiplier: 2.14, payout: 214.00 },
      { id: 'h-3', time: '10:56', betAmount: 50, cashedOut: false, multiplier: null, payout: 0 },
    ];
  });

  const recordMyBet = useCallback((betAmount: number, cashedOut: boolean, multiplier: number | null, payout: number) => {
    const item: MyBetHistoryItem = {
      id: `my-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
      betAmount,
      cashedOut,
      multiplier,
      payout,
    };
    setMyBetHistory((prev) => {
      const next = [item, ...prev].slice(0, 50);
      try {
        localStorage.setItem('aviator_my_bets', JSON.stringify(next));
      } catch {}
      return next;
    });
  }, []);

  // Backend Game State
  const [gameState, setGameState] = useState<AviatorState | null>(null);
  const [displayMultiplier, setDisplayMultiplier] = useState<number>(1.0);
  const [activePlayersCount, setActivePlayersCount] = useState<number>(205);

  // --- PANEL 1 STATE ---
  const [panel1Mode, setPanel1Mode] = useState<'bet' | 'auto'>('bet');
  const [bet1Amount, setBet1Amount] = useState<number>(10);
  const [autoCashout1, setAutoCashout1] = useState<string>('2.00');
  const [isAutoBet1, setIsAutoBet1] = useState<boolean>(false);
  const [isAutoCashout1Enabled, setIsAutoCashout1Enabled] = useState<boolean>(false);
  const [myBet1, setMyBet1] = useState<AviatorBet | null>(null);
  const [loading1, setLoading1] = useState<boolean>(false);

  // --- PANEL 2 STATE ---
  const [showPanel2, setShowPanel2] = useState<boolean>(true);
  const [panel2Mode, setPanel2Mode] = useState<'bet' | 'auto'>('bet');
  const [bet2Amount, setBet2Amount] = useState<number>(10);
  const [autoCashout2, setAutoCashout2] = useState<string>('2.00');
  const [isAutoBet2, setIsAutoBet2] = useState<boolean>(false);
  const [isAutoCashout2Enabled, setIsAutoCashout2Enabled] = useState<boolean>(false);
  const [myBet2, setMyBet2] = useState<AviatorBet | null>(null);
  const [loading2, setLoading2] = useState<boolean>(false);

  // Simulated live bet table rows
  const [liveBetsList, setLiveBetsList] = useState<SimulatedLiveBet[]>([]);
  const liveBetsRef = useRef<SimulatedLiveBet[]>([]);
  const lastBetsUpdateRef = useRef<number>(0);
  const lastRoundIdRef = useRef<string>('');
  const [totalWinUsd, setTotalWinUsd] = useState<number>(2365.98);

  // Last Cashout confirmation state
  const [lastCashoutResult, setLastCashoutResult] = useState<{ multiplier: number; payout: number; inr: string } | null>(null);

  // Animation References
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameIdRef = useRef<number | null>(null);
  const gameStateRef = useRef<AviatorState | null>(null);
  const myBet1Ref = useRef<AviatorBet | null>(null);
  const myBet2Ref = useRef<AviatorBet | null>(null);
  const smoothMultiplierRef = useRef<number>(1.0);
  const timeOffsetRef = useRef<number>(0);
  const particlesRef = useRef<Particle[]>([]);
  const planeAngleRef = useRef<number>(0.2);
  const planePosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Web Audio Helpers
  const initAudio = () => {
    if (!audioCtxRef.current && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        audioCtxRef.current = new AudioCtx();
      }
    }
    if (audioCtxRef.current && audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume();
    }
  };

  const playEngineSound = (mult: number) => {
    if (!soundEnabled) return;
    initAudio();
    const ctx = audioCtxRef.current;
    if (!ctx) return;

    try {
      if (!engineOscRef.current) {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(80, ctx.currentTime);
        gain.gain.setValueAtTime(0.04, ctx.currentTime);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        engineOscRef.current = osc;
        engineGainRef.current = gain;
      } else {
        const pitch = Math.min(320, 80 + Math.pow(mult, 1.4) * 20);
        engineOscRef.current.frequency.setTargetAtTime(pitch, ctx.currentTime, 0.1);
      }
    } catch {
      // Audio autoplay constraints
    }
  };

  const stopEngineSound = () => {
    if (engineOscRef.current && audioCtxRef.current) {
      try {
        engineOscRef.current.stop();
        engineOscRef.current.disconnect();
      } catch {}
      engineOscRef.current = null;
      engineGainRef.current = null;
    }
  };

  const playWinChime = () => {
    if (!soundEnabled) return;
    initAudio();
    const ctx = audioCtxRef.current;
    if (!ctx) return;
    try {
      const notes = [523.25, 659.25, 783.99, 1046.5]; // C E G C
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.08);
        gain.gain.setValueAtTime(0.12, ctx.currentTime + idx * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.08 + 0.35);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + idx * 0.08);
        osc.stop(ctx.currentTime + idx * 0.08 + 0.4);
      });
    } catch {}
  };

  const playCrashSound = () => {
    stopEngineSound();
    if (!soundEnabled) return;
    initAudio();
    const ctx = audioCtxRef.current;
    if (!ctx) return;
    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(140, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(30, ctx.currentTime + 0.4);
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.45);
    } catch {}
  };

  // Sync refs
  useEffect(() => {
    gameStateRef.current = gameState;
  }, [gameState]);

  useEffect(() => {
    myBet1Ref.current = myBet1;
  }, [myBet1]);

  useEffect(() => {
    myBet2Ref.current = myBet2;
  }, [myBet2]);

  // Current balance display based on Fun Mode vs Real Mode
  const currentBalance = gameMode === 'fun' 
    ? funBalance 
    : ((user?.balance || 0) + (user?.winningBalance || 0) + (user?.depositBalance || 0));

  // Generate simulated live players for realism matching the video
  const generateSimulatedBets = useCallback(() => {
    const generated: SimulatedLiveBet[] = BET_TEMPLATES.map((tmpl, idx) => {
      // Add slight organic variance to cashout multiplier each round
      const variance = (Math.random() - 0.48) * 0.4;
      const target = Math.max(1.12, Number((tmpl.target + variance).toFixed(2)));
      return {
        id: `sim-${idx}-${Date.now()}`,
        username: tmpl.username,
        avatar: getAvatarUrl(tmpl.avatarSeed ?? idx),
        betAmount: tmpl.stake,
        cashedOut: false,
        cashoutMultiplier: null,
        payout: 0,
        targetMultiplier: target,
      };
    });

    // Sort descending by betAmount so high rollers appear at top as in video
    generated.sort((a, b) => b.betAmount - a.betAmount);
    liveBetsRef.current = generated;
    setLiveBetsList(generated);
    setTotalBetsCount(1530 + Math.floor(Math.random() * 95));
  }, []);

  // Fetch Game State loop
  const fetchAviatorState = useCallback(async () => {
    try {
      const storedId = user?.id || localStorage.getItem('tp_user_id') || '';
      const res = await fetch('/api/aviator', {
        headers: {
          'x-user-id': storedId,
        },
      });
      if (res.ok) {
        const data = await res.json();
        if (data.serverTime) {
          timeOffsetRef.current = data.serverTime - Date.now();
        }
        const serverState: AviatorState = data.state;
        gameStateRef.current = serverState;
        setGameState(serverState);

        // Fluctuate active player count slightly
        setActivePlayersCount((prev) => {
          const delta = (Math.random() - 0.48) * 4;
          return Math.max(180, Math.min(420, Math.round(prev + delta)));
        });

        // Sync My Bets for Panel 1 and Panel 2
        const myBets: AviatorBet[] = data.myBets || (data.myBet ? [data.myBet] : []);
        const b1 = myBets.find((b) => (b as any).slot === 1 || !('slot' in b));
        const b2 = myBets.find((b) => (b as any).slot === 2);

        if (b1) {
          setMyBet1(b1);
          myBet1Ref.current = b1;
        } else if (serverState.status === 'crashed' && myBet1Ref.current && !myBet1Ref.current.cashedOut) {
          setMyBet1({ ...myBet1Ref.current, status: 'crashed' });
        } else if (serverState.status === 'waiting') {
          // If we had a bet from previous round that completed or crashed, reset for new round
          if (myBet1Ref.current && myBet1Ref.current.roundId !== serverState.currentRoundId) {
            setMyBet1(null);
            myBet1Ref.current = null;
            // Auto Bet trigger if enabled
            if (isAutoBet1) {
              setTimeout(() => handlePlaceBet(1), 300);
            }
          }
        }

        if (b2) {
          setMyBet2(b2);
          myBet2Ref.current = b2;
        } else if (serverState.status === 'crashed' && myBet2Ref.current && !myBet2Ref.current.cashedOut) {
          setMyBet2({ ...myBet2Ref.current, status: 'crashed' });
        } else if (serverState.status === 'waiting') {
          if (myBet2Ref.current && myBet2Ref.current.roundId !== serverState.currentRoundId) {
            setMyBet2(null);
            myBet2Ref.current = null;
            if (isAutoBet2) {
              setTimeout(() => handlePlaceBet(2), 500);
            }
          }
        }
      }
    } catch (err) {
      console.error('Error fetching aviator state:', err);
    }
  }, [user?.id, isAutoBet1, isAutoBet2]);

  useEffect(() => {
    fetchAviatorState();
    generateSimulatedBets();
    const interval = setInterval(fetchAviatorState, 650);
    return () => clearInterval(interval);
  }, [fetchAviatorState, generateSimulatedBets]);

  // When round changes from waiting to flying, reset simulated bets
  useEffect(() => {
    if (gameState?.status === 'waiting') {
      generateSimulatedBets();
    }
  }, [gameState?.currentRoundId, generateSimulatedBets, gameState?.status]);

  // Handle Bet Place (Optimistic & Server Synced)
  const handlePlaceBet = async (slot: 1 | 2) => {
    const amount = slot === 1 ? bet1Amount : bet2Amount;
    if (amount <= 0) {
      showToast('Please enter a valid bet amount', 'error');
      return;
    }

    if (currentBalance < amount) {
      showToast(`Insufficient balance (₹${currentBalance.toFixed(2)} INR available).`, 'error');
      return;
    }

    const currentBet = slot === 1 ? myBet1Ref.current : myBet2Ref.current;
    if (currentBet && !currentBet.cashedOut && currentBet.status === 'pending') {
      return; // Already placed bet for this slot
    }

    const state = gameStateRef.current || gameState;
    const currentM = smoothMultiplierRef.current || 1.0;
    if (state?.status === 'flying' && currentM > 1.15) {
      showToast('Flight supersonic! Betting is locked for this flight.', 'error');
      return;
    }

    const roundId = state?.currentRoundId || `AV-${Date.now()}`;
    const autoCashoutVal = slot === 1 
      ? (isAutoCashout1Enabled ? parseFloat(autoCashout1) : null) 
      : (isAutoCashout2Enabled ? parseFloat(autoCashout2) : null);

    const optimisticBet: AviatorBet = {
      id: `opt-${slot}-${Date.now()}`,
      userId: user?.id || 'demo-usr',
      userName: user?.name || 'You',
      userNodeId: user?.nodeId || 'YOU',
      roundId,
      amount,
      cashedOut: false,
      cashoutMultiplier: null,
      payout: 0,
      status: 'pending',
      createdAt: new Date().toISOString(),
      slot,
      autoCashout: autoCashoutVal || undefined,
    };

    if (slot === 1) {
      myBet1Ref.current = optimisticBet;
      setMyBet1(optimisticBet);
      setLoading1(true);
    } else {
      myBet2Ref.current = optimisticBet;
      setMyBet2(optimisticBet);
      setLoading2(true);
    }

    if (gameMode === 'fun') {
      setFunBalance((prev) => Math.max(0, prev - amount));
      showToast(`Fun Bet ₹${amount.toFixed(2)} INR placed on Panel ${slot}!`, 'success');
      if (slot === 1) setLoading1(false);
      else setLoading2(false);
      return;
    }

    try {
      const storedId = user?.id || user?.nodeId || localStorage.getItem('tp_user_id') || '';
      const res = await fetch('/api/aviator/bet', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': storedId,
        },
        body: JSON.stringify({
          amount,
          slot,
          autoCashout: autoCashoutVal,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success && data.bet) {
        if (slot === 1) {
          if (!myBet1Ref.current?.cashedOut) {
            myBet1Ref.current = data.bet;
            setMyBet1(data.bet);
          }
        } else {
          if (!myBet2Ref.current?.cashedOut) {
            myBet2Ref.current = data.bet;
            setMyBet2(data.bet);
          }
        }
        showToast(data.message || `Bet placed on Panel ${slot}!`, 'success');
        onRefreshUser();
      } else {
        if (slot === 1) {
          myBet1Ref.current = null;
          setMyBet1(null);
        } else {
          myBet2Ref.current = null;
          setMyBet2(null);
        }
        showToast(data.error || 'Failed to place bet', 'error');
      }
    } catch {
      if (slot === 1) {
        myBet1Ref.current = null;
        setMyBet1(null);
      } else {
        myBet2Ref.current = null;
        setMyBet2(null);
      }
      showToast('Network error placing bet', 'error');
    } finally {
      if (slot === 1) setLoading1(false);
      else setLoading2(false);
    }
  };

  // Handle Cashout (Instant Response)
  const handleCashout = async (slot: 1 | 2) => {
    const bet = slot === 1 ? (myBet1Ref.current || myBet1) : (myBet2Ref.current || myBet2);
    if (!bet || bet.cashedOut) return;

    const currentM = smoothMultiplierRef.current || displayMultiplier || 1.0;
    const estPayout = Number((bet.amount * currentM).toFixed(2));

    const cashedBet: AviatorBet = {
      ...bet,
      cashedOut: true,
      cashoutMultiplier: currentM,
      payout: estPayout,
      status: 'cashed_out',
    };

    if (slot === 1) {
      myBet1Ref.current = cashedBet;
      setMyBet1(cashedBet);
      setLoading1(true);
    } else {
      myBet2Ref.current = cashedBet;
      setMyBet2(cashedBet);
      setLoading2(true);
    }

    playWinChime();
    const inrVal = estPayout.toFixed(2);
    setLastCashoutResult({ multiplier: currentM, payout: estPayout, inr: inrVal });
    recordMyBet(bet.amount, true, currentM, estPayout);

    if (gameMode === 'fun') {
      setFunBalance((prev) => prev + estPayout);
      showToast(`STOPPED PLANE & CASHED OUT! Won ₹${inrVal} INR @ ${currentM.toFixed(2)}x`, 'success');
      if (slot === 1) setLoading1(false);
      else setLoading2(false);
      return;
    }

    try {
      const storedId = user?.id || localStorage.getItem('tp_user_id') || '';
      const res = await fetch('/api/aviator/cashout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': storedId,
        },
        body: JSON.stringify({
          slot,
          betId: bet.id.startsWith('opt-') ? undefined : bet.id,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        const finalInr = (data.payout || estPayout).toFixed(2);
        setLastCashoutResult({ multiplier: data.multiplier || currentM, payout: data.payout || estPayout, inr: finalInr });
        showToast(`STOPPED PLANE & CASHED OUT! Won ₹${finalInr} INR @ ${data.multiplier}x`, 'success');
        const finalBet: AviatorBet = {
          ...cashedBet,
          cashoutMultiplier: data.multiplier,
          payout: data.payout,
        };
        if (slot === 1) {
          myBet1Ref.current = finalBet;
          setMyBet1(finalBet);
        } else {
          myBet2Ref.current = finalBet;
          setMyBet2(finalBet);
        }
        onRefreshUser();
      } else {
        showToast(data.error || 'Cashout missed!', 'error');
        fetchAviatorState();
      }
    } catch {
      showToast('Network error during cashout', 'error');
    } finally {
      if (slot === 1) setLoading1(false);
      else setLoading2(false);
    }
  };

  // Stop Aeroplane & Cash out all active bets (instant profit extraction)
  const handleStopAndCashoutAll = () => {
    let triggered = false;
    if (myBet1 && !myBet1.cashedOut && myBet1.status === 'pending') {
      handleCashout(1);
      triggered = true;
    }
    if (myBet2 && !myBet2.cashedOut && myBet2.status === 'pending') {
      handleCashout(2);
      triggered = true;
    }
    if (!triggered) {
      showToast('Place your bet in Panel 1 or 2 before takeoff to Stop the Plane & Cash Out during flight!', 'info');
    }
  };

  // Dedicated Realistic Monoplane Vector Renderer
  const drawAviatorMonoplane = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    angle: number,
    propAngle: number,
    scale: number = 1.0,
    isFlying: boolean = false
  ) => {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    ctx.scale(scale, scale);

    // 1. Jet / Afterburner flame trail when flying
    if (isFlying) {
      ctx.save();
      const flameLen = 16 + Math.random() * 10;
      const flameGrad = ctx.createLinearGradient(-30, 0, -30 - flameLen, 0);
      flameGrad.addColorStop(0, '#fde047');
      flameGrad.addColorStop(0.3, '#f97316');
      flameGrad.addColorStop(0.8, '#ef4444');
      flameGrad.addColorStop(1, 'rgba(239, 68, 68, 0)');
      ctx.fillStyle = flameGrad;
      ctx.beginPath();
      ctx.moveTo(-28, -3);
      ctx.lineTo(-30 - flameLen, 1);
      ctx.lineTo(-28, 5);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }

    // 2. Soft shadow under the plane
    ctx.save();
    ctx.shadowColor = isFlying ? 'rgba(239, 68, 68, 0.7)' : 'rgba(0, 0, 0, 0.6)';
    ctx.shadowBlur = isFlying ? 14 : 8;
    ctx.shadowOffsetY = isFlying ? 5 : 3;

    // 3. Lower / Background wing
    ctx.fillStyle = '#991b1b';
    ctx.beginPath();
    ctx.moveTo(6, 2);
    ctx.lineTo(-10, 16);
    ctx.lineTo(-18, 16);
    ctx.lineTo(-6, 3);
    ctx.closePath();
    ctx.fill();

    // 4. Main Fuselage (Streamlined Red Body with gradient)
    const bodyGrad = ctx.createLinearGradient(0, -12, 0, 10);
    bodyGrad.addColorStop(0, '#f87171');
    bodyGrad.addColorStop(0.25, '#ef4444');
    bodyGrad.addColorStop(0.7, '#dc2626');
    bodyGrad.addColorStop(1, '#991b1b');
    ctx.fillStyle = bodyGrad;

    ctx.beginPath();
    ctx.moveTo(34, 0); // Front nose tip
    ctx.bezierCurveTo(26, -10, -12, -10, -30, -5); // Top spine curve
    ctx.lineTo(-38, -20); // Tail fin top tip
    ctx.lineTo(-44, -20);
    ctx.lineTo(-36, 4); // Tail rudder bottom
    ctx.lineTo(-18, 8); // Rear underbelly
    ctx.bezierCurveTo(2, 8, 22, 7, 34, 0); // Front underbelly
    ctx.closePath();
    ctx.fill();

    // 5. Cockpit Canopy (Glass Windshield)
    const canopyGrad = ctx.createLinearGradient(0, -8, 0, -1);
    canopyGrad.addColorStop(0, '#ffffff');
    canopyGrad.addColorStop(0.5, '#7dd3fc');
    canopyGrad.addColorStop(1, '#0284c7');
    ctx.fillStyle = canopyGrad;
    ctx.beginPath();
    ctx.moveTo(16, -2);
    ctx.bezierCurveTo(14, -8, 2, -8, -3, -4);
    ctx.lineTo(14, -2);
    ctx.closePath();
    ctx.fill();

    // Canopy silver frame
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1;
    ctx.stroke();

    // 6. Main Foreground Wing
    const wingGrad = ctx.createLinearGradient(0, -18, 0, 0);
    wingGrad.addColorStop(0, '#ef4444');
    wingGrad.addColorStop(1, '#b91c1c');
    ctx.fillStyle = wingGrad;
    ctx.beginPath();
    ctx.moveTo(18, -3);
    ctx.lineTo(-4, -18);
    ctx.lineTo(-15, -18);
    ctx.lineTo(-3, 0);
    ctx.closePath();
    ctx.fill();

    // Wing silver highlight line
    ctx.strokeStyle = '#fca5a5';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(18, -3);
    ctx.lineTo(-4, -18);
    ctx.stroke();

    // 7. White Star / Aviator Decal on side
    ctx.fillStyle = '#ffffff';
    ctx.font = '900 11px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('★', -12, 1.5);

    // 8. Front Propeller Spinner
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(34, 0, 4, 0, Math.PI * 2);
    ctx.fill();

    // 9. Propeller Motion Blur Disc
    ctx.fillStyle = 'rgba(255, 255, 255, 0.22)';
    ctx.beginPath();
    ctx.ellipse(34, 0, 3.5, 16, 0, 0, Math.PI * 2);
    ctx.fill();

    // 10. Animated Propeller Blades
    ctx.save();
    ctx.translate(34, 0);
    ctx.rotate(propAngle);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(0, -15);
    ctx.lineTo(0, 15);
    ctx.stroke();
    ctx.restore();

    ctx.restore();
    ctx.restore();
  };

  // 60FPS High-Precision Animation Engine
  useEffect(() => {
    let lastTimestamp = performance.now();
    let propAngle = 0;

    const renderFrame = (timestamp: number) => {
      const deltaSec = Math.min(0.1, (timestamp - lastTimestamp) / 1000);
      lastTimestamp = timestamp;

      const canvas = canvasRef.current;
      if (!canvas) {
        animFrameIdRef.current = requestAnimationFrame(renderFrame);
        return;
      }
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        animFrameIdRef.current = requestAnimationFrame(renderFrame);
        return;
      }

      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      const width = rect.width || 420;
      const height = rect.height || 260;

      // Auto-resize canvas buffer without cumulative scaling
      if (canvas.width !== Math.round(width * dpr) || canvas.height !== Math.round(height * dpr)) {
        canvas.width = Math.round(width * dpr);
        canvas.height = Math.round(height * dpr);
      }

      ctx.save();
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, width, height);

      // 1. Draw Deep Purple / Violet Background
      const bgGrad = ctx.createLinearGradient(0, 0, width, height);
      bgGrad.addColorStop(0, '#120826');
      bgGrad.addColorStop(0.5, '#0b041a');
      bgGrad.addColorStop(1, '#070211');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, width, height);

      // 2. Draw Sunburst Radial Rays from Bottom-Left Corner (Reference Matching)
      const originX = 0;
      const originY = height;
      const rayCount = 28;
      const maxDist = Math.hypot(width, height) * 1.5;

      for (let i = 0; i < rayCount; i++) {
        if (i % 2 === 0) continue;
        const angle1 = (i / rayCount) * (Math.PI * 0.55);
        const angle2 = ((i + 1) / rayCount) * (Math.PI * 0.55);

        ctx.beginPath();
        ctx.moveTo(originX, originY);
        ctx.lineTo(originX + Math.cos(angle1) * maxDist, originY - Math.sin(angle1) * maxDist);
        ctx.lineTo(originX + Math.cos(angle2) * maxDist, originY - Math.sin(angle2) * maxDist);
        ctx.closePath();
        ctx.fillStyle = 'rgba(147, 51, 234, 0.055)';
        ctx.fill();
      }

      const state = gameStateRef.current;
      const now = Date.now() + timeOffsetRef.current;

      // Runway Starting Anchor Coordinates
      const runwayX = width * 0.16;
      const runwayY = height * 0.78;

      if (!state || state.status === 'waiting') {
        stopEngineSound();
        smoothMultiplierRef.current = 1.0;
        setDisplayMultiplier(1.0);

        if (state && lastRoundIdRef.current !== state.currentRoundId) {
          lastRoundIdRef.current = state.currentRoundId;
          generateSimulatedBets();
        }

        const elapsed = Math.max(0, (now - (state?.startTime || now)) / 1000);
        const remaining = Math.max(0, 4.0 - elapsed);
        const waitProgress = Math.min(1, elapsed / 4.0);

        // Propeller idles gently
        propAngle += deltaSec * 16;
        const idleVibration = Math.sin(timestamp * 0.015) * 1.2;

        // Runway launch track line
        ctx.strokeStyle = 'rgba(239, 68, 68, 0.35)';
        ctx.lineWidth = 2;
        ctx.setLineDash([6, 6]);
        ctx.beginPath();
        ctx.moveTo(0, runwayY + 14);
        ctx.lineTo(runwayX + 50, runwayY + 14);
        ctx.stroke();
        ctx.setLineDash([]);

        // DRAW THE AIRPLANE PARKED READY ON RUNWAY (Always Visible!)
        drawAviatorMonoplane(
          ctx,
          runwayX,
          runwayY + idleVibration,
          0.05,
          propAngle,
          1.0,
          false
        );

        // Center Countdown Bar
        const barWidth = Math.min(260, width * 0.7);
        const barHeight = 8;
        const barX = (width - barWidth) / 2;
        const barY = height * 0.52;

        ctx.save();
        ctx.textAlign = 'center';
        ctx.fillStyle = '#f8fafc';
        ctx.font = '900 13px system-ui, -apple-system, sans-serif';
        ctx.letterSpacing = '2px';
        ctx.fillText('WAITING FOR NEXT ROUND', width / 2, barY - 18);

        ctx.fillStyle = 'rgba(255, 255, 255, 0.12)';
        ctx.beginPath();
        ctx.roundRect(barX, barY, barWidth, barHeight, 4);
        ctx.fill();

        const fillGrad = ctx.createLinearGradient(barX, 0, barX + barWidth, 0);
        fillGrad.addColorStop(0, '#e11d48');
        fillGrad.addColorStop(1, '#f43f5e');
        ctx.fillStyle = fillGrad;
        ctx.beginPath();
        ctx.roundRect(barX, barY, Math.max(8, barWidth * waitProgress), barHeight, 4);
        ctx.fill();

        ctx.fillStyle = '#ef4444';
        ctx.font = '800 24px system-ui, -apple-system, sans-serif';
        ctx.fillText(`${remaining.toFixed(1)}s`, width / 2, barY + 36);
        ctx.restore();

      } else if (state.status === 'flying') {
        const elapsed = Math.max(0, (now - state.startTime) / 1000);
        const targetM = Number((1.00 + Math.pow(elapsed / 2.8, 1.7) * 1.3).toFixed(2));
        smoothMultiplierRef.current += (targetM - smoothMultiplierRef.current) * 0.25;
        const currentM = smoothMultiplierRef.current;
        setDisplayMultiplier(Number(currentM.toFixed(2)));

        // Real-time simulated live players cashout (Turning rows from black to green)
        if (liveBetsRef.current && liveBetsRef.current.length > 0) {
          let updatedAny = false;
          for (let i = 0; i < liveBetsRef.current.length; i++) {
            const b = liveBetsRef.current[i];
            if (!b.cashedOut && currentM >= b.targetMultiplier) {
              b.cashedOut = true;
              b.cashoutMultiplier = b.targetMultiplier;
              b.payout = Number((b.betAmount * b.targetMultiplier).toFixed(2));
              updatedAny = true;
            }
          }
          if (updatedAny && now - lastBetsUpdateRef.current > 65) {
            lastBetsUpdateRef.current = now;
            setLiveBetsList([...liveBetsRef.current]);
          }
        }

        playEngineSound(currentM);

        // Auto-Cashouts
        if (myBet1Ref.current && !myBet1Ref.current.cashedOut && myBet1Ref.current.status === 'pending') {
          const autoM = myBet1Ref.current.autoCashout;
          if (autoM && currentM >= autoM) handleCashout(1);
        }
        if (myBet2Ref.current && !myBet2Ref.current.cashedOut && myBet2Ref.current.status === 'pending') {
          const autoM = myBet2Ref.current.autoCashout;
          if (autoM && currentM >= autoM) handleCashout(2);
        }

        // Flight progress along curve (0.0 to 1.0)
        const flightProgress = Math.min(1.0, Math.max(0, (currentM - 1.0) / 10.0));
        const floatWobble = Math.sin(timestamp * 0.006) * 3;

        // Plane coordinates climbing smoothly
        const px = Math.min(width * 0.82, runwayX + (width * 0.66) * Math.min(1, Math.pow(flightProgress, 0.72)));
        const py = Math.max(height * 0.20, runwayY - (height * 0.58) * Math.min(1, Math.pow(flightProgress, 0.65)) + floatWobble);
        planePosRef.current = { x: px, y: py };

        // Curve control point
        const cpX = px * 0.45;
        const cpY = height * 0.95;

        // Fill Area Under Flight Curve (Glowing Red Gradient - Reference Matching)
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(0, height);
        ctx.quadraticCurveTo(cpX, cpY, px, py);
        ctx.lineTo(px, height);
        ctx.lineTo(0, height);
        ctx.closePath();

        const curveAreaGrad = ctx.createLinearGradient(0, py, 0, height);
        curveAreaGrad.addColorStop(0, 'rgba(225, 29, 72, 0.45)');
        curveAreaGrad.addColorStop(0.65, 'rgba(185, 28, 28, 0.16)');
        curveAreaGrad.addColorStop(1, 'rgba(15, 6, 26, 0.0)');
        ctx.fillStyle = curveAreaGrad;
        ctx.fill();

        // Glowing Neon Red Trajectory Curve
        ctx.beginPath();
        ctx.moveTo(0, height);
        ctx.quadraticCurveTo(cpX, cpY, px, py);
        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = 3.5;
        ctx.shadowColor = '#f43f5e';
        ctx.shadowBlur = 14;
        ctx.stroke();
        ctx.restore();

        // Particle exhaust smoke
        if (Math.random() < 0.7) {
          particlesRef.current.push({
            x: px - 24,
            y: py + 2 + (Math.random() - 0.5) * 4,
            vx: -3.0 - Math.random() * 2,
            vy: (Math.random() - 0.3) * 1.5,
            size: 2.5 + Math.random() * 3,
            alpha: 0.85,
            color: Math.random() < 0.6 ? '#f43f5e' : '#fb923c',
            life: 0,
            maxLife: 22 + Math.random() * 12,
          });
        }

        // Render exhaust particles
        ctx.save();
        particlesRef.current.forEach((p) => {
          p.x += p.vx;
          p.y += p.vy;
          p.life++;
          p.alpha = Math.max(0, 1 - p.life / p.maxLife);
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fillStyle = p.color;
          ctx.globalAlpha = p.alpha;
          ctx.fill();
        });
        particlesRef.current = particlesRef.current.filter((p) => p.life < p.maxLife);
        ctx.restore();

        // Propeller spinning fast in flight
        propAngle += deltaSec * 55;
        const curveTangent = Math.atan2(cpY - py, px - cpX) * 0.44;
        planeAngleRef.current = -curveTangent + Math.sin(timestamp * 0.005) * 0.03;

        // DRAW THE AIRPLANE FLYING SOARING UP
        drawAviatorMonoplane(
          ctx,
          px,
          py,
          planeAngleRef.current,
          propAngle,
          1.0,
          true
        );

        // Center Big Multiplier Text: "2.64x"
        ctx.save();
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = '#ffffff';
        ctx.font = '900 64px system-ui, -apple-system, sans-serif';
        ctx.shadowColor = 'rgba(0, 0, 0, 0.85)';
        ctx.shadowBlur = 18;
        ctx.shadowOffsetY = 4;
        ctx.fillText(`${currentM.toFixed(2)}x`, width / 2, height * 0.44);
        ctx.restore();

      } else if (state.status === 'crashed') {
        stopEngineSound();
        const finalM = state.targetCrashMultiplier || smoothMultiplierRef.current || 1.0;
        smoothMultiplierRef.current = finalM;
        setDisplayMultiplier(finalM);

        const crashElapsed = Math.max(0, (now - state.startTime) / 1000);
        const exitX = planePosRef.current.x + crashElapsed * 480;
        const exitY = planePosRef.current.y - crashElapsed * 280;

        // Plane exits off top-right into distance
        if (exitX < width + 120) {
          propAngle += deltaSec * 45;
          drawAviatorMonoplane(
            ctx,
            exitX,
            exitY,
            -0.5,
            propAngle,
            0.95,
            true
          );
        }

        // Flew Away Banner
        ctx.save();
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = '#ef4444';
        ctx.font = '900 24px system-ui, -apple-system, sans-serif';
        ctx.letterSpacing = '3px';
        ctx.shadowColor = 'rgba(239, 68, 68, 0.6)';
        ctx.shadowBlur = 12;
        ctx.fillText('FLEW AWAY!', width / 2, height * 0.38);

        // Final Crash Multiplier in Red
        ctx.fillStyle = '#f43f5e';
        ctx.font = '900 62px system-ui, -apple-system, sans-serif';
        ctx.shadowColor = 'rgba(0, 0, 0, 0.9)';
        ctx.shadowBlur = 16;
        ctx.fillText(`${finalM.toFixed(2)}x`, width / 2, height * 0.52);
        ctx.restore();
      }

      ctx.restore();
      animFrameIdRef.current = requestAnimationFrame(renderFrame);
    };

    animFrameIdRef.current = requestAnimationFrame(renderFrame);
    return () => {
      if (animFrameIdRef.current) {
        cancelAnimationFrame(animFrameIdRef.current);
      }
      stopEngineSound();
    };
  }, [soundEnabled]);

  // Multipliers history pills helper
  const recentHistory = gameState?.history && gameState.history.length > 0 
    ? gameState.history 
    : [1.20, 1.15, 1.96, 2.20, 1.25, 1.05, 4.74, 11.59, 1.45, 1.82];

  const getPillColor = (mult: number) => {
    if (mult < 2.0) {
      return 'text-[#38bdf8] bg-[#121c2d] border-[#1e2e4a]'; // Sky Blue
    } else if (mult < 10.0) {
      return 'text-[#c084fc] bg-[#221336] border-[#3f1f68]'; // Purple / Violet
    } else {
      return 'text-[#f472b6] bg-[#2d1127] border-[#661e59]'; // Magenta / Pink / Gold
    }
  };

  return (
    <div className="w-full max-w-xl mx-auto min-h-screen bg-[#0d0f17] text-white flex flex-col select-none font-sans pb-16">
      
      {/* 1. TOP BAR (Pin-Up Aviator Authenticity) */}
      <div className="flex items-center justify-between px-3 py-2.5 bg-[#0e1017] border-b border-[#1b1f2e]">
        {/* Left: Back Navigation + Red Bold Italic Aviator Logo */}
        <div className="flex items-center gap-2">
          {onBack && (
            <button
              onClick={onBack}
              className="p-1.5 rounded-lg bg-[#181c29] hover:bg-[#22273a] text-slate-400 hover:text-white transition-colors"
              title="Back"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
          )}
          
          <div className="flex items-center gap-1.5">
            {/* Stylized Red Italic Aviator Logo matching reference */}
            <span className="text-2xl font-black italic tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-[#e11d48] via-[#ef4444] to-[#f43f5e] drop-shadow-[0_2px_8px_rgba(225,29,72,0.4)]">
              Aviator
            </span>
            <span className="w-2 h-2 rounded-full bg-[#ef4444] animate-pulse -mt-2"></span>
          </div>
        </div>

        {/* Right: Balance Display + Hamburger Menu */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Balance Pill */}
          <div 
            onClick={() => onOpenDeposit && onOpenDeposit()}
            className="flex items-baseline gap-1 px-3 py-1 bg-[#141824] border border-[#232a3f] rounded-xl cursor-pointer hover:border-[#22c55e]/40 transition-all shadow-inner"
            title="Click to recharge / deposit"
          >
            <span className="text-base font-black tracking-tight text-[#22c55e]">
              ₹{currentBalance.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            <span className="text-xs font-bold text-[#4ade80]">INR</span>
          </div>

          {/* Sound Toggle */}
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="p-1.5 rounded-lg bg-[#181c29] hover:bg-[#22273a] text-slate-300 hover:text-white transition-colors"
            title={soundEnabled ? 'Mute' : 'Unmute'}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4 text-[#22c55e]" /> : <VolumeX className="w-4 h-4 text-slate-400" />}
          </button>

          {/* Hamburger Menu Icon */}
          <button
            onClick={() => setIsMenuOpen(true)}
            className="p-1.5 rounded-lg bg-[#181c29] hover:bg-[#22273a] text-slate-300 hover:text-white transition-colors"
            title="Menu & Settings"
          >
            <Menu className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* 2. RECENT MULTIPLIERS STRIP (Horizontal Ribbon with History Dropdown) */}
      <div className="flex items-center gap-1.5 px-2 py-1.5 bg-[#0b0d14] overflow-x-auto no-scrollbar border-b border-[#181c29]">
        <div className="flex items-center gap-1.5 flex-1 overflow-x-auto no-scrollbar py-0.5">
          {recentHistory.slice(0, 14).map((mult, idx) => (
            <button
              key={idx}
              onClick={() => setIsHistoryModalOpen(true)}
              className={`shrink-0 px-2 py-0.5 rounded-full text-[11px] font-black border transition-transform hover:scale-105 ${getPillColor(mult)}`}
            >
              {mult.toFixed(2)}x
            </button>
          ))}
        </div>

        {/* '...' Button to Open Full Multiplier History Modal */}
        <button
          onClick={() => setIsHistoryModalOpen(true)}
          className="shrink-0 w-6 h-6 rounded-full bg-[#1b1f2e] hover:bg-[#282e42] text-slate-300 flex items-center justify-center text-xs font-bold transition-colors ml-1"
          title="Past Multipliers History"
        >
          •••
        </button>
      </div>

      {/* 3. FLIGHT STAGE CONTAINER */}
      <div className="relative w-full px-2 pt-2 pb-1">
        {/* Top Gold / Amber "FUN MODE" Banner (Matching Screenshot) */}
        <div 
          onClick={() => {
            const nextMode = gameMode === 'fun' ? 'real' : 'fun';
            setGameMode(nextMode);
            showToast(nextMode === 'fun' ? 'Switched to FUN MODE (₹10,000 INR Demo)' : 'Switched to REAL PLAY (Live Wallet)', 'info');
          }}
          className={`w-full py-1 rounded-t-xl text-center text-xs font-black uppercase tracking-wider cursor-pointer shadow-md transition-all flex items-center justify-center gap-1.5 ${
            gameMode === 'fun'
              ? 'bg-gradient-to-r from-[#b45309] via-[#d97706] to-[#b45309] text-white hover:brightness-110'
              : 'bg-gradient-to-r from-[#065f46] via-[#10b981] to-[#065f46] text-white hover:brightness-110'
          }`}
          title="Click to toggle Fun Mode / Real Play"
        >
          <span>{gameMode === 'fun' ? 'FUN MODE' : 'REAL PLAY'}</span>
          <span className="text-[10px] opacity-80">(Click to switch)</span>
        </div>

        {/* Flight Canvas Box */}
        <div className="relative w-full h-56 sm:h-64 rounded-b-xl overflow-hidden border border-[#26163f] shadow-2xl bg-[#090414]">
          <canvas
            ref={canvasRef}
            className="w-full h-full block cursor-crosshair"
            style={{ width: '100%', height: '100%' }}
          />

          {/* Recent Cashout Success Banner */}
          {lastCashoutResult && (
            <div className="absolute top-3 left-1/2 -translate-x-1/2 z-20 px-4 py-2 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-600 border border-emerald-300 text-white font-black text-xs sm:text-sm shadow-[0_0_25px_rgba(16,185,129,0.7)] animate-bounce flex items-center gap-2 whitespace-nowrap">
              <span>🎉 CASHED OUT AT {lastCashoutResult.multiplier.toFixed(2)}x!</span>
              <span className="bg-black/40 px-2 py-0.5 rounded-lg text-emerald-200 font-mono">
                +₹{lastCashoutResult.inr} INR
              </span>
            </div>
          )}

          {/* Active Flight Floating Controls: STOP PLANE & CASH OUT BUTTON */}
          {gameState?.status === 'flying' && (
            <>
              {(() => {
                const hasBet1Active = Boolean(myBet1 && !myBet1.cashedOut && myBet1.status === 'pending');
                const hasBet2Active = Boolean(myBet2 && !myBet2.cashedOut && myBet2.status === 'pending');
                const hasAnyActive = hasBet1Active || hasBet2Active;
                const totalStake = (hasBet1Active ? (myBet1?.amount || 0) : 0) + (hasBet2Active ? (myBet2?.amount || 0) : 0);
                const estPayout = Number((totalStake * displayMultiplier).toFixed(2));
                const estInr = estPayout.toFixed(2);

                if (hasAnyActive) {
                  return (
                    <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 w-auto max-w-[94%]">
                      <button
                        onClick={handleStopAndCashoutAll}
                        className="px-5 sm:px-8 py-2.5 sm:py-3 rounded-2xl bg-gradient-to-r from-[#ea580c] via-[#f97316] to-[#ea580c] hover:brightness-110 active:scale-95 text-white font-black text-xs sm:text-sm md:text-base shadow-[0_0_35px_rgba(249,115,22,0.9)] border-2 border-[#fed7aa] animate-pulse flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap transition-all"
                        title="Click to Stop Aeroplane and Cash Out all profits immediately!"
                      >
                        <span className="w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-sm bg-white shrink-0 shadow-sm" />
                        <span>STOP PLANE & CASH OUT</span>
                        <span className="bg-black/60 px-2 py-0.5 rounded-lg text-yellow-300 font-mono text-xs sm:text-sm border border-yellow-400/40">
                          ₹{estInr} INR
                        </span>
                      </button>
                    </div>
                  );
                }

                return (
                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20">
                    <div className="px-3.5 py-1.5 rounded-full bg-black/75 backdrop-blur-md border border-white/15 text-slate-300 text-xs font-bold flex items-center gap-2 shadow-lg whitespace-nowrap">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping inline-block" />
                      <span>Flight Live ({displayMultiplier.toFixed(2)}x)</span>
                      <span className="text-slate-400">• Place bet below for next flight</span>
                    </div>
                  </div>
                );
              })()}
            </>
          )}

          {/* Active Players Overlay Badge (Bottom Right of Arena - Matching Screenshot) */}
          <div className="absolute bottom-2.5 right-2.5 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/10 shadow-lg">
            <div className="flex -space-x-1.5 overflow-hidden">
              <img
                className="inline-block h-4 w-4 rounded-full ring-1 ring-black object-cover"
                src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=50&auto=format&fit=crop&q=80"
                alt="Player"
              />
              <img
                className="inline-block h-4 w-4 rounded-full ring-1 ring-black object-cover"
                src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=50&auto=format&fit=crop&q=80"
                alt="Player"
              />
              <img
                className="inline-block h-4 w-4 rounded-full ring-1 ring-black object-cover"
                src="https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=50&auto=format&fit=crop&q=80"
                alt="Player"
              />
            </div>
            <span className="text-xs font-black text-slate-200">
              {activePlayersCount}
            </span>
          </div>
        </div>
      </div>

      {/* 4. DUAL BETTING CONTROL PANELS (Panel 1 & Panel 2) */}
      <div className="w-full px-2 py-1 space-y-2">
        
        {/* === BET PANEL 1 === */}
        <div className="bg-[#171924] border border-[#252839] rounded-2xl p-2.5 shadow-xl">
          {/* Header Switcher: Bet | Auto */}
          <div className="flex justify-center mb-2">
            <div className="inline-flex p-0.5 rounded-full bg-[#0d0f17] border border-[#252839]">
              <button
                onClick={() => setPanel1Mode('bet')}
                className={`px-6 py-1 rounded-full text-xs font-bold transition-all ${
                  panel1Mode === 'bet'
                    ? 'bg-[#282b3d] text-white shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Bet
              </button>
              <button
                onClick={() => setPanel1Mode('auto')}
                className={`px-6 py-1 rounded-full text-xs font-bold transition-all ${
                  panel1Mode === 'auto'
                    ? 'bg-[#282b3d] text-white shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Auto
              </button>
            </div>
          </div>

          {/* Auto Mode Settings (if toggled) */}
          {panel1Mode === 'auto' && (
            <div className="flex items-center justify-between px-2 py-1.5 mb-2 bg-[#0d0f17] rounded-xl text-xs">
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isAutoBet1}
                  onChange={(e) => setIsAutoBet1(e.target.checked)}
                  className="rounded border-slate-700 bg-slate-800 text-[#22c55e] focus:ring-0"
                />
                <span className="font-bold text-slate-300">Auto Bet</span>
              </label>

              <div className="flex items-center gap-1.5">
                <label className="flex items-center gap-1 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isAutoCashout1Enabled}
                    onChange={(e) => setIsAutoCashout1Enabled(e.target.checked)}
                    className="rounded border-slate-700 bg-slate-800 text-[#22c55e] focus:ring-0"
                  />
                  <span className="text-slate-400">Auto Cash Out</span>
                </label>
                <div className="flex items-center bg-[#1c1f2e] border border-[#2b3046] rounded-lg px-2 py-0.5">
                  <input
                    type="number"
                    step="0.1"
                    min="1.1"
                    value={autoCashout1}
                    onChange={(e) => setAutoCashout1(e.target.value)}
                    className="w-12 bg-transparent text-center font-bold text-white text-xs outline-none"
                  />
                  <span className="text-slate-400 text-xs">x</span>
                </div>
              </div>
            </div>
          )}

          {/* Panel 1 Controls Grid: Stepper/Chips on Left, Big Action Button on Right */}
          <div className="grid grid-cols-2 gap-2.5 items-stretch">
            {/* Left Column: - Amount +, Quick Chips */}
            <div className="flex flex-col justify-between space-y-2">
              {/* Stepper Row: (-) [10.00] (+) */}
              <div className="flex items-center justify-between bg-[#0e1018] border border-[#24283b] rounded-xl p-1 shadow-inner">
                <button
                  onClick={() => setBet1Amount((prev) => Math.max(10, Number((prev - 10).toFixed(2))))}
                  className="w-7 h-7 rounded-lg bg-[#24283a] hover:bg-[#2f354c] active:scale-95 text-slate-200 flex items-center justify-center transition-all"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>

                <div className="text-center font-black text-lg text-white">
                  ₹{bet1Amount.toFixed(0)}
                </div>

                <button
                  onClick={() => setBet1Amount((prev) => Number((prev + 10).toFixed(2)))}
                  className="w-7 h-7 rounded-lg bg-[#24283a] hover:bg-[#2f354c] active:scale-95 text-slate-200 flex items-center justify-center transition-all"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Quick Chips: 10, 50, 100, 500 */}
              <div className="grid grid-cols-4 gap-1">
                {[10, 50, 100, 500].map((chip) => (
                  <button
                    key={chip}
                    onClick={() => setBet1Amount(chip)}
                    className={`py-1 rounded-lg text-xs font-bold transition-all ${
                      bet1Amount === chip
                        ? 'bg-[#31364e] text-white border border-[#484f72]'
                        : 'bg-[#10131d] hover:bg-[#1a1e2d] text-slate-300'
                    }`}
                  >
                    ₹{chip}
                  </button>
                ))}
              </div>
            </div>

            {/* Right Column: Giant Bet / Cash Out Button */}
            <div className="h-full">
              {myBet1 && !myBet1.cashedOut && myBet1.status === 'pending' && gameState?.status === 'flying' ? (
                // Active In-Flight: GLOWING ORANGE STOP & CASH OUT BUTTON
                <button
                  onClick={() => handleCashout(1)}
                  disabled={loading1}
                  className="w-full h-full min-h-[72px] rounded-2xl bg-gradient-to-b from-[#f97316] to-[#ea580c] hover:from-[#ea580c] hover:to-[#c2410c] active:scale-98 shadow-[0_0_28px_rgba(249,115,22,0.85)] flex flex-col items-center justify-center text-white transition-all cursor-pointer border-2 border-[#fdba74] animate-pulse"
                >
                  <div className="flex items-center gap-1.5 text-xs sm:text-sm font-black uppercase tracking-wide">
                    <span className="w-2.5 h-2.5 rounded-xs bg-white shrink-0 shadow-sm" />
                    <span>STOP & CASH OUT</span>
                  </div>
                  <span className="text-lg sm:text-xl font-black tracking-tight text-yellow-200 leading-tight">
                    ₹{(bet1Amount * displayMultiplier).toFixed(2)} INR
                  </span>
                </button>
              ) : myBet1 && !myBet1.cashedOut && myBet1.status === 'pending' && gameState?.status === 'waiting' ? (
                // Placed & Waiting for Flight: Option to cancel bet
                <button
                  onClick={() => {
                    myBet1Ref.current = null;
                    setMyBet1(null);
                    showToast('Bet cancelled before takeoff', 'info');
                  }}
                  className="w-full h-full min-h-[72px] rounded-2xl bg-gradient-to-b from-[#dc2626] to-[#b91c1c] hover:from-[#b91c1c] hover:to-[#991b1b] flex flex-col items-center justify-center text-white transition-all border border-[#f87171]/30"
                >
                  <span className="text-sm font-bold">Waiting...</span>
                  <span className="text-xs font-bold text-red-200">Cancel Bet (₹{bet1Amount.toFixed(2)} INR)</span>
                </button>
              ) : (
                // Standard Green Bet Button
                <button
                  onClick={() => handlePlaceBet(1)}
                  disabled={loading1}
                  className="w-full h-full min-h-[72px] rounded-2xl bg-gradient-to-b from-[#22c55e] to-[#16a34a] hover:from-[#16a34a] hover:to-[#15803d] active:scale-98 shadow-[0_4px_20px_rgba(34,197,94,0.45)] flex flex-col items-center justify-center text-white transition-all cursor-pointer border border-[#4ade80]/30"
                >
                  <span className="text-base font-bold">Bet</span>
                  <span className="text-xl font-black tracking-tight">
                    ₹{bet1Amount.toFixed(2)} INR
                  </span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* === BET PANEL 2 (Dual Betting Console) === */}
        {showPanel2 ? (
          <div className="bg-[#171924] border border-[#252839] rounded-2xl p-2.5 shadow-xl relative">
            {/* Header Switcher + Close/Minimize Button (Matching Reference) */}
            <div className="flex items-center justify-between mb-2">
              <div className="w-6"></div> {/* Spacer */}
              
              <div className="inline-flex p-0.5 rounded-full bg-[#0d0f17] border border-[#252839]">
                <button
                  onClick={() => setPanel2Mode('bet')}
                  className={`px-6 py-1 rounded-full text-xs font-bold transition-all ${
                    panel2Mode === 'bet'
                      ? 'bg-[#282b3d] text-white shadow'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Bet
                </button>
                <button
                  onClick={() => setPanel2Mode('auto')}
                  className={`px-6 py-1 rounded-full text-xs font-bold transition-all ${
                    panel2Mode === 'auto'
                      ? 'bg-[#282b3d] text-white shadow'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Auto
                </button>
              </div>

              {/* Minimize/Close Panel 2 Icon (⊟) */}
              <button
                onClick={() => setShowPanel2(false)}
                className="w-6 h-6 rounded-lg bg-[#232738] hover:bg-[#2f354c] text-slate-400 hover:text-white flex items-center justify-center text-xs transition-colors"
                title="Hide Panel 2"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Auto Mode Settings (Panel 2) */}
            {panel2Mode === 'auto' && (
              <div className="flex items-center justify-between px-2 py-1.5 mb-2 bg-[#0d0f17] rounded-xl text-xs">
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isAutoBet2}
                    onChange={(e) => setIsAutoBet2(e.target.checked)}
                    className="rounded border-slate-700 bg-slate-800 text-[#22c55e] focus:ring-0"
                  />
                  <span className="font-bold text-slate-300">Auto Bet</span>
                </label>

                <div className="flex items-center gap-1.5">
                  <label className="flex items-center gap-1 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isAutoCashout2Enabled}
                      onChange={(e) => setIsAutoCashout2Enabled(e.target.checked)}
                      className="rounded border-slate-700 bg-slate-800 text-[#22c55e] focus:ring-0"
                    />
                    <span className="text-slate-400">Auto Cash Out</span>
                  </label>
                  <div className="flex items-center bg-[#1c1f2e] border border-[#2b3046] rounded-lg px-2 py-0.5">
                    <input
                      type="number"
                      step="0.1"
                      min="1.1"
                      value={autoCashout2}
                      onChange={(e) => setAutoCashout2(e.target.value)}
                      className="w-12 bg-transparent text-center font-bold text-white text-xs outline-none"
                    />
                    <span className="text-slate-400 text-xs">x</span>
                  </div>
                </div>
              </div>
            )}

            {/* Panel 2 Controls Grid */}
            <div className="grid grid-cols-2 gap-2.5 items-stretch">
              {/* Left Column: - Amount +, Quick Chips */}
              <div className="flex flex-col justify-between space-y-2">
                <div className="flex items-center justify-between bg-[#0e1018] border border-[#24283b] rounded-xl p-1 shadow-inner">
                  <button
                    onClick={() => setBet2Amount((prev) => Math.max(10, Number((prev - 10).toFixed(2))))}
                    className="w-7 h-7 rounded-lg bg-[#24283a] hover:bg-[#2f354c] active:scale-95 text-slate-200 flex items-center justify-center transition-all"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>

                  <div className="text-center font-black text-lg text-white">
                    ₹{bet2Amount.toFixed(0)}
                  </div>

                  <button
                    onClick={() => setBet2Amount((prev) => Number((prev + 10).toFixed(2)))}
                    className="w-7 h-7 rounded-lg bg-[#24283a] hover:bg-[#2f354c] active:scale-95 text-slate-200 flex items-center justify-center transition-all"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="grid grid-cols-4 gap-1">
                  {[10, 50, 100, 500].map((chip) => (
                    <button
                      key={chip}
                      onClick={() => setBet2Amount(chip)}
                      className={`py-1 rounded-lg text-xs font-bold transition-all ${
                        bet2Amount === chip
                          ? 'bg-[#31364e] text-white border border-[#484f72]'
                          : 'bg-[#10131d] hover:bg-[#1a1e2d] text-slate-300'
                      }`}
                    >
                      ₹{chip}
                    </button>
                  ))}
                </div>
              </div>

              {/* Right Column: Giant Bet / Cash Out Button */}
              <div className="h-full">
                {myBet2 && !myBet2.cashedOut && myBet2.status === 'pending' && gameState?.status === 'flying' ? (
                  <button
                    onClick={() => handleCashout(2)}
                    disabled={loading2}
                    className="w-full h-full min-h-[72px] rounded-2xl bg-gradient-to-b from-[#f97316] to-[#ea580c] hover:from-[#ea580c] hover:to-[#c2410c] active:scale-98 shadow-[0_0_28px_rgba(249,115,22,0.85)] flex flex-col items-center justify-center text-white transition-all cursor-pointer border-2 border-[#fdba74] animate-pulse"
                  >
                    <div className="flex items-center gap-1.5 text-xs sm:text-sm font-black uppercase tracking-wide">
                      <span className="w-2.5 h-2.5 rounded-xs bg-white shrink-0 shadow-sm" />
                      <span>STOP & CASH OUT</span>
                    </div>
                    <span className="text-lg sm:text-xl font-black tracking-tight text-yellow-200 leading-tight">
                      ₹{(bet2Amount * displayMultiplier).toFixed(2)} INR
                    </span>
                  </button>
                ) : myBet2 && !myBet2.cashedOut && myBet2.status === 'pending' && gameState?.status === 'waiting' ? (
                  <button
                    onClick={() => {
                      myBet2Ref.current = null;
                      setMyBet2(null);
                      showToast('Bet cancelled before takeoff', 'info');
                    }}
                    className="w-full h-full min-h-[72px] rounded-2xl bg-gradient-to-b from-[#dc2626] to-[#b91c1c] hover:from-[#b91c1c] hover:to-[#991b1b] flex flex-col items-center justify-center text-white transition-all border border-[#f87171]/30"
                  >
                    <span className="text-sm font-bold">Waiting...</span>
                    <span className="text-xs font-bold text-red-200">Cancel Bet (₹{bet2Amount.toFixed(2)} INR)</span>
                  </button>
                ) : (
                  <button
                    onClick={() => handlePlaceBet(2)}
                    disabled={loading2}
                    className="w-full h-full min-h-[72px] rounded-2xl bg-gradient-to-b from-[#22c55e] to-[#16a34a] hover:from-[#16a34a] hover:to-[#15803d] active:scale-98 shadow-[0_4px_20px_rgba(34,197,94,0.45)] flex flex-col items-center justify-center text-white transition-all cursor-pointer border border-[#4ade80]/30"
                  >
                    <span className="text-base font-bold">Bet</span>
                    <span className="text-xl font-black tracking-tight">
                      ₹{bet2Amount.toFixed(2)} INR
                    </span>
                  </button>
                )}
              </div>
            </div>
          </div>
        ) : (
          /* Expand Button when Panel 2 is Hidden */
          <button
            onClick={() => setShowPanel2(true)}
            className="w-full py-2 rounded-xl bg-[#171924] hover:bg-[#1f2231] border border-dashed border-[#2d3246] text-xs font-bold text-slate-300 flex items-center justify-center gap-1.5 transition-colors"
          >
            <Plus className="w-4 h-4 text-[#22c55e]" />
            <span>Add Second Bet Panel</span>
          </button>
        )}
      </div>

      {/* 5. BOTTOM LIVE BETS & HISTORY LEDGER (Exact Video Matching) */}
      <div className="w-full px-2 mt-2">
        <div className="bg-[#12141d] border border-[#1e2230] rounded-2xl p-2.5 sm:p-3 shadow-2xl">
          
          {/* Header Tabs: All Bets | My Bets | Top */}
          <div className="flex items-center justify-between pb-2.5 border-b border-[#1b1f2d]">
            <div className="flex items-center gap-1.5 bg-[#0b0c13] p-1 rounded-xl">
              <button
                onClick={() => setLedgerTab('all')}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  ledgerTab === 'all'
                    ? 'bg-[#25293d] text-white shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                All Bets
              </button>
              <button
                onClick={() => setLedgerTab('my')}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  ledgerTab === 'my'
                    ? 'bg-[#25293d] text-white shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                My Bets
              </button>
              <button
                onClick={() => setLedgerTab('top')}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  ledgerTab === 'top'
                    ? 'bg-[#25293d] text-white shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Top
              </button>
            </div>
          </div>

          {/* TAB 1: ALL BETS (Live Black-to-Green Transition as Multiplier Climbs) */}
          {ledgerTab === 'all' && (
            <div>
              {/* ALL BETS Total Counter Header */}
              <div className="pt-2 pb-1.5 flex items-center justify-between">
                <div>
                  <div className="text-[10px] font-bold text-slate-400 tracking-wider uppercase">ALL BETS</div>
                  <div className="text-[15px] font-black text-white leading-tight">{totalBetsCount}</div>
                </div>
              </div>

              {/* Table Column Header */}
              <div className="grid grid-cols-12 px-2.5 py-1.5 text-[11px] font-semibold text-slate-400 border-b border-[#1b1f2d]">
                <div className="col-span-4 text-left">User</div>
                <div className="col-span-3 text-center">Bet INR</div>
                <div className="col-span-2 text-center">X</div>
                <div className="col-span-3 text-right">Cash out INR</div>
              </div>

              {/* Scrollable Live Rows */}
              <div className="mt-1 space-y-1 max-h-72 sm:max-h-80 overflow-y-auto pr-0.5 no-scrollbar text-xs">
                {/* User's own active bet row (Panel 1) */}
                {myBet1 && (
                  <div className={`grid grid-cols-12 items-center px-2.5 py-2 rounded-lg transition-all duration-300 ${
                    myBet1.cashedOut
                      ? 'bg-[#102a1c] border border-[#22c55e]/60 shadow-[0_0_12px_rgba(34,197,94,0.25)]'
                      : 'bg-[#181b24] border border-cyan-500/40'
                  }`}>
                    <div className="col-span-4 flex items-center gap-2 overflow-hidden">
                      <span className="w-2 h-2 rounded-full bg-[#22c55e] animate-ping flex-shrink-0" />
                      <span className="font-bold text-white text-[12px] truncate">You (P1)</span>
                    </div>
                    <div className="col-span-3 text-center font-bold text-white text-[12px]">
                      {myBet1.amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                    <div className="col-span-2 flex justify-center">
                      {myBet1.cashedOut && myBet1.cashoutMultiplier ? (
                        <span className={`px-1.5 py-0.5 rounded text-[11px] font-black border ${
                          myBet1.cashoutMultiplier >= 10
                            ? 'bg-[#431236] text-[#f472b6] border-[#ec4899]/60'
                            : myBet1.cashoutMultiplier >= 2
                            ? 'bg-[#2d1b46] text-[#c084fc] border-[#a855f7]/60'
                            : 'bg-[#163823] text-[#22c55e] border-[#22c55e]/60'
                        }`}>
                          {myBet1.cashoutMultiplier.toFixed(2)}x
                        </span>
                      ) : (
                        <span className="text-[11px] text-amber-400 font-bold animate-pulse">In flight</span>
                      )}
                    </div>
                    <div className="col-span-3 text-right font-black text-[12px] text-white">
                      {myBet1.cashedOut
                        ? myBet1.payout.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                        : ''}
                    </div>
                  </div>
                )}

                {/* User's own active bet row (Panel 2) */}
                {myBet2 && (
                  <div className={`grid grid-cols-12 items-center px-2.5 py-2 rounded-lg transition-all duration-300 ${
                    myBet2.cashedOut
                      ? 'bg-[#102a1c] border border-[#22c55e]/60 shadow-[0_0_12px_rgba(34,197,94,0.25)]'
                      : 'bg-[#181b24] border border-cyan-500/40'
                  }`}>
                    <div className="col-span-4 flex items-center gap-2 overflow-hidden">
                      <span className="w-2 h-2 rounded-full bg-[#22c55e] animate-ping flex-shrink-0" />
                      <span className="font-bold text-white text-[12px] truncate">You (P2)</span>
                    </div>
                    <div className="col-span-3 text-center font-bold text-white text-[12px]">
                      {myBet2.amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                    <div className="col-span-2 flex justify-center">
                      {myBet2.cashedOut && myBet2.cashoutMultiplier ? (
                        <span className={`px-1.5 py-0.5 rounded text-[11px] font-black border ${
                          myBet2.cashoutMultiplier >= 10
                            ? 'bg-[#431236] text-[#f472b6] border-[#ec4899]/60'
                            : myBet2.cashoutMultiplier >= 2
                            ? 'bg-[#2d1b46] text-[#c084fc] border-[#a855f7]/60'
                            : 'bg-[#163823] text-[#22c55e] border-[#22c55e]/60'
                        }`}>
                          {myBet2.cashoutMultiplier.toFixed(2)}x
                        </span>
                      ) : (
                        <span className="text-[11px] text-amber-400 font-bold animate-pulse">In flight</span>
                      )}
                    </div>
                    <div className="col-span-3 text-right font-black text-[12px] text-white">
                      {myBet2.cashedOut
                        ? myBet2.payout.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                        : ''}
                    </div>
                  </div>
                )}

                {/* Simulated Live Players (Turning from Black to Green in real time) */}
                {liveBetsList.map((bet) => (
                  <div
                    key={bet.id}
                    className={`grid grid-cols-12 items-center px-2.5 py-1.5 rounded-lg transition-all duration-300 ${
                      bet.cashedOut
                        ? 'bg-[#10281b] border border-[#22c55e]/35 shadow-[inset_0_0_8px_rgba(34,197,94,0.08)]'
                        : 'bg-[#12141a] border border-[#1b1e28]'
                    }`}
                  >
                    {/* User with Avatar */}
                    <div className="col-span-4 flex items-center gap-2 overflow-hidden">
                      <img
                        src={bet.avatar}
                        alt={bet.username}
                        className="w-5 h-5 rounded-full object-cover flex-shrink-0"
                      />
                      <span className="font-semibold text-slate-300 text-[12px] truncate">{bet.username}</span>
                    </div>

                    {/* Bet INR */}
                    <div className="col-span-3 text-center font-bold text-white text-[12px]">
                      {bet.betAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>

                    {/* X Multiplier Badge (Appears when Cashed Out) */}
                    <div className="col-span-2 flex justify-center">
                      {bet.cashedOut && bet.cashoutMultiplier ? (
                        <span
                          className={`px-1.5 py-0.5 rounded text-[11px] font-black border ${
                            bet.cashoutMultiplier >= 10.0
                              ? 'bg-[#431236] text-[#f472b6] border-[#ec4899]/60'
                              : bet.cashoutMultiplier >= 2.0
                              ? 'bg-[#2d1b46] text-[#c084fc] border-[#a855f7]/60'
                              : 'bg-[#163823] text-[#22c55e] border-[#22c55e]/60'
                          }`}
                        >
                          {bet.cashoutMultiplier.toFixed(2)}x
                        </span>
                      ) : null}
                    </div>

                    {/* Cash out INR */}
                    <div className="col-span-3 text-right font-black text-[12px] text-white">
                      {bet.cashedOut
                        ? bet.payout.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                        : ''}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 2: MY BETS (History of User's Current & Past Bets) */}
          {ledgerTab === 'my' && (
            <div>
              {/* Table Column Header */}
              <div className="grid grid-cols-12 px-2.5 py-2 text-[11px] font-semibold text-slate-400 border-b border-[#1b1f2d] mt-2">
                <div className="col-span-3 text-left">Date</div>
                <div className="col-span-3 text-center">Bet, INR</div>
                <div className="col-span-3 text-center">X</div>
                <div className="col-span-3 text-right">Cash out, INR</div>
              </div>

              {/* Rows List */}
              <div className="mt-1 space-y-1 max-h-72 sm:max-h-80 overflow-y-auto pr-0.5 no-scrollbar text-xs">
                {myBetHistory.length === 0 ? (
                  <div className="py-10 text-center text-slate-500 text-xs">
                    No bets placed yet in this session.
                  </div>
                ) : (
                  myBetHistory.map((item) => (
                    <div
                      key={item.id}
                      className={`grid grid-cols-12 items-center px-2.5 py-1.5 rounded-lg transition-all ${
                        item.cashedOut
                          ? 'bg-[#10281b] border border-[#22c55e]/35'
                          : 'bg-[#12141a] border border-[#1b1e28]'
                      }`}
                    >
                      <div className="col-span-3 text-slate-400 text-[11px]">{item.time}</div>
                      <div className="col-span-3 text-center font-bold text-white text-[12px]">
                        {item.betAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </div>
                      <div className="col-span-3 flex justify-center">
                        {item.cashedOut && item.multiplier ? (
                          <span className={`px-1.5 py-0.5 rounded text-[11px] font-black border ${
                            item.multiplier >= 2.0
                              ? 'bg-[#2d1b46] text-[#c084fc] border-[#a855f7]/60'
                              : 'bg-[#163823] text-[#22c55e] border-[#22c55e]/60'
                          }`}>
                            {item.multiplier.toFixed(2)}x
                          </span>
                        ) : (
                          <span className="text-slate-600 font-bold">-</span>
                        )}
                      </div>
                      <div className="col-span-3 text-right font-black text-[12px] text-white">
                        {item.cashedOut
                          ? item.payout.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                          : '-'}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* TAB 3: TOP (Matching Frames 00:18-00:26 in Video) */}
          {ledgerTab === 'top' && (
            <div>
              {/* Sub-Filters Row 1: X | Win | Rounds */}
              <div className="flex items-center gap-1.5 pt-2 pb-1.5">
                {(['x', 'win', 'rounds'] as const).map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setTopFilterCategory(cat)}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-bold capitalize transition-all ${
                      topFilterCategory === cat
                        ? 'bg-[#25293d] text-white shadow'
                        : 'bg-[#0f1118] text-slate-400 hover:text-white'
                    }`}
                  >
                    {cat === 'x' ? 'X' : cat === 'win' ? 'Win' : 'Rounds'}
                  </button>
                ))}
              </div>

              {/* Sub-Filters Row 2: Day | Month | Year */}
              <div className="flex items-center gap-1.5 pb-2 border-b border-[#1b1f2d]">
                {(['day', 'month', 'year'] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setTopFilterTime(t)}
                    className={`flex-1 py-1 rounded-md text-[11px] font-bold capitalize transition-all ${
                      topFilterTime === t
                        ? 'bg-[#1f2334] text-white border border-[#373d56]'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>

              {/* Top Win Records List */}
              <div className="mt-2 space-y-2 max-h-72 sm:max-h-80 overflow-y-auto pr-0.5 no-scrollbar text-xs">
                {TOP_WINS_DATA.map((item) => (
                  <div
                    key={item.id}
                    className="bg-[#12141a] border border-[#1b1e28] rounded-xl p-2.5 flex items-center justify-between hover:bg-[#161922] transition-colors"
                  >
                    {/* Left: Avatar + User & Date */}
                    <div className="flex items-center gap-2.5 min-w-[90px]">
                      <img
                        src={getAvatarUrl(item.avatarSeed)}
                        className="w-7 h-7 rounded-full object-cover flex-shrink-0"
                        alt="User"
                      />
                      <div>
                        <div className="text-white font-bold text-xs">{item.user}</div>
                        <div className="text-slate-500 text-[10px]">{item.date}</div>
                      </div>
                    </div>

                    {/* Middle: Bet INR & Win INR */}
                    <div className="text-left">
                      <div className="text-[11px] text-slate-300">
                        <span className="text-slate-500 mr-1">Bet INR:</span>
                        <b className="text-white">{item.betInr.toFixed(2)}</b>
                      </div>
                      <div className="text-[11px] text-slate-300">
                        <span className="text-slate-500 mr-1">Win INR:</span>
                        <b className="text-white">
                          {item.winInr.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </b>
                      </div>
                    </div>

                    {/* Right: Multipliers + Verified Shield */}
                    <div className="flex items-center gap-2">
                      <div className="text-right">
                        <div className="text-[10px] text-slate-400 flex items-center justify-end gap-1">
                          <span className="text-slate-500">Result:</span>
                          <span className="px-1.5 py-0.5 rounded bg-[#2d1b46] text-[#c084fc] border border-[#a855f7]/50 font-bold text-[10px]">
                            {item.resultMult.toLocaleString('en-IN', { minimumFractionDigits: 2 })}x
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-400 mt-1 flex items-center justify-end gap-1">
                          <span className="text-slate-500">Round max:</span>
                          <span className="text-[#a855f7] font-semibold">
                            {item.roundMax.toLocaleString('en-IN', { minimumFractionDigits: 2 })}x
                          </span>
                        </div>
                      </div>
                      <Shield className="w-4 h-4 text-emerald-400 flex-shrink-0 ml-1" />
                    </div>
                  </div>
                ))}
              </div>

              {/* Provably Fair Footer */}
              <div className="text-center pt-3 pb-1 text-[11px] text-slate-500 flex items-center justify-center gap-1.5 border-t border-[#1b1f2d] mt-2">
                <span>This game is</span>
                <span className="text-slate-300 font-semibold flex items-center gap-1">
                  <Shield className="w-3.5 h-3.5 text-emerald-400 inline" /> Provably Fair
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 6. SETTINGS & MENU MODAL */}
      {isMenuOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-sm rounded-2xl bg-[#161822] border border-[#252839] p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#252839] pb-3">
              <div className="flex items-center gap-2">
                <span className="text-xl font-black italic text-[#ef4444]">Aviator</span>
                <span className="text-xs font-semibold text-slate-400">Settings</span>
              </div>
              <button
                onClick={() => setIsMenuOpen(false)}
                className="p-1 rounded-lg bg-[#232738] text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#0f1118]">
                <span className="font-medium">Sound Effects</span>
                <button
                  onClick={() => setSoundEnabled(!soundEnabled)}
                  className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
                    soundEnabled ? 'bg-[#22c55e] text-black' : 'bg-slate-700 text-white'
                  }`}
                >
                  {soundEnabled ? 'ON' : 'OFF'}
                </button>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#0f1118]">
                <span className="font-medium">Game Mode</span>
                <button
                  onClick={() => {
                    const next = gameMode === 'fun' ? 'real' : 'fun';
                    setGameMode(next);
                  }}
                  className={`px-3 py-1 rounded-full text-xs font-bold ${
                    gameMode === 'fun' ? 'bg-[#d97706] text-white' : 'bg-[#10b981] text-white'
                  }`}
                >
                  {gameMode === 'fun' ? 'FUN MODE' : 'REAL PLAY'}
                </button>
              </div>

              <button
                onClick={() => {
                  setIsMenuOpen(false);
                  setIsFairnessModalOpen(true);
                }}
                className="w-full flex items-center justify-between p-2.5 rounded-xl bg-[#0f1118] hover:bg-[#1a1e2d] transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-[#22c55e]" />
                  <span>Provably Fair Cryptography</span>
                </div>
                <Info className="w-4 h-4 text-slate-400" />
              </button>

              <button
                onClick={() => {
                  setIsMenuOpen(false);
                  setIsRulesModalOpen(true);
                }}
                className="w-full flex items-center justify-between p-2.5 rounded-xl bg-[#0f1118] hover:bg-[#1a1e2d] transition-colors"
              >
                <div className="flex items-center gap-2">
                  <HelpCircle className="w-4 h-4 text-sky-400" />
                  <span>How to Play / Game Rules</span>
                </div>
                <Info className="w-4 h-4 text-slate-400" />
              </button>
            </div>

            <div className="pt-2">
              <button
                onClick={() => setIsMenuOpen(false)}
                className="w-full py-2.5 rounded-xl bg-[#232738] hover:bg-[#2d3246] font-bold text-white transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 7. PROVABLY FAIR VERIFICATION MODAL */}
      {isFairnessModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md rounded-2xl bg-[#161822] border border-[#252839] p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#252839] pb-3">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-[#22c55e]" />
                <span className="font-bold text-white">Provably Fair Algorithm</span>
              </div>
              <button
                onClick={() => setIsFairnessModalOpen(false)}
                className="p-1 rounded-lg bg-[#232738] text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-300">
              <p>
                Aviator uses a 100% provably fair cryptographic algorithm based on SHA-256. 
                The round outcome is generated before takeoff and cannot be altered by anyone during flight.
              </p>

              <div className="p-3 rounded-xl bg-[#0d0f17] border border-[#232738] space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-400">Current Round:</span>
                  <span className="font-mono text-white font-bold">{gameState?.currentRoundId || 'AV-29401'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Server Seed Hash:</span>
                  <span className="font-mono text-emerald-400 text-[10px] truncate max-w-[200px]">
                    e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Client Seeds:</span>
                  <span className="font-mono text-sky-400 text-[10px]">Combined from 3 first bettors</span>
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-[#1b253b] text-sky-200">
                Formula: <code className="font-mono text-xs">crashPoint = floor((100 * e - h) / (e - h)) / 100</code>
              </div>
            </div>

            <button
              onClick={() => setIsFairnessModalOpen(false)}
              className="w-full py-2.5 rounded-xl bg-[#232738] hover:bg-[#2d3246] font-bold text-white transition-colors"
            >
              Got It
            </button>
          </div>
        </div>
      )}

      {/* 8. HOW TO PLAY / RULES MODAL */}
      {isRulesModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md rounded-2xl bg-[#161822] border border-[#252839] p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#252839] pb-3">
              <div className="flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-sky-400" />
                <span className="font-bold text-white">How to Play Aviator</span>
              </div>
              <button
                onClick={() => setIsRulesModalOpen(false)}
                className="p-1 rounded-lg bg-[#232738] text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-300">
              <div className="flex gap-3 items-start p-2.5 rounded-xl bg-[#0d0f17]">
                <div className="w-6 h-6 rounded-full bg-[#ef4444] text-white flex items-center justify-center font-bold shrink-0">1</div>
                <div>
                  <h4 className="font-bold text-white text-sm">Place Your Bet</h4>
                  <p className="text-slate-400 mt-0.5">Choose your stake (e.g. ₹10.00 INR) and click the green Bet button before the plane takes off.</p>
                </div>
              </div>

              <div className="flex gap-3 items-start p-2.5 rounded-xl bg-[#0d0f17]">
                <div className="w-6 h-6 rounded-full bg-[#f97316] text-white flex items-center justify-center font-bold shrink-0">2</div>
                <div>
                  <h4 className="font-bold text-white text-sm">Watch the Multiplier Rise</h4>
                  <p className="text-slate-400 mt-0.5">As the red plane climbs higher into the sky, the multiplier counter increases from 1.00x upwards.</p>
                </div>
              </div>

              <div className="flex gap-3 items-start p-2.5 rounded-xl bg-[#0d0f17]">
                <div className="w-6 h-6 rounded-full bg-[#22c55e] text-white flex items-center justify-center font-bold shrink-0">3</div>
                <div>
                  <h4 className="font-bold text-white text-sm">Cash Out Before It Flew Away!</h4>
                  <p className="text-slate-400 mt-0.5">Press the Orange Cash Out button to secure your winnings before the plane flies away!</p>
                </div>
              </div>
            </div>

            <button
              onClick={() => setIsRulesModalOpen(false)}
              className="w-full py-2.5 rounded-xl bg-[#22c55e] hover:bg-[#16a34a] font-bold text-black transition-colors"
            >
              Start Playing
            </button>
          </div>
        </div>
      )}

      {/* 9. PAST MULTIPLIERS FULL HISTORY MODAL */}
      {isHistoryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md rounded-2xl bg-[#161822] border border-[#252839] p-5 shadow-2xl space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-[#252839] pb-3 shrink-0">
              <div className="flex items-center gap-2">
                <History className="w-5 h-5 text-[#c084fc]" />
                <span className="font-bold text-white">Round History</span>
              </div>
              <button
                onClick={() => setIsHistoryModalOpen(false)}
                className="p-1 rounded-lg bg-[#232738] text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto no-scrollbar space-y-2 pr-1">
              <div className="grid grid-cols-4 gap-2">
                {recentHistory.map((mult, idx) => (
                  <div
                    key={idx}
                    className={`p-2 rounded-xl text-center font-black border text-sm flex flex-col items-center justify-center ${getPillColor(mult)}`}
                  >
                    <span>{mult.toFixed(2)}x</span>
                    <span className="text-[9px] font-normal opacity-70">Round #{idx + 1}</span>
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={() => setIsHistoryModalOpen(false)}
              className="w-full py-2.5 rounded-xl bg-[#232738] hover:bg-[#2d3246] font-bold text-white transition-colors shrink-0"
            >
              Close
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
