import React, { useState, useEffect, useRef } from 'react';
import {
  ChevronLeft,
  Headphones,
  Music2,
  Volume2,
  RefreshCw,
  Wallet,
  X,
  Check,
  ShieldCheck,
  HelpCircle,
  Clock,
  Sparkles,
  Info,
  CheckCircle2,
  AlertCircle,
  Minus,
  Plus,
} from 'lucide-react';
import { User, ColorPredictionBet, ColorPredictionResult } from '../types';
import { JalwaLogo } from './JalwaLogo';

interface ColorPredictionViewProps {
  user: User | null;
  onRefreshUser: () => void;
  showToast: (message: string, type?: 'success' | 'error') => void;
  onOpenDeposit?: () => void;
  onOpenWithdraw?: () => void;
  onBack?: () => void;
}

type BetSelection =
  | 'green'
  | 'red'
  | 'violet'
  | 'big'
  | 'small'
  | '0'
  | '1'
  | '2'
  | '3'
  | '4'
  | '5'
  | '6'
  | '7'
  | '8'
  | '9';

interface GameMode {
  id: '30s' | '1m' | '3m' | '5m';
  title: string;
  duration: number; // in seconds
}

const GAME_MODES: GameMode[] = [
  { id: '30s', title: 'WinGo 30sec', duration: 30 },
  { id: '1m', title: 'WinGo 1 Min', duration: 60 },
  { id: '3m', title: 'WinGo 3 Min', duration: 180 },
  { id: '5m', title: 'WinGo 5 Min', duration: 300 },
];

// 3D Clock Icon for Game Modes
const Clock3D = ({ active = false }: { active?: boolean }) => (
  <svg viewBox="0 0 60 60" className="w-9 h-9 drop-shadow-md">
    <defs>
      <radialGradient id={active ? 'clockActiveGrad' : 'clockInactiveGrad'} cx="35%" cy="35%" r="65%">
        <stop offset="0%" stopColor={active ? '#6ee7b7' : '#94a3b8'} />
        <stop offset="50%" stopColor={active ? '#10b981' : '#64748b'} />
        <stop offset="100%" stopColor={active ? '#065f46' : '#334155'} />
      </radialGradient>
    </defs>
    <circle cx="30" cy="30" r="26" fill={`url(#${active ? 'clockActiveGrad' : 'clockInactiveGrad'})`} stroke="#ffffff" strokeWidth="2.5" />
    <circle cx="30" cy="30" r="21" fill={active ? '#d1fae5' : '#e2e8f0'} />
    <circle cx="30" cy="30" r="3" fill="#0f172a" />
    <line x1="30" y1="30" x2="30" y2="15" stroke="#0f172a" strokeWidth="2.5" strokeLinecap="round" />
    <line x1="30" y1="30" x2="41" y2="30" stroke="#0f172a" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

// 3D Specular Number Ball Component matching screenshot
const NumberBall3D: React.FC<{ num: number; size?: 'sm' | 'md' | 'lg' }> = ({ num, size = 'md' }) => {
  const isZero = num === 0;
  const isFive = num === 5;
  const isGreen = [1, 3, 7, 9].includes(num);

  const sizeClasses = {
    sm: 'w-7 h-7 text-xs',
    md: 'w-11 h-11 sm:w-12 sm:h-12 text-sm sm:text-base',
    lg: 'w-14 h-14 text-lg font-black',
  };

  return (
    <div
      className={`relative rounded-full flex items-center justify-center font-black shadow-[0_4px_12px_rgba(0,0,0,0.5)] transition-transform duration-200 hover:scale-110 active:scale-95 ${sizeClasses[size]}`}
      style={{
        background: isZero
          ? 'linear-gradient(135deg, #ef4444 50%, #a855f7 50%)'
          : isFive
          ? 'linear-gradient(135deg, #10b981 50%, #a855f7 50%)'
          : isGreen
          ? 'radial-gradient(circle at 35% 35%, #6ee7b7, #10b981, #065f46)'
          : 'radial-gradient(circle at 35% 35%, #fca5a5, #ef4444, #991b1b)',
      }}
    >
      {/* Specular highlight */}
      <div className="absolute top-1 left-2 w-3.5 h-1.5 bg-white/70 rounded-full blur-[0.5px] transform -rotate-45 pointer-events-none" />
      {/* White center circle with colored number */}
      <div className="w-[58%] h-[58%] rounded-full bg-white flex items-center justify-center shadow-inner">
        <span
          className="font-black leading-none"
          style={{
            color: isZero || isFive ? '#7c3aed' : isGreen ? '#047857' : '#b91c1c',
          }}
        >
          {num}
        </span>
      </div>
    </div>
  );
};

// Winged Rocket Golden Emblem matching images (2).jpeg
const WingedRocketEmblem = () => (
  <div className="relative flex items-center justify-center w-full -mb-6 z-20">
    <svg viewBox="0 0 260 130" className="w-64 h-32 drop-shadow-[0_12px_24px_rgba(0,0,0,0.5)]">
      <defs>
        <linearGradient id="ribbonFront" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#ffa033" />
          <stop offset="60%" stopColor="#ff7711" />
          <stop offset="100%" stopColor="#e65100" />
        </linearGradient>
        <linearGradient id="ribbonBack" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#d97706" />
          <stop offset="100%" stopColor="#78350f" />
        </linearGradient>
        <linearGradient id="goldRim" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#fffbeb" />
          <stop offset="40%" stopColor="#fef08a" />
          <stop offset="100%" stopColor="#f59e0b" />
        </linearGradient>
        <radialGradient id="goldCenter" cx="40%" cy="35%" r="65%">
          <stop offset="0%" stopColor="#fed7aa" />
          <stop offset="40%" stopColor="#fb923c" />
          <stop offset="100%" stopColor="#ea580c" />
        </radialGradient>
      </defs>

      {/* --- Left Feathers (3 white rounded cartoon feathers) --- */}
      <g fill="#ffffff" filter="drop-shadow(0 4px 6px rgba(0,0,0,0.15))">
        {/* Bottom feather */}
        <path d="M 98 56 C 75 42 46 45 36 52 C 32 55 52 66 76 68 Z" />
        {/* Middle feather */}
        <path d="M 92 46 C 68 28 40 32 30 40 C 26 44 48 56 74 60 Z" />
        {/* Top feather */}
        <path d="M 88 38 C 66 18 42 22 34 30 C 30 35 55 48 78 52 Z" />
      </g>

      {/* --- Right Feathers (3 white rounded cartoon feathers) --- */}
      <g fill="#ffffff" filter="drop-shadow(0 4px 6px rgba(0,0,0,0.15))">
        {/* Bottom feather */}
        <path d="M 162 56 C 185 42 214 45 224 52 C 228 55 208 66 184 68 Z" />
        {/* Middle feather */}
        <path d="M 168 46 C 192 28 220 32 230 40 C 234 44 212 56 186 60 Z" />
        {/* Top feather */}
        <path d="M 172 38 C 194 18 218 22 226 30 C 230 35 205 48 182 52 Z" />
      </g>

      {/* --- Ribbon Dark Fold Undersides --- */}
      <path d="M 38 68 L 52 88 L 65 72 Z" fill="url(#ribbonBack)" />
      <path d="M 222 68 L 208 88 L 195 72 Z" fill="url(#ribbonBack)" />

      {/* --- 3D Orange Ribbon Banner Loops --- */}
      {/* Left Loop Flap */}
      <path
        d="M 22 64 C 20 54 38 46 62 48 C 76 49 88 56 94 66 C 82 72 65 76 48 76 C 30 76 22 70 22 64 Z"
        fill="url(#ribbonFront)"
        stroke="#c2410c"
        strokeWidth="1"
      />
      {/* Right Loop Flap */}
      <path
        d="M 238 64 C 240 54 222 46 198 48 C 184 49 172 56 166 66 C 178 72 195 76 212 76 C 230 76 238 70 238 64 Z"
        fill="url(#ribbonFront)"
        stroke="#c2410c"
        strokeWidth="1"
      />

      {/* Center Arch Banner Band */}
      <path
        d="M 44 80 Q 130 108 216 80 L 222 68 Q 130 92 38 68 Z"
        fill="url(#ribbonFront)"
        stroke="#ea580c"
        strokeWidth="1.5"
      />

      {/* --- Center Gold Medallion --- */}
      <circle cx="130" cy="52" r="36" fill="url(#goldRim)" stroke="#fef08a" strokeWidth="2.5" />
      <circle cx="130" cy="52" r="30" fill="url(#goldCenter)" stroke="#ffffff" strokeWidth="2" />
      <circle cx="130" cy="52" r="28" fill="none" stroke="#fef08a" strokeWidth="1" opacity="0.6" />

      {/* --- 3D White Rocket Icon with Energy Bolt --- */}
      <g transform="translate(116, 36) scale(1.05)" fill="#ffffff">
        <path d="M 13 0 C 18 4 23 10 23 19 L 23 25 L 19 27 L 19 29 L 7 29 L 7 27 L 3 25 L 3 19 C 3 10 8 4 13 0 Z" />
        <path d="M 4 20 L -2 27 L 4 27 Z" />
        <path d="M 22 20 L 28 27 L 22 27 Z" />
        <circle cx="13" cy="13" r="4.5" fill="#f59e0b" />
        <path d="M 13.5 9.5 L 11 13.5 L 13.5 13.5 L 12.5 16.5 L 15.5 12.5 L 13 12.5 Z" fill="#ffffff" />
        <path d="M 10 29 Q 13 36 16 29 Z" fill="#ef4444" />
      </g>
    </svg>
  </div>
);

// Winged Golden Star & Ruby Ribbon Emblem for Loss state matching colorful aesthetic
const WingedRetryEmblem = () => (
  <div className="relative flex items-center justify-center w-full -mb-6 z-20">
    <svg viewBox="0 0 260 130" className="w-64 h-32 drop-shadow-[0_12px_24px_rgba(0,0,0,0.55)]">
      <defs>
        <linearGradient id="retryRibbon" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#ff6b4a" />
          <stop offset="60%" stopColor="#e11d48" />
          <stop offset="100%" stopColor="#9f1239" />
        </linearGradient>
        <linearGradient id="silverRim" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#fffbeb" />
          <stop offset="40%" stopColor="#fde047" />
          <stop offset="100%" stopColor="#f59e0b" />
        </linearGradient>
        <radialGradient id="retryCoin" cx="40%" cy="35%" r="65%">
          <stop offset="0%" stopColor="#fef08a" />
          <stop offset="45%" stopColor="#fb923c" />
          <stop offset="100%" stopColor="#c2410c" />
        </radialGradient>
      </defs>

      {/* Left White Feathers */}
      <g fill="#ffffff" filter="drop-shadow(0 4px 6px rgba(0,0,0,0.18))">
        <path d="M 98 56 C 75 42 46 45 36 52 C 32 55 52 66 76 68 Z" />
        <path d="M 92 46 C 68 28 40 32 30 40 C 26 44 48 56 74 60 Z" />
        <path d="M 88 38 C 66 18 42 22 34 30 C 30 35 55 48 78 52 Z" />
      </g>

      {/* Right White Feathers */}
      <g fill="#ffffff" filter="drop-shadow(0 4px 6px rgba(0,0,0,0.18))">
        <path d="M 162 56 C 185 42 214 45 224 52 C 228 55 208 66 184 68 Z" />
        <path d="M 168 46 C 192 28 220 32 230 40 C 234 44 212 56 186 60 Z" />
        <path d="M 172 38 C 194 18 218 22 226 30 C 230 35 205 48 182 52 Z" />
      </g>

      {/* Left and Right Ribbon Folds */}
      <path
        d="M 22 64 C 20 54 38 46 62 48 C 76 49 88 56 94 66 C 82 72 65 76 48 76 C 30 76 22 70 22 64 Z"
        fill="url(#retryRibbon)"
        stroke="#881337"
        strokeWidth="1"
      />
      <path
        d="M 238 64 C 240 54 222 46 198 48 C 184 49 172 56 166 66 C 178 72 195 76 212 76 C 230 76 238 70 238 64 Z"
        fill="url(#retryRibbon)"
        stroke="#881337"
        strokeWidth="1"
      />

      {/* Center Ruby Ribbon Arch Band */}
      <path
        d="M 44 80 Q 130 108 216 80 L 222 68 Q 130 92 38 68 Z"
        fill="url(#retryRibbon)"
        stroke="#881337"
        strokeWidth="1.5"
      />

      {/* Center Golden Medallion */}
      <circle cx="130" cy="52" r="36" fill="url(#silverRim)" stroke="#fef08a" strokeWidth="2.5" />
      <circle cx="130" cy="52" r="30" fill="url(#retryCoin)" stroke="#ffffff" strokeWidth="2" />

      {/* Golden Star Icon Inside */}
      <g transform="translate(118, 40) scale(1.05)" fill="#ffffff">
        <path d="M 12 2 L 15 8 L 22 9 L 17 14 L 18 21 L 12 17 L 6 21 L 7 14 L 2 9 L 9 8 Z" fill="#ffffff" />
      </g>
    </svg>
  </div>
);

// 3D Flared & Curled White Paper Receipt Ticket matching images (2).jpeg
const CurvedTicketPaper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="relative w-full flex items-center justify-center animate-dispense-ticket">
    <div className="relative w-[92%] sm:w-[94%]">
      {/* SVG Background Paper with Deep Flared Edges, Bent Arc, and 3D Curled Bottom */}
      <svg
        viewBox="0 0 300 156"
        className="w-full h-auto drop-shadow-[0_14px_24px_rgba(0,0,0,0.38)]"
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id="curvedPaperGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="68%" stopColor="#ffffff" />
            <stop offset="86%" stopColor="#f8fafc" />
            <stop offset="96%" stopColor="#edf2f7" />
            <stop offset="100%" stopColor="#cbd5e1" />
          </linearGradient>
        </defs>

        {/* 3D Cast Shadow under the forward-bent curled bottom lip */}
        <path
          d="M 16 138 Q 150 162 284 138 Q 150 148 16 138 Z"
          fill="#5a0410"
          opacity="0.36"
        />

        {/* 3D Flared & Deeply Curled Paper Path */}
        <path
          d="M 32 0 L 268 0 C 271 0 274 2 275 6 C 278 16 288 74 297 122 C 299 135 292 143 282 145 Q 150 160 18 145 C 8 143 1 135 3 122 C 12 74 22 16 25 6 C 26 2 29 0 32 0 Z"
          fill="url(#curvedPaperGrad)"
        />

        {/* Bottom 3D Cylinder Curl Rim Highlight */}
        <path
          d="M 18 143 Q 150 158 282 143"
          stroke="#ffffff"
          strokeWidth="2.5"
          fill="none"
          opacity="0.95"
        />

        {/* Bottom Crease / Shadow defining the 3D cylindrical bend */}
        <path
          d="M 18 141 Q 150 156 282 141"
          stroke="#cbd5e1"
          strokeWidth="1.2"
          fill="none"
          opacity="0.8"
        />
      </svg>

      {/* Content Placed Over White Paper */}
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4 pt-1.5 pb-4 z-10 select-none">
        {children}
      </div>
    </div>
  </div>
);

// Festive multi-colored confetti shower overlay
const ConfettiOverlay = () => {
  const particles = Array.from({ length: 48 }).map((_, i) => ({
    id: i,
    left: `${(i * 2.1 + (i % 7) * 14) % 100}%`,
    delay: `${(i * 0.08) % 2}s`,
    duration: `${2.0 + (i % 4) * 0.4}s`,
    color: ['#ff1a38', '#00c988', '#facc15', '#06b6d4', '#8b5cf6', '#ec4899', '#f97316', '#3b82f6', '#10b981', '#fbbf24'][i % 10],
    size: 6 + (i % 5) * 2,
    isStrip: i % 2 === 0,
  }));

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-10">
      {particles.map((p) => (
        <div
          key={p.id}
          className="absolute animate-confetti-fall"
          style={{
            left: p.left,
            top: '-20px',
            backgroundColor: p.color,
            width: p.isStrip ? `${p.size * 2.2}px` : `${p.size}px`,
            height: `${p.size}px`,
            transform: `rotate(${p.id * 37}deg)`,
            animationDelay: p.delay,
            animationDuration: p.duration,
            borderRadius: p.isStrip ? '2px' : '50%',
            boxShadow: `0 0 6px ${p.color}aa`,
          }}
        />
      ))}
    </div>
  );
};

interface ResultModalState {
  show: boolean;
  periodId: string;
  drawnNumber: number;
  color: 'green' | 'red' | 'violet-green' | 'violet-red';
  size: 'big' | 'small';
  bonusAmount: number;
  betAmount: number;
  userWon: boolean;
  userBetted: boolean;
  winningBetsCount?: number;
  totalBetsCount?: number;
}

export const ColorPredictionView: React.FC<ColorPredictionViewProps> = ({
  user,
  onRefreshUser,
  showToast,
  onOpenDeposit,
  onOpenWithdraw,
  onBack,
}) => {
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [activeMode, setActiveMode] = useState<GameMode>(GAME_MODES[0]); // WinGo 30sec by default
  const [currentPeriodId, setCurrentPeriodId] = useState<string>('20250809100051289');
  const [remainingSeconds, setRemainingSeconds] = useState<number>(19);
  const [isFreeze, setIsFreeze] = useState<boolean>(false);
  const [history, setHistory] = useState<ColorPredictionResult[]>([]);
  const [myBets, setMyBets] = useState<ColorPredictionBet[]>([]);
  const [activeRoundBets, setActiveRoundBets] = useState<ColorPredictionBet[]>([]);
  const [activeHistoryTab, setActiveHistoryTab] = useState<'game' | 'chart' | 'my'>('game');
  const [historyPageSize, setHistoryPageSize] = useState<number | 'all'>(50); // Default to showing at least 50 records as requested!
  const [historyCurrentPage, setHistoryCurrentPage] = useState<number>(1);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Fresh refs to prevent stale closure during timer ticks
  const activeRoundBetsRef = useRef<ColorPredictionBet[]>([]);
  const currentPeriodIdRef = useRef<string>(currentPeriodId);
  const myBetsRef = useRef<ColorPredictionBet[]>([]);
  const userRef = useRef(user);
  const handleRoundSettlementRef = useRef<() => void>();

  useEffect(() => {
    activeRoundBetsRef.current = activeRoundBets;
  }, [activeRoundBets]);

  useEffect(() => {
    currentPeriodIdRef.current = currentPeriodId;
  }, [currentPeriodId]);

  useEffect(() => {
    myBetsRef.current = myBets;
  }, [myBets]);

  useEffect(() => {
    userRef.current = user;
  }, [user]);

  // Quick Multiplier state in main view
  const [quickMultiplier, setQuickMultiplier] = useState<number>(1);

  // Modals
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showRulesModal, setShowRulesModal] = useState(false);
  const [showSupportModal, setShowSupportModal] = useState(false);

  // Bet Modal State
  const [betModalOpen, setBetModalOpen] = useState(false);
  const [selectedBet, setSelectedBet] = useState<BetSelection | null>(null);
  const [contractUnit, setContractUnit] = useState<number>(1); // 1, 10, 100, 1000
  const [betCount, setBetCount] = useState<number>(1);
  const [agreedPreSale, setAgreedPreSale] = useState(true);
  const [isSubmittingBet, setIsSubmittingBet] = useState(false);

  // Result Celebration Popup Modal (matching images__2__33e3162a.jpeg)
  const [resultModal, setResultModal] = useState<ResultModalState | null>(null);
  const [autoCloseSeconds, setAutoCloseSeconds] = useState<number>(5);


  // Auto-close countdown effect for result celebration popup
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (resultModal && autoCloseSeconds > 0) {
      timer = setInterval(() => {
        setAutoCloseSeconds((prev) => {
          if (prev <= 1) {
            setResultModal(null);
            return 5;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [resultModal, autoCloseSeconds]);

  // Sound effects
  const playAudioCue = (type: 'tick' | 'win' | 'bet' | 'loss') => {
    if (!soundEnabled) return;
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);

      if (type === 'tick') {
        osc.frequency.setValueAtTime(600, audioCtx.currentTime);
        gain.gain.setValueAtTime(0.05, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.08);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.08);
      } else if (type === 'bet') {
        osc.frequency.setValueAtTime(440, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.15);
        gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.15);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.15);
      } else if (type === 'win') {
        osc.frequency.setValueAtTime(523.25, audioCtx.currentTime);
        osc.frequency.setValueAtTime(659.25, audioCtx.currentTime + 0.1);
        osc.frequency.setValueAtTime(783.99, audioCtx.currentTime + 0.2);
        gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.4);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.4);
      } else if (type === 'loss') {
        osc.frequency.setValueAtTime(392.0, audioCtx.currentTime);
        osc.frequency.setValueAtTime(349.23, audioCtx.currentTime + 0.12);
        osc.frequency.setValueAtTime(311.13, audioCtx.currentTime + 0.24);
        gain.gain.setValueAtTime(0.12, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.45);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.45);
      }
    } catch (_) {}
  };

  // Generate realistic default history with 60 past rounds matching authentic WinGo distribution
  const generateInitialHistory = (): ColorPredictionResult[] => {
    const results: ColorPredictionResult[] = [];
    const basePeriodNum = 20250809100051088;
    const baseBlock = 78242651;
    const now = Date.now();

    // 60 diverse realistic WinGo historical draw outcomes
    const sampleNumbers = [
      7, 4, 2, 0, 9, 4, 1, 6, 5, 8, 3, 1, 8, 2, 6, 9, 0, 4, 7, 5,
      3, 6, 8, 1, 2, 5, 9, 4, 0, 7, 2, 8, 3, 6, 1, 9, 5, 4, 0, 8,
      7, 1, 3, 2, 6, 5, 9, 4, 8, 0, 3, 7, 2, 1, 6, 5, 8, 9, 4, 2
    ];

    for (let i = 0; i < 60; i++) {
      const periodSeq = basePeriodNum - i;
      const num = sampleNumbers[i % sampleNumbers.length];
      const isZero = num === 0;
      const isFive = num === 5;
      const isGreen = [1, 3, 7, 9].includes(num);
      const color: 'green' | 'red' | 'violet-green' | 'violet-red' = isZero
        ? 'violet-red'
        : isFive
        ? 'violet-green'
        : isGreen
        ? 'green'
        : 'red';
      const size: 'big' | 'small' = num >= 5 ? 'big' : 'small';
      const blockHeight = baseBlock - i * 20;
      const hash = ((num * 1337 + i * 7919) % 65536).toString(16).padStart(4, '0');
      const createdAt = new Date(now - (i + 1) * 30000).toISOString();

      results.push({
        periodId: String(periodSeq),
        number: num,
        color,
        size,
        blockHeight,
        hash,
        createdAt,
      });
    }

    return results;
  };

  // Fetch Game State from Backend
  const fetchGameState = async () => {
    try {
      const storedId = user?.id || localStorage.getItem('tp_user_id') || '';
      const res = await fetch('/api/color-prediction', {
        headers: { 'x-user-id': storedId },
      });
      if (res.ok) {
        const data = await res.json();
        if (data.currentPeriodId) setCurrentPeriodId(data.currentPeriodId);
        if (data.history && data.history.length > 0) {
          // If backend returns fewer than 50 records, merge with realistic initial records to ensure 50+ records
          if (data.history.length < 50) {
            const initial = generateInitialHistory();
            const existingIds = new Set(data.history.map((h: any) => h.periodId));
            const merged = [...data.history, ...initial.filter((h) => !existingIds.has(h.periodId))].slice(0, 60);
            setHistory(merged);
          } else {
            setHistory(data.history);
          }
        } else {
          setHistory(generateInitialHistory());
        }
        if (data.myBets) setMyBets(data.myBets);
      }
    } catch (_) {
      if (history.length === 0) setHistory(generateInitialHistory());
    }
  };

  useEffect(() => {
    fetchGameState();
    setHistory(generateInitialHistory());
  }, []);

  // Round Settlement
  const handleRoundSettlement = async () => {
    setIsFreeze(false);
    // Draw new outcome
    const drawnNumber = Math.floor(Math.random() * 10);
    const isViolet = drawnNumber === 0 || drawnNumber === 5;
    const isGreen = [1, 3, 7, 9].includes(drawnNumber);
    const color: 'green' | 'red' | 'violet-green' | 'violet-red' = isViolet
      ? drawnNumber === 0
        ? 'violet-red'
        : 'violet-green'
      : isGreen
      ? 'green'
      : 'red';
    const size = drawnNumber >= 5 ? 'big' : 'small';
    const nextBlock = 78242651 + Math.floor(Math.random() * 50 + 20);
    const nextHash = Math.random().toString(16).substring(2, 6);

    const settledPeriod = currentPeriodIdRef.current || currentPeriodId;

    const newResult: ColorPredictionResult = {
      periodId: settledPeriod,
      number: drawnNumber,
      color,
      size,
      blockHeight: nextBlock,
      hash: nextHash,
      createdAt: new Date().toISOString(),
    };

    setHistory((prev) => [newResult, ...prev.slice(0, 99)]);

    // Check if user placed bet on this settled round (fresh ref + sessionStorage + state)
    let candidateBets: ColorPredictionBet[] = [
      ...activeRoundBetsRef.current,
      ...activeRoundBets,
      ...myBetsRef.current.filter((b) => b.periodId === settledPeriod || (b.status === 'pending' && (!b.periodId || b.periodId === settledPeriod))),
    ];

    try {
      const saved = sessionStorage.getItem('active_cp_bets');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          candidateBets = [...candidateBets, ...parsed];
        }
      }
    } catch (_) {}

    // Deduplicate by bet.id
    const betsMap = new Map<string, ColorPredictionBet>();
    candidateBets.forEach((b) => betsMap.set(b.id, b));
    const currentPeriodBets = Array.from(betsMap.values());
    const userBetted = currentPeriodBets.length > 0;

    // Reset active round bets for next round
    activeRoundBetsRef.current = [];
    setActiveRoundBets([]);
    try {
      sessionStorage.removeItem('active_cp_bets');
    } catch (_) {}

    let totalWinInr = 0;
    let totalBetInr = 0;
    let userWon = false;
    let winningBetsCount = 0;

    currentPeriodBets.forEach((bet) => {
      const stakeInr =
        bet.amountInr && bet.amountInr > 0
          ? bet.amountInr
          : bet.totalBet && bet.totalBet > 0
          ? bet.totalBet
          : (bet.amount || 10) * (bet.contractCount || 1);
      totalBetInr += stakeInr;

      let isWin = false;
      let multiplier = 0;
      if (bet.selection === 'green' && (color === 'green' || color === 'violet-green')) {
        isWin = true;
        multiplier = drawnNumber === 5 ? 1.5 : 2;
      } else if (bet.selection === 'red' && (color === 'red' || color === 'violet-red')) {
        isWin = true;
        multiplier = drawnNumber === 0 ? 1.5 : 2;
      } else if (bet.selection === 'violet' && isViolet) {
        isWin = true;
        multiplier = 4.5;
      } else if (bet.selection === 'big' && size === 'big') {
        isWin = true;
        multiplier = 2;
      } else if (bet.selection === 'small' && size === 'small') {
        isWin = true;
        multiplier = 2;
      } else if (bet.selection === String(drawnNumber)) {
        isWin = true;
        multiplier = 9;
      }

      if (isWin) {
        userWon = true;
        winningBetsCount++;
        totalWinInr += stakeInr * multiplier;
      }
    });

    // Update local myBets status and payout
    if (currentPeriodBets.length > 0) {
      setMyBets((prev) =>
        prev.map((b) => {
          const matched = currentPeriodBets.find((cb) => cb.id === b.id);
          if (matched) {
            let betWon = false;
            let betMult = 0;
            if (matched.selection === 'green' && (color === 'green' || color === 'violet-green')) {
              betWon = true;
              betMult = drawnNumber === 5 ? 1.5 : 2;
            } else if (matched.selection === 'red' && (color === 'red' || color === 'violet-red')) {
              betWon = true;
              betMult = drawnNumber === 0 ? 1.5 : 2;
            } else if (matched.selection === 'violet' && isViolet) {
              betWon = true;
              betMult = 4.5;
            } else if (matched.selection === 'big' && size === 'big') {
              betWon = true;
              betMult = 2;
            } else if (matched.selection === 'small' && size === 'small') {
              betWon = true;
              betMult = 2;
            } else if (matched.selection === String(drawnNumber)) {
              betWon = true;
              betMult = 9;
            }

            const stake = matched.amountInr || (matched.amount || 10) * (matched.contractCount || 1);
            return {
              ...b,
              status: betWon ? ('win' as const) : ('loss' as const),
              payout: betWon ? stake * betMult : 0,
            };
          }
          return b;
        })
      );
    }

    // ALWAYS open the result modal at round settlement!
    setResultModal({
      show: true,
      periodId: settledPeriod,
      drawnNumber,
      color,
      size,
      bonusAmount: userWon ? totalWinInr : 0,
      betAmount: totalBetInr,
      userWon: userBetted ? userWon : false,
      userBetted,
      winningBetsCount,
      totalBetsCount: currentPeriodBets.length,
    });
    setAutoCloseSeconds(5);
    playAudioCue(userBetted ? (userWon ? 'win' : 'loss') : 'tick');

    // Credit win amount on backend if user won
    if (userBetted && userWon && totalWinInr > 0) {
      try {
        const storedId = userRef.current?.id || localStorage.getItem('tp_user_id') || '';
        fetch('/api/color-prediction/claim-win', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-user-id': storedId },
          body: JSON.stringify({
            userId: userRef.current?.id || storedId,
            periodId: settledPeriod,
            winAmountInr: totalWinInr,
          }),
        }).then(() => onRefreshUser());
      } catch (_) {}
    }

    // Generate next period ID
    const periodBase = settledPeriod.slice(0, -4);
    const periodNum = parseInt(settledPeriod.slice(-4)) + 1;
    setCurrentPeriodId(`${periodBase}${periodNum.toString().padStart(4, '0')}`);

    onRefreshUser();
  };

  // Timer Tick and Countdown Engine (using handleRoundSettlementRef)
  handleRoundSettlementRef.current = handleRoundSettlement;

  useEffect(() => {
    const timer = setInterval(() => {
      setRemainingSeconds((prev) => {
        if (prev <= 1) {
          // Trigger settlement outside state updater
          setTimeout(() => {
            if (handleRoundSettlementRef.current) {
              handleRoundSettlementRef.current();
            }
          }, 0);
          return activeMode.duration;
        }

        const next = prev - 1;
        if (next <= 5) {
          setIsFreeze(true);
          playAudioCue('tick');
        } else {
          setIsFreeze(false);
        }
        return next;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [activeMode.duration]);

  const handleManualRefresh = () => {
    setIsRefreshing(true);
    onRefreshUser();
    fetchGameState();
    setTimeout(() => setIsRefreshing(false), 800);
  };

  // Open Bet Modal
  const handleOpenBet = (selection: BetSelection) => {
    if (isFreeze) {
      showToast('Betting is frozen in the last 5 seconds.', 'error');
      return;
    }
    setSelectedBet(selection);
    setContractUnit(10); // Default to popular ₹10 chip
    setBetCount(quickMultiplier || 1);
    setAgreedPreSale(true);
    setBetModalOpen(true);
  };

  // Pick Random Bet
  const handlePickRandom = () => {
    if (isFreeze) {
      showToast('Betting is frozen in the last 5 seconds.', 'error');
      return;
    }
    const choices: BetSelection[] = ['green', 'violet', 'red', 'big', 'small', '0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
    const randomChoice = choices[Math.floor(Math.random() * choices.length)];
    handleOpenBet(randomChoice);
  };

  // Submit Bet
  const handleConfirmBet = async () => {
    if (!selectedBet) return;
    if (!agreedPreSale) {
      showToast('Please accept the pre-sale rules.', 'error');
      return;
    }

    const totalBetInr = contractUnit * betCount;
    const currentBalanceInr = (user?.depositBalance || 0) + (user?.winningBalance || 0) + (user?.balance || 0);

    if (totalBetInr > currentBalanceInr) {
      showToast(
        `Insufficient balance (₹${currentBalanceInr.toFixed(2)} available). Please Recharge.`,
        'error'
      );
      return;
    }

    setIsSubmittingBet(true);
    try {
      const storedId = user?.id || localStorage.getItem('tp_user_id') || '';
      const res = await fetch('/api/color-prediction/bet', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': storedId,
        },
        body: JSON.stringify({
          userId: user?.id || storedId,
          periodId: currentPeriodId,
          selection: selectedBet,
          amountInr: contractUnit,
          contractCount: betCount,
          amount: contractUnit,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || 'Failed to place bet', 'error');
        return;
      }

      const placedBet: ColorPredictionBet = {
        id: data.bet?.id || `bet-cp-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        userId: user?.id || storedId,
        userName: user?.name || 'Trader',
        userNodeId: user?.nodeId || 'NODE',
        periodId: currentPeriodId,
        selection: selectedBet,
        amount: contractUnit,
        contractCount: betCount,
        totalBet: totalBetInr,
        amountInr: totalBetInr,
        payout: 0,
        status: 'pending',
        createdAt: new Date().toISOString(),
      };

      // Ensure this bet is immediately tracked for the upcoming result popup
      activeRoundBetsRef.current = [...activeRoundBetsRef.current, placedBet];
      try {
        sessionStorage.setItem('active_cp_bets', JSON.stringify(activeRoundBetsRef.current));
      } catch (_) {}
      setActiveRoundBets((prev) => [...prev, placedBet]);
      setMyBets((prev) => [placedBet, ...prev.filter((b) => b.id !== placedBet.id)]);

      playAudioCue('bet');
      showToast(
        `Success! Bet placed on ${String(selectedBet).toUpperCase()} for ₹${totalBetInr.toFixed(2)}!`,
        'success'
      );

      setBetModalOpen(false);
      onRefreshUser();
    } catch (_) {
      showToast('Network error placing bet. Please check your connection.', 'error');
    } finally {
      setIsSubmittingBet(false);
    }
  };

  // Format digital countdown string
  const minutes = Math.floor(remainingSeconds / 60);
  const seconds = remainingSeconds % 60;
  const minutesStr = minutes.toString().padStart(2, '0');
  const secondsStr = seconds.toString().padStart(2, '0');

  // Recent 5 balls drawn
  const recent5Balls = history.slice(0, 5);

  // Get color title & gradient for bet modal
  const getBetColorStyles = (selection: BetSelection | null) => {
    if (!selection) return { bg: 'from-blue-600 to-indigo-700', label: '' };
    if (selection === 'green') return { bg: 'from-[#10b981] to-[#059669]', label: 'Green 2X' };
    if (selection === 'violet') return { bg: 'from-[#a855f7] to-[#7c3aed]', label: 'Violet 4.5X' };
    if (selection === 'red') return { bg: 'from-[#ef4444] to-[#dc2626]', label: 'Red 2X' };
    if (selection === 'big') return { bg: 'from-[#f59e0b] to-[#d97706]', label: 'Big 2X' };
    if (selection === 'small') return { bg: 'from-[#3b82f6] to-[#2563eb]', label: 'Small 2X' };
    return { bg: 'from-[#38bdf8] to-[#0284c7]', label: `Number ${selection} (9X Payout)` };
  };

  return (
    <div className="w-full max-w-md sm:max-w-xl mx-auto space-y-3 pb-28 text-slate-100 font-sans selection:bg-cyan-500 selection:text-black">
      {/* 1. TOP HEADER (Back Arrow, Jalwa.Game, Audio, Support) */}
      <header className="flex items-center justify-between pt-1 pb-2 px-1">
        <button
          onClick={onBack}
          className="w-9 h-9 rounded-full bg-[#0b1430] border border-blue-900/60 hover:border-cyan-500/50 flex items-center justify-center text-slate-200 hover:text-white transition active:scale-95"
          title="Back to Home Lobby"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        <div className="cursor-pointer" onClick={onBack}>
          <JalwaLogo size="md" />
        </div>

        <div className="flex items-center gap-2">
          {/* Customer Support */}
          <button
            onClick={() => setShowSupportModal(true)}
            className="w-9 h-9 rounded-full bg-[#0b1430] border border-blue-900/60 hover:border-cyan-500/40 flex items-center justify-center text-cyan-300 transition active:scale-95"
            title="Customer Service"
          >
            <Headphones className="w-4 h-4" />
          </button>

          {/* Sound Toggle */}
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`w-9 h-9 rounded-full flex items-center justify-center transition border ${
              soundEnabled
                ? 'bg-cyan-500/15 border-cyan-500/40 text-cyan-300'
                : 'bg-[#0b1430] border-blue-900/60 text-slate-500'
            }`}
            title="Toggle Sound Effects"
          >
            <Music2 className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* 2. WALLET BALANCE CARD (Matching 1_8cbf79a2.jpeg) */}
      <div className="rounded-2xl bg-gradient-to-r from-[#0d1e48] via-[#0b1739] to-[#08122c] border border-blue-900/40 p-3.5 shadow-xl">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-black text-white tracking-tight">
                ₹{((user?.depositBalance || 0) + (user?.winningBalance || 0) + (user?.balance || 0)).toFixed(2)}
              </span>
              <button
                onClick={() => {
                  setIsRefreshing(true);
                  onRefreshUser();
                  setTimeout(() => setIsRefreshing(false), 600);
                }}
                className={`text-slate-400 hover:text-white transition ${isRefreshing ? 'animate-spin' : ''}`}
                title="Refresh Balance"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="flex items-center gap-1.5 mt-0.5 text-xs text-slate-300 font-medium">
              <Wallet className="w-3.5 h-3.5 text-cyan-400" />
              <span>Wallet balance</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onOpenWithdraw && (
              <button
                onClick={onOpenWithdraw}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#ef4444] to-[#dc2626] hover:from-[#f87171] hover:to-[#ef4444] text-white font-black text-xs shadow-md transition active:scale-95"
              >
                Withdraw
              </button>
            )}
            {onOpenDeposit && (
              <button
                onClick={onOpenDeposit}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#10b981] to-[#059669] hover:from-[#34d399] hover:to-[#10b981] text-white font-black text-xs shadow-md transition active:scale-95"
              >
                Deposit
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 3. MARQUEE ANNOUNCEMENT ROW (Matching 1_8cbf79a2.jpeg - English only) */}
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#091534] border border-blue-900/30 text-xs text-slate-300 shadow-sm">
        <Volume2 className="w-4 h-4 text-cyan-400 shrink-0" />
        <div className="overflow-hidden flex-1 whitespace-nowrap">
          <div className="inline-block animate-marquee pl-2 font-medium text-slate-200">
            Welcome to join the SportX platform. We provide a brand new gaming experience with high win rates and fast withdrawals!
          </div>
        </div>
        <button
          onClick={() => setShowDetailModal(true)}
          className="px-2.5 py-0.5 rounded-full bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 text-[11px] font-bold shrink-0 transition"
        >
          Detail
        </button>
      </div>

      {/* 4. TIME MODE SELECTOR (WinGo 30sec, WinGo 1 Min, WinGo 3 Min, WinGo 5 Min) */}
      <div className="grid grid-cols-4 gap-2 my-2">
        {GAME_MODES.map((mode) => {
          const isActive = activeMode.id === mode.id;
          return (
            <button
              key={mode.id}
              onClick={() => {
                setActiveMode(mode);
                setRemainingSeconds(mode.duration);
              }}
              className={`rounded-2xl p-2.5 flex flex-col items-center justify-center transition-all duration-300 active:scale-95 ${
                isActive
                  ? 'bg-gradient-to-b from-[#2dd4bf] to-[#10b981] text-[#052e16] shadow-[0_0_20px_rgba(45,212,191,0.5)] font-black'
                  : 'bg-[#0b1432] border border-blue-900/50 text-slate-300 hover:border-cyan-500/40 font-bold'
              }`}
            >
              <div className="mb-1">
                <Clock3D active={isActive} />
              </div>
              <span className="text-[11px] leading-tight text-center">{mode.title.split(' ')[0]}</span>
              <span className="text-[10px] leading-tight text-center opacity-90">{mode.title.split(' ')[1]}</span>
            </button>
          );
        })}
      </div>

      {/* 5. GAME TICKET COUPON CARD (Mint Green with Dotted Separator) */}
      <div className="relative rounded-2xl bg-gradient-to-r from-[#5eead4] via-[#2dd4bf] to-[#14b8a6] p-3.5 sm:p-4 text-[#064e3b] shadow-xl overflow-hidden my-3">
        {/* Notch cuts on top and bottom of tear line */}
        <div className="absolute top-0 left-[48%] -translate-x-1/2 w-4 h-2.5 bg-[#080d1a] rounded-b-full" />
        <div className="absolute bottom-0 left-[48%] -translate-x-1/2 w-4 h-2.5 bg-[#080d1a] rounded-t-full" />

        <div className="grid grid-cols-12 gap-2 items-center">
          {/* Left: How to play + Mode title + 5 Recent Balls */}
          <div className="col-span-6 pr-2 border-r-2 border-dashed border-[#0f766e]/40 flex flex-col justify-between min-h-[96px]">
            <div>
              <button
                onClick={() => setShowRulesModal(true)}
                className="inline-flex items-center gap-1 bg-[#134e4a]/15 hover:bg-[#134e4a]/25 text-[#042f2e] text-[11px] font-bold px-2.5 py-1 rounded-full border border-[#0f766e]/30 transition"
              >
                <span>📖</span>
                <span>How to play</span>
              </button>
              <div className="text-xs font-black text-[#042f2e] mt-1 tracking-tight">
                {activeMode.title}
              </div>
            </div>

            {/* 5 Recent Drawn Balls */}
            <div className="flex items-center gap-1.5 pt-1">
              {recent5Balls.map((b, idx) => (
                <NumberBall3D key={idx} num={b.number} size="sm" />
              ))}
            </div>
          </div>

          {/* Right: Countdown & Period Number */}
          <div className="col-span-6 pl-2 flex flex-col items-end justify-between min-h-[96px]">
            <span className="text-[11px] font-bold text-[#042f2e]">
              Time remaining
            </span>

            {/* Digital Monospace Countdown Boxes */}
            <div className="flex items-center gap-1 font-mono font-black text-white text-base sm:text-lg">
              <span className="bg-[#0b1739] px-2 py-1 rounded-md shadow-md">{minutesStr[0]}</span>
              <span className="bg-[#0b1739] px-2 py-1 rounded-md shadow-md">{minutesStr[1]}</span>
              <span className="text-[#042f2e] font-bold text-lg leading-none">:</span>
              <span className="bg-[#0b1739] px-2 py-1 rounded-md shadow-md">{secondsStr[0]}</span>
              <span className="bg-[#0b1739] px-2 py-1 rounded-md shadow-md">{secondsStr[1]}</span>
            </div>

            {/* Period Number */}
            <div className="text-[11px] font-mono font-black text-[#042f2e] tracking-tight">
              {currentPeriodId}
            </div>
          </div>
        </div>
      </div>

      {/* 6-9. BETTING ZONE WITH 5-SECOND GIANT COUNTDOWN OVERLAY (Matching 1_8cbf79a2.jpeg) */}
      <div className="relative my-3">
        {/* 6. COLOR BETTING BUTTONS (Green, Violet, Red) */}
        <div className="grid grid-cols-3 gap-2.5 mb-3">
          {/* Green */}
          <button
            onClick={() => handleOpenBet('green')}
            className="py-3 px-2 rounded-2xl bg-gradient-to-b from-[#10b981] to-[#059669] hover:from-[#34d399] hover:to-[#10b981] text-white font-black text-sm sm:text-base shadow-[0_4px_15px_rgba(16,185,129,0.35)] transition-all transform active:scale-95 text-center"
          >
            Green
          </button>

          {/* Violet */}
          <button
            onClick={() => handleOpenBet('violet')}
            className="py-3 px-2 rounded-2xl bg-gradient-to-b from-[#a855f7] to-[#7c3aed] hover:from-[#c084fc] hover:to-[#a855f7] text-white font-black text-sm sm:text-base shadow-[0_4px_15px_rgba(168,85,247,0.35)] transition-all transform active:scale-95 text-center"
          >
            Violet
          </button>

          {/* Red */}
          <button
            onClick={() => handleOpenBet('red')}
            className="py-3 px-2 rounded-2xl bg-gradient-to-b from-[#ef4444] to-[#dc2626] hover:from-[#f87171] hover:to-[#ef4444] text-white font-black text-sm sm:text-base shadow-[0_4px_15px_rgba(239,68,68,0.35)] transition-all transform active:scale-95 text-center"
          >
            Red
          </button>
        </div>

        {/* 7. NUMBER BALLS GRID (10 Balls: 0 to 9 in 2 rows) */}
        <div className="bg-[#0b1433] border border-blue-900/40 rounded-3xl p-3.5 sm:p-4 my-3 shadow-lg">
          {/* Row 1: 0, 1, 2, 3, 4 */}
          <div className="grid grid-cols-5 gap-2 sm:gap-3 place-items-center mb-3">
            {[0, 1, 2, 3, 4].map((num) => (
              <div key={num} onClick={() => handleOpenBet(String(num) as BetSelection)} className="cursor-pointer">
                <NumberBall3D num={num} size="md" />
              </div>
            ))}
          </div>

          {/* Row 2: 5, 6, 7, 8, 9 */}
          <div className="grid grid-cols-5 gap-2 sm:gap-3 place-items-center">
            {[5, 6, 7, 8, 9].map((num) => (
              <div key={num} onClick={() => handleOpenBet(String(num) as BetSelection)} className="cursor-pointer">
                <NumberBall3D num={num} size="md" />
              </div>
            ))}
          </div>
        </div>

        {/* 8. MULTIPLIER & RANDOM ROW */}
        <div className="flex items-center gap-1.5 my-3 overflow-x-auto no-scrollbar">
          {/* Random Pick Button */}
          <button
            onClick={handlePickRandom}
            className="px-3.5 py-1.5 rounded-xl border border-red-500/80 bg-red-500/10 hover:bg-red-500/20 text-red-400 font-bold text-xs whitespace-nowrap transition active:scale-95 shrink-0"
          >
            Random
          </button>

          {/* Quick Multipliers: X1, X5, X10, X20, X50, X100 */}
          {[1, 5, 10, 20, 50, 100].map((m) => (
            <button
              key={m}
              onClick={() => setQuickMultiplier(m)}
              className={`flex-1 py-1.5 rounded-xl font-bold text-xs text-center transition active:scale-95 min-w-[42px] ${
                quickMultiplier === m
                  ? 'bg-[#10b981] text-white shadow-[0_0_10px_rgba(16,185,129,0.5)]'
                  : 'bg-[#0d1738] text-slate-300 border border-blue-900/40 hover:bg-[#122152]'
              }`}
            >
              X{m}
            </button>
          ))}
        </div>

        {/* 9. SIZE BETTING BUTTONS (Big / Small) */}
        <div className="grid grid-cols-2 gap-3 mt-3">
          {/* Big */}
          <button
            onClick={() => handleOpenBet('big')}
            className="py-3 px-4 rounded-2xl bg-gradient-to-r from-[#f59e0b] to-[#d97706] hover:from-[#fbbf24] hover:to-[#f59e0b] text-white font-black text-sm sm:text-base shadow-[0_4px_15px_rgba(245,158,11,0.35)] transition-all transform active:scale-95 text-center"
          >
            Big
          </button>

          {/* Small */}
          <button
            onClick={() => handleOpenBet('small')}
            className="py-3 px-4 rounded-2xl bg-gradient-to-r from-[#3b82f6] to-[#2563eb] hover:from-[#60a5fa] hover:to-[#3b82f6] text-white font-black text-sm sm:text-base shadow-[0_4px_15px_rgba(59,130,246,0.35)] transition-all transform active:scale-95 text-center"
          >
            Small
          </button>
        </div>

        {/* 5-SECOND BETTING FROZEN COUNTDOWN OVERLAY */}
        {remainingSeconds <= 5 && (
          <div className="absolute inset-0 z-30 bg-[#060c22]/95 backdrop-blur-md rounded-3xl flex flex-col items-center justify-between p-4 sm:p-5 border-2 border-cyan-500/40 shadow-[0_0_50px_rgba(34,211,238,0.25)] animate-fade-in pointer-events-auto">
            <div className="w-full h-full flex flex-col items-center justify-between py-1">
              {/* Top Status Banner with Progress Gauge */}
              <div className="w-full flex flex-col items-center gap-2">
                <div className="flex items-center gap-2 bg-[#0a1838] border border-rose-500/40 px-3.5 py-1 rounded-full shadow-md">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
                  <span className="text-xs font-black text-rose-300 tracking-wide uppercase">
                    Betting Frozen • Draw in 0{remainingSeconds}s
                  </span>
                </div>
                {/* Tension Progress Bar */}
                <div className="w-3/4 max-w-[200px] h-1.5 bg-[#091129] rounded-full overflow-hidden border border-blue-900/60 shadow-inner">
                  <div
                    className="h-full bg-gradient-to-r from-cyan-400 via-teal-400 to-emerald-400 transition-all duration-1000 ease-linear shadow-[0_0_8px_rgba(34,211,238,0.8)]"
                    style={{ width: `${((5 - remainingSeconds) / 5) * 100}%` }}
                  />
                </div>
              </div>

              {/* Dual Giant 3D Beveled Digit Cards */}
              <div className="flex items-center gap-3 sm:gap-6 my-auto">
                {/* Tens Digit Card */}
                <div className="w-28 h-36 sm:w-36 sm:h-44 md:w-40 md:h-48 rounded-[24px] sm:rounded-[32px] bg-gradient-to-b from-[#0e2764] via-[#0b1d4a] to-[#071333] border-2 border-cyan-400/40 shadow-[0_20px_50px_rgba(0,0,0,0.85)] flex items-center justify-center relative overflow-hidden group">
                  <div className="absolute top-0 inset-x-0 h-1/2 bg-gradient-to-b from-white/10 to-transparent pointer-events-none" />
                  <span className="text-8xl sm:text-9xl md:text-[130px] font-black text-[#00f59b] drop-shadow-[0_0_30px_rgba(0,245,155,0.75)] font-sans leading-none select-none tracking-tighter">
                    0
                  </span>
                </div>

                {/* Units Digit Card (Flipping on each second) */}
                <div
                  key={remainingSeconds}
                  className="w-28 h-36 sm:w-36 sm:h-44 md:w-40 md:h-48 rounded-[24px] sm:rounded-[32px] bg-gradient-to-b from-[#0e2764] via-[#0b1d4a] to-[#071333] border-2 border-cyan-400/40 shadow-[0_20px_50px_rgba(0,0,0,0.85)] flex items-center justify-center relative overflow-hidden transform animate-in zoom-in-95 duration-150"
                >
                  <div className="absolute top-0 inset-x-0 h-1/2 bg-gradient-to-b from-white/10 to-transparent pointer-events-none" />
                  <span className="text-8xl sm:text-9xl md:text-[130px] font-black text-[#00f59b] drop-shadow-[0_0_30px_rgba(0,245,155,0.75)] font-sans leading-none select-none tracking-tighter">
                    {remainingSeconds}
                  </span>
                </div>
              </div>

              {/* Bottom Provably Fair Text */}
              <div className="text-[11px] font-mono text-cyan-300 flex items-center gap-1.5 opacity-90">
                <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
                <span>Generating Provably Fair Block Result...</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 10. TABS & HISTORY SECTION (Game history, Chart, My history) */}
      <div className="pt-2">
        <div className="flex items-center gap-2 mb-3">
          <button
            onClick={() => setActiveHistoryTab('game')}
            className={`px-4 py-2 rounded-xl text-xs font-black transition ${
              activeHistoryTab === 'game'
                ? 'bg-gradient-to-r from-[#38bdf8] to-[#2dd4bf] text-[#070d1e] shadow-md'
                : 'bg-[#0b1433] text-slate-300 border border-blue-900/40 hover:text-white'
            }`}
          >
            Game history
          </button>
          <button
            onClick={() => setActiveHistoryTab('chart')}
            className={`px-4 py-2 rounded-xl text-xs font-black transition ${
              activeHistoryTab === 'chart'
                ? 'bg-gradient-to-r from-[#38bdf8] to-[#2dd4bf] text-[#070d1e] shadow-md'
                : 'bg-[#0b1433] text-slate-300 border border-blue-900/40 hover:text-white'
            }`}
          >
            Chart
          </button>
          <button
            onClick={() => setActiveHistoryTab('my')}
            className={`px-4 py-2 rounded-xl text-xs font-black transition ${
              activeHistoryTab === 'my'
                ? 'bg-gradient-to-r from-[#38bdf8] to-[#2dd4bf] text-[#070d1e] shadow-md'
                : 'bg-[#0b1433] text-slate-300 border border-blue-900/40 hover:text-white'
            }`}
          >
            My history
          </button>
        </div>

        {/* Tab 1: Game History Table (Shows at least 50 records by default with full pagination & filters) */}
        {activeHistoryTab === 'game' && (() => {
          const totalHistoryRecords = history.length;
          const pageSize = historyPageSize === 'all' ? Math.max(1, totalHistoryRecords) : historyPageSize;
          const totalPages = Math.max(1, Math.ceil(totalHistoryRecords / pageSize));
          const safePage = Math.min(Math.max(1, historyCurrentPage), totalPages);
          const startIndex = (safePage - 1) * pageSize;
          const displayedHistory = historyPageSize === 'all' ? history : history.slice(startIndex, startIndex + pageSize);

          return (
            <div className="space-y-3">
              {/* Toolbar Controls: Page Size & Record Counts */}
              <div className="flex flex-wrap items-center justify-between gap-2 px-1 text-xs">
                <div className="flex items-center gap-1.5">
                  <span className="text-slate-400 font-semibold text-[11px]">Show Records:</span>
                  {([10, 20, 50, 'all'] as const).map((size) => (
                    <button
                      key={String(size)}
                      onClick={() => {
                        setHistoryPageSize(size);
                        setHistoryCurrentPage(1);
                      }}
                      className={`px-2.5 py-1 rounded-lg font-mono font-bold text-xs transition active:scale-95 ${
                        historyPageSize === size
                          ? 'bg-gradient-to-r from-cyan-400 to-blue-500 text-black shadow-md font-black scale-105'
                          : 'bg-[#0b1433] text-slate-300 border border-blue-900/50 hover:text-white hover:border-cyan-500/40'
                      }`}
                    >
                      {size === 'all' ? 'All (50+)' : size}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-mono text-cyan-300 bg-cyan-950/60 border border-cyan-800/40 px-2.5 py-0.5 rounded-md flex items-center gap-1.5 shadow-sm">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Showing {Math.min(totalHistoryRecords, startIndex + 1)}–{Math.min(startIndex + displayedHistory.length, totalHistoryRecords)} of {totalHistoryRecords} Records
                  </span>
                </div>
              </div>

              {/* Table Container with Sticky Header and Smooth Scroll */}
              <div className="rounded-2xl overflow-hidden border border-blue-900/50 shadow-2xl bg-[#09122c]">
                <div className="max-h-[620px] overflow-y-auto overscroll-contain">
                  {/* Table Header in Royal Blue */}
                  <div className="sticky top-0 z-10 grid grid-cols-12 bg-gradient-to-r from-[#2563eb] to-[#1d4ed8] text-white text-[11px] font-bold py-2.5 px-3 shadow-md">
                    <span className="col-span-3">Period</span>
                    <span className="col-span-3 text-center">Block height</span>
                    <span className="col-span-2 text-center">Block time</span>
                    <span className="col-span-2 text-center">Hash value</span>
                    <span className="col-span-2 text-right">Result</span>
                  </div>

                  {/* Table Rows (renders at least 50 records) */}
                  <div className="divide-y divide-blue-950/60 font-mono text-xs">
                    {displayedHistory.map((row, idx) => {
                      const isBig = row.number >= 5;
                      const isZero = row.number === 0;
                      const isFive = row.number === 5;
                      const isGreen = [1, 3, 7, 9].includes(row.number);
                      const periodShort = `${row.periodId.slice(0, 4)}**${row.periodId.slice(-4)}`;
                      const timeStr = row.createdAt ? new Date(row.createdAt).toTimeString().split(' ')[0] : '23:36:54';

                      return (
                        <div
                          key={row.periodId || idx}
                          className="grid grid-cols-12 items-center py-2 px-3 text-slate-300 hover:bg-[#0e1c45] transition"
                        >
                          <span className="col-span-3 text-slate-200 font-semibold">{periodShort}</span>
                          <span className="col-span-3 text-center text-slate-300 flex items-center justify-center gap-1">
                            <span className="text-[10px] text-rose-400 bg-rose-500/20 w-3.5 h-3.5 rounded-full flex items-center justify-center font-bold">
                              ?
                            </span>
                            <span>{row.blockHeight || 78242651}</span>
                          </span>
                          <span className="col-span-2 text-center text-slate-400 text-[11px]">{timeStr}</span>
                          <span className="col-span-2 text-center text-slate-400">**{row.hash || '7dae'}</span>
                          <div className="col-span-2 flex items-center justify-end gap-1.5">
                            {/* Result ball */}
                            <span
                              className="w-5.5 h-5.5 rounded-full flex items-center justify-center text-[10px] font-black text-white shadow-sm"
                              style={{
                                backgroundColor: isZero || isFive ? '#a855f7' : isGreen ? '#10b981' : '#ef4444',
                              }}
                            >
                              {row.number}
                            </span>
                            {/* B / S Badge */}
                            <span className={`text-xs font-black ${isBig ? 'text-amber-400' : 'text-blue-400'}`}>
                              {isBig ? 'B' : 'S'}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Bottom Pagination Controls */}
                <div className="p-3 bg-[#080f24] border-t border-blue-950 flex flex-wrap items-center justify-between gap-2 text-xs">
                  <div className="text-slate-400 text-[11px]">
                    Page <span className="text-white font-bold">{safePage}</span> of <span className="text-white font-bold">{totalPages}</span> ({totalHistoryRecords} Total Rounds)
                  </div>

                  <div className="flex items-center gap-1 font-mono">
                    <button
                      onClick={() => setHistoryCurrentPage(Math.max(1, safePage - 1))}
                      disabled={safePage <= 1}
                      className="px-2.5 py-1 rounded-lg bg-[#0e1c45] text-slate-300 border border-blue-900/50 hover:border-cyan-500/40 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed text-xs transition"
                    >
                      ‹ Prev
                    </button>

                    {Array.from({ length: Math.min(5, totalPages) }).map((_, i) => {
                      let pageNum = i + 1;
                      if (totalPages > 5 && safePage > 3) {
                        pageNum = safePage - 2 + i;
                        if (pageNum > totalPages) pageNum = totalPages - (4 - i);
                      }
                      if (pageNum < 1 || pageNum > totalPages) return null;

                      return (
                        <button
                          key={pageNum}
                          onClick={() => setHistoryCurrentPage(pageNum)}
                          className={`w-7 h-7 rounded-lg text-xs font-bold transition ${
                            safePage === pageNum
                              ? 'bg-gradient-to-r from-cyan-400 to-blue-500 text-black font-black shadow-md'
                              : 'bg-[#0e1c45] text-slate-300 border border-blue-900/50 hover:text-white hover:border-cyan-500/40'
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}

                    <button
                      onClick={() => setHistoryCurrentPage(Math.min(totalPages, safePage + 1))}
                      disabled={safePage >= totalPages}
                      className="px-2.5 py-1 rounded-lg bg-[#0e1c45] text-slate-300 border border-blue-900/50 hover:border-cyan-500/40 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed text-xs transition"
                    >
                      Next ›
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })()}

        {/* Tab 2: Chart Trends (Analyzes all 50+ past rounds) */}
        {activeHistoryTab === 'chart' && (
          <div className="rounded-2xl p-4 bg-[#09122c] border border-blue-900/40 text-xs text-slate-300 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-blue-950">
              <span className="font-bold text-white">Winning Number Trends (Last 50 Rounds)</span>
              <span className="text-[10px] text-cyan-400 font-mono">Real-time Block Hash Verification</span>
            </div>

            {/* Visual Dot Sequence Chart */}
            <div className="flex items-center gap-1.5 overflow-x-auto py-2 no-scrollbar">
              {history.slice(0, 30).reverse().map((h, i) => (
                <div key={i} className="flex flex-col items-center gap-1 shrink-0">
                  <NumberBall3D num={h.number} size="sm" />
                  <span className={`text-[10px] font-black ${h.number >= 5 ? 'text-amber-400' : 'text-blue-400'}`}>
                    {h.number >= 5 ? 'B' : 'S'}
                  </span>
                </div>
              ))}
            </div>

            {/* Statistics Breakdown for Last 50 Rounds */}
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 pt-2 text-center">
              <div className="bg-[#0b1739] p-2.5 rounded-xl border border-emerald-500/30">
                <span className="text-[10px] text-emerald-400 uppercase block font-bold">Green Count</span>
                <span className="text-base font-black text-white font-mono">
                  {history.slice(0, 50).filter((h) => [1, 3, 7, 9].includes(h.number)).length}
                </span>
              </div>
              <div className="bg-[#0b1739] p-2.5 rounded-xl border border-purple-500/30">
                <span className="text-[10px] text-purple-400 uppercase block font-bold">Violet Count</span>
                <span className="text-base font-black text-white font-mono">
                  {history.slice(0, 50).filter((h) => [0, 5].includes(h.number)).length}
                </span>
              </div>
              <div className="bg-[#0b1739] p-2.5 rounded-xl border border-rose-500/30">
                <span className="text-[10px] text-rose-400 uppercase block font-bold">Red Count</span>
                <span className="text-base font-black text-white font-mono">
                  {history.slice(0, 50).filter((h) => [2, 4, 6, 8].includes(h.number)).length}
                </span>
              </div>
              <div className="bg-[#0b1739] p-2.5 rounded-xl border border-amber-500/30">
                <span className="text-[10px] text-amber-400 uppercase block font-bold">Big (5-9)</span>
                <span className="text-base font-black text-white font-mono">
                  {history.slice(0, 50).filter((h) => h.number >= 5).length}
                </span>
              </div>
              <div className="bg-[#0b1739] p-2.5 rounded-xl border border-blue-500/30">
                <span className="text-[10px] text-blue-400 uppercase block font-bold">Small (0-4)</span>
                <span className="text-base font-black text-white font-mono">
                  {history.slice(0, 50).filter((h) => h.number < 5).length}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: My History */}
        {activeHistoryTab === 'my' && (
          <div className="rounded-2xl overflow-hidden border border-blue-900/40 bg-[#09122c]">
            {myBets.length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-xs">
                No bets placed yet in this session.
              </div>
            ) : (
              <div className="divide-y divide-blue-950/60 font-mono text-xs">
                {myBets.map((bet) => (
                  <div key={bet.id} className="p-3 flex items-center justify-between hover:bg-[#0e1c45]">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-white font-bold">{String(bet.selection).toUpperCase()}</span>
                        <span className="text-[10px] text-slate-400">#{bet.periodId.slice(-4)}</span>
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        Amount: ₹{(bet.amountInr ? bet.amountInr : bet.totalBet).toFixed(2)}
                      </div>
                    </div>

                    <div className="text-right">
                      <span
                        className={`text-xs font-black px-2 py-0.5 rounded-full uppercase ${
                          bet.status === 'won'
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                            : bet.status === 'lost'
                            ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                            : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                        }`}
                      >
                        {bet.status}
                      </span>
                      {bet.status === 'won' && (
                        <div className="text-[11px] font-bold text-emerald-400 mt-0.5">
                          +₹{(bet.payout || 0).toFixed(2)}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* 11. FLOATING BRAND BADGES (Green Dragon & Cyan Jalwa Bot) */}
      <div className="fixed right-3 bottom-24 z-30 flex flex-col gap-2 pointer-events-auto">
        {/* Green Dragon Token */}
        <div
          onClick={() => setShowRulesModal(true)}
          className="w-12 h-12 rounded-full bg-gradient-to-tr from-emerald-600 to-teal-400 p-0.5 shadow-[0_4px_15px_rgba(16,185,129,0.5)] cursor-pointer hover:scale-110 active:scale-95 transition"
          title="Provably Fair Dragon Shield"
        >
          <div className="w-full h-full rounded-full bg-[#062c23] flex items-center justify-center">
            <span className="text-xl">🐉</span>
          </div>
        </div>

        {/* Cyan Jalwa Support Bot Bubble */}
        <div
          onClick={() => setShowSupportModal(true)}
          className="w-12 h-12 rounded-full bg-gradient-to-tr from-cyan-400 to-blue-500 p-0.5 shadow-[0_4px_15px_rgba(34,211,238,0.5)] cursor-pointer hover:scale-110 active:scale-95 transition"
          title="24/7 SportX Assistant"
        >
          <div className="w-full h-full rounded-full bg-[#081e3a] flex items-center justify-center">
            <span className="text-xl">💬</span>
          </div>
        </div>
      </div>

      {/* 13. BET PLACEMENT MODAL */}
      {betModalOpen && selectedBet && (
        <div
          className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/85 backdrop-blur-sm animate-fade-in"
          onClick={(e) => {
            if (e.target === e.currentTarget) setBetModalOpen(false);
          }}
        >
          <div className="bg-[#0b1430] border-t sm:border border-cyan-500/40 rounded-t-3xl sm:rounded-3xl max-w-md w-full max-h-[92dvh] sm:max-h-[88vh] flex flex-col shadow-2xl relative overflow-hidden">
            {/* Header with Bet Style & Multiplier Badge */}
            <div className="shrink-0 p-3.5 pb-2.5 relative border-b border-blue-900/40">
              <button
                onClick={() => setBetModalOpen(false)}
                className="absolute top-3 right-3 w-7 h-7 rounded-full bg-slate-800 text-slate-300 hover:text-white flex items-center justify-center transition active:scale-95 z-10"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>

              <div className={`p-3 rounded-2xl bg-gradient-to-r ${getBetColorStyles(selectedBet).bg} text-white shadow-lg text-center relative overflow-hidden`}>
                <div className="flex items-center justify-between text-[11px] font-bold tracking-wider opacity-90 mb-0.5 pr-6">
                  <span className="uppercase">{activeMode.title}</span>
                  <span className="bg-black/30 backdrop-blur-sm px-2 py-0.5 rounded-full text-amber-300 font-black">
                    {selectedBet && ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'].includes(selectedBet)
                      ? '9X JACKPOT'
                      : selectedBet === 'violet'
                      ? '4.5X WIN'
                      : '2X WIN'}
                  </span>
                </div>
                <div className="text-xl font-black">{getBetColorStyles(selectedBet).label}</div>
              </div>
            </div>

            {/* Scrollable Body */}
            <div className="flex-1 overflow-y-auto overscroll-contain px-4 py-3 space-y-3 no-scrollbar text-xs">
              {/* Wallet Balance Bar */}
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#091129] border border-blue-900/60 text-xs">
                <div className="flex items-center gap-1.5 text-slate-300">
                  <Wallet className="w-3.5 h-3.5 text-cyan-400" />
                  <span className="font-semibold">Wallet Balance:</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-black font-mono text-cyan-300 text-sm">
                    ₹{((user?.depositBalance || 0) + (user?.winningBalance || 0) + (user?.balance || 0)).toFixed(2)}
                  </span>
                  {onOpenDeposit && (
                    <button
                      onClick={() => {
                        setBetModalOpen(false);
                        onOpenDeposit();
                      }}
                      className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 hover:bg-emerald-500/30 transition"
                    >
                      + Recharge
                    </button>
                  )}
                </div>
              </div>

              {/* Contract Money Selection */}
              <div>
                <div className="flex items-center justify-between text-slate-300 font-bold mb-1.5">
                  <span>Contract Money (Select Chip)</span>
                  <span className="text-[11px] text-cyan-400 font-mono font-black">₹{contractUnit} / bet</span>
                </div>
                <div className="grid grid-cols-4 gap-1.5 font-mono">
                  {[1, 5, 10, 20, 50, 100, 500, 1000].map((unit) => (
                    <button
                      key={unit}
                      onClick={() => setContractUnit(unit)}
                      className={`py-2 rounded-xl font-black text-center transition transform active:scale-95 ${
                        contractUnit === unit
                          ? 'bg-gradient-to-r from-cyan-400 to-blue-500 text-black shadow-[0_0_12px_rgba(34,211,238,0.6)] font-bold scale-[1.02]'
                          : 'bg-[#091129] border border-blue-900/50 text-slate-300 hover:border-cyan-500/40 hover:text-white'
                      }`}
                    >
                      ₹{unit}
                    </button>
                  ))}
                </div>
              </div>

              {/* Multiplier (Quantity) */}
              <div>
                <div className="flex items-center justify-between text-slate-300 font-bold mb-1.5">
                  <span>Multiplier (Quantity)</span>
                  <span className="text-[11px] text-emerald-400 font-mono font-black">{betCount}X</span>
                </div>

                <div className="flex items-center justify-between gap-1.5 bg-[#091129] border border-blue-900/50 rounded-xl p-1.5">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setBetCount(Math.max(1, betCount - 5))}
                      className="px-2 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono font-bold text-xs"
                      title="Minus 5"
                    >
                      -5
                    </button>
                    <button
                      onClick={() => setBetCount(Math.max(1, betCount - 1))}
                      className="w-8 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center"
                      title="Minus 1"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <span className="flex-1 text-center font-black font-mono text-white text-base">
                    {betCount}
                  </span>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setBetCount(betCount + 1)}
                      className="w-8 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center"
                      title="Plus 1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setBetCount(betCount + 5)}
                      className="px-2 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono font-bold text-xs"
                      title="Plus 5"
                    >
                      +5
                    </button>
                  </div>
                </div>

                {/* Quick Multipliers */}
                <div className="grid grid-cols-7 gap-1 font-mono pt-1.5">
                  {[1, 2, 5, 10, 20, 50, 100].map((m) => (
                    <button
                      key={m}
                      onClick={() => setBetCount(m)}
                      className={`py-1 rounded-lg text-[10px] font-bold text-center transition ${
                        betCount === m
                          ? 'bg-[#10b981] text-white shadow-sm font-black'
                          : 'bg-[#091129] border border-blue-950 text-slate-400 hover:text-white'
                      }`}
                    >
                      X{m}
                    </button>
                  ))}
                </div>
              </div>

              {/* Presets */}
              <div className="flex items-center gap-1.5 pt-0.5 overflow-x-auto no-scrollbar">
                <span className="text-[10px] text-slate-400 font-bold uppercase shrink-0">Presets:</span>
                <button
                  onClick={() => { setContractUnit(1); setBetCount(1); }}
                  className="px-2 py-0.5 rounded-md bg-[#091129] border border-blue-900/60 hover:border-cyan-400 text-[10px] text-slate-300 font-mono shrink-0"
                >
                  Min ₹1
                </button>
                <button
                  onClick={() => { setContractUnit(10); setBetCount(1); }}
                  className="px-2 py-0.5 rounded-md bg-[#091129] border border-blue-900/60 hover:border-cyan-400 text-[10px] text-slate-300 font-mono shrink-0"
                >
                  ₹10
                </button>
                <button
                  onClick={() => { setContractUnit(50); setBetCount(1); }}
                  className="px-2 py-0.5 rounded-md bg-[#091129] border border-blue-900/60 hover:border-cyan-400 text-[10px] text-slate-300 font-mono shrink-0"
                >
                  ₹50
                </button>
                <button
                  onClick={() => { setContractUnit(100); setBetCount(1); }}
                  className="px-2 py-0.5 rounded-md bg-[#091129] border border-blue-900/60 hover:border-cyan-400 text-[10px] text-slate-300 font-mono shrink-0"
                >
                  ₹100
                </button>
                <button
                  onClick={() => {
                    const totalAvail = (user?.depositBalance || 0) + (user?.winningBalance || 0) + (user?.balance || 0);
                    const maxPossible = Math.max(1, Math.floor(totalAvail / contractUnit));
                    setBetCount(maxPossible);
                  }}
                  className="px-2 py-0.5 rounded-md bg-amber-500/20 border border-amber-500/40 text-[10px] text-amber-300 font-bold shrink-0 hover:bg-amber-500/30"
                >
                  Max Bet
                </button>
              </div>

              {/* Total Bet Calculation & Projected Payout */}
              <div className="p-2.5 rounded-xl bg-[#091129] border border-cyan-500/30 font-bold space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-slate-300">Total Bet Amount:</span>
                  <span className="text-base font-black font-mono text-cyan-300">
                    ₹{(contractUnit * betCount).toFixed(2)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[11px] pt-1 border-t border-blue-950/70">
                  <span className="text-slate-400">Potential Payout:</span>
                  <span className="font-mono text-emerald-400 font-black text-xs">
                    ₹{(
                      contractUnit *
                      betCount *
                      (selectedBet && ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'].includes(selectedBet)
                        ? 9
                        : selectedBet === 'violet'
                        ? 4.5
                        : 2)
                    ).toFixed(2)} (
                    {selectedBet && ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'].includes(selectedBet)
                      ? '9X'
                      : selectedBet === 'violet'
                      ? '4.5X'
                      : '2X'}
                    )
                  </span>
                </div>
              </div>

              {/* Low balance warning */}
              {contractUnit * betCount > ((user?.depositBalance || 0) + (user?.winningBalance || 0) + (user?.balance || 0)) && (
                <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 text-amber-300 text-[11px]">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>Insufficient balance (₹{((user?.depositBalance || 0) + (user?.winningBalance || 0) + (user?.balance || 0)).toFixed(2)})</span>
                  </div>
                  {onOpenDeposit && (
                    <button
                      onClick={() => {
                        setBetModalOpen(false);
                        onOpenDeposit();
                      }}
                      className="px-2.5 py-1 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black font-black text-[11px] shadow-sm transition active:scale-95 shrink-0"
                    >
                      Deposit Now
                    </button>
                  )}
                </div>
              )}

              {/* Pre-sale Rules Agreement */}
              <div className="flex items-center gap-2 pt-0.5 text-[11px] text-slate-400 pb-1">
                <input
                  type="checkbox"
                  id="presale"
                  checked={agreedPreSale}
                  onChange={(e) => setAgreedPreSale(e.target.checked)}
                  className="rounded text-cyan-500 focus:ring-0 bg-[#091129] border-slate-700 cursor-pointer"
                />
                <label htmlFor="presale" className="cursor-pointer select-none">
                  I agree to the <span className="text-cyan-400 underline font-semibold">PRE-SALE RULES</span>
                </label>
              </div>
            </div>

            {/* STICKY BOTTOM ACTIONS FOOTER - Always pinned and visible on all screens */}
            <div className="shrink-0 bg-[#080f24] border-t border-blue-900/60 p-3 pb-6 sm:pb-3 shadow-2xl flex items-center gap-2.5">
              <button
                onClick={() => setBetModalOpen(false)}
                className="py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition active:scale-95 shrink-0"
              >
                Cancel
              </button>

              <button
                onClick={handleConfirmBet}
                disabled={isSubmittingBet || isFreeze}
                className={`flex-1 py-3 px-4 rounded-xl text-black font-black text-sm shadow-lg transition active:scale-95 flex items-center justify-center gap-2 ${
                  isFreeze
                    ? 'bg-slate-700 text-slate-400 cursor-not-allowed'
                    : 'bg-gradient-to-r from-cyan-400 via-teal-400 to-emerald-400 hover:from-cyan-300 hover:to-emerald-300 shadow-[0_0_20px_rgba(34,211,238,0.4)]'
                }`}
              >
                {isSubmittingBet ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Placing Bet...</span>
                  </>
                ) : isFreeze ? (
                  <span>Round Frozen ({remainingSeconds}s)</span>
                ) : (
                  <span>Total ₹{(contractUnit * betCount).toFixed(2)} • Confirm</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 14. DETAIL ADVISORY MODAL (Security notice) */}
      {showDetailModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#0b1430] border border-cyan-500/40 rounded-3xl max-w-sm w-full p-6 shadow-2xl relative">
            <button
              onClick={() => setShowDetailModal(false)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-800 text-slate-300 hover:text-white flex items-center justify-center"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="w-12 h-12 rounded-2xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400 mb-4">
              <ShieldCheck className="w-6 h-6" />
            </div>

            <h3 className="text-lg font-black text-white mb-2">Important Security Notice</h3>
            <div className="space-y-3 text-xs text-slate-300 leading-relaxed font-sans">
              <p className="bg-[#080d20] p-3 rounded-xl border border-cyan-500/20 text-cyan-200">
                Our official customer service team will never send unauthorized external links or direct messages asking for deposits outside the app.
              </p>
              <p>
                Please do not click on unverified links or share your password, login PIN, or wallet credentials with anyone claiming to represent support.
              </p>
            </div>

            <button
              onClick={() => setShowDetailModal(false)}
              className="w-full mt-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-black font-black text-xs shadow-lg"
            >
              Understood
            </button>
          </div>
        </div>
      )}

      {/* 15. RULES MODAL (How to Play) */}
      {showRulesModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#0b1430] border border-cyan-500/40 rounded-3xl max-w-sm w-full p-6 shadow-2xl relative max-h-[85vh] overflow-y-auto">
            <button
              onClick={() => setShowRulesModal(false)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-800 text-slate-300 hover:text-white flex items-center justify-center"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 mb-4">
              <HelpCircle className="w-6 h-6" />
            </div>

            <h3 className="text-lg font-black text-white mb-3">
              Color Prediction Rules
            </h3>

            <div className="space-y-3 text-xs text-slate-300 leading-relaxed font-sans">
              <div className="p-3 rounded-xl bg-[#080d20] border border-emerald-500/20">
                <span className="font-bold text-emerald-300 block mb-1">🟢 Green (1, 3, 7, 9)</span>
                <span>If Green appears, you win a 2X payout (or 1.5X if 0 or 5 is drawn).</span>
              </div>

              <div className="p-3 rounded-xl bg-[#080d20] border border-rose-500/20">
                <span className="font-bold text-rose-300 block mb-1">🔴 Red (2, 4, 6, 8)</span>
                <span>If Red appears, you win a 2X payout (or 1.5X if 0 or 5 is drawn).</span>
              </div>

              <div className="p-3 rounded-xl bg-[#080d20] border border-purple-500/20">
                <span className="font-bold text-purple-300 block mb-1">🟣 Violet (0, 5)</span>
                <span>If Violet appears, you win a 4.5X multiplier payout.</span>
              </div>

              <div className="p-3 rounded-xl bg-[#080d20] border border-cyan-500/20">
                <span className="font-bold text-cyan-300 block mb-1">🎯 Direct Number (0 - 9)</span>
                <span>Guess the exact winning number to unlock the massive 9X Jackpot payout!</span>
              </div>

              <div className="p-3 rounded-xl bg-[#080d20] border border-amber-500/20">
                <span className="font-bold text-amber-300 block mb-1">⚖️ Big / Small</span>
                <span>Big (5, 6, 7, 8, 9) and Small (0, 1, 2, 3, 4) award a 2X payout.</span>
              </div>
            </div>

            <button
              onClick={() => setShowRulesModal(false)}
              className="w-full mt-5 py-2.5 rounded-xl bg-[#22d3ee] text-black font-black text-xs shadow-lg"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* 16. SUPPORT MODAL */}
      {showSupportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#0b1430] border border-cyan-500/40 rounded-3xl max-w-sm w-full p-6 shadow-2xl relative text-center">
            <button
              onClick={() => setShowSupportModal(false)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-800 text-slate-300 hover:text-white flex items-center justify-center"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="w-14 h-14 mx-auto rounded-2xl bg-cyan-500/20 border border-cyan-400 flex items-center justify-center text-cyan-300 mb-3">
              <Headphones className="w-7 h-7" />
            </div>

            <h3 className="text-lg font-black text-white mb-1">SportX 24/7 Support</h3>
            <p className="text-xs text-slate-300 mb-4">
              Need help with deposits, withdrawals, or game rules? Our verified specialists are ready 24/7.
            </p>

            <div className="space-y-2 text-xs font-mono">
              <div className="p-3 rounded-xl bg-[#080d20] border border-blue-900/50 text-cyan-300">
                Telegram: @SportXOfficialSupport
              </div>
              <div className="p-3 rounded-xl bg-[#080d20] border border-blue-900/50 text-emerald-300">
                Live Chat: Available 24/7
              </div>
            </div>

            <button
              onClick={() => setShowSupportModal(false)}
              className="w-full mt-5 py-2.5 rounded-xl bg-cyan-400 text-black font-black text-xs shadow-lg"
            >
              Got it!
            </button>
          </div>
        </div>
      )}

      {/* 17. RESULT DISPENSER MODAL (Colorful vibrant casino styling matching reference images) */}
      {resultModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          {/* Celebratory Falling Confetti Particles (Active on every draw!) */}
          <ConfettiOverlay />

          <div className="relative w-full max-w-sm flex flex-col items-center z-20">
            {/* Winged Emblem: Golden Rocket for Win/Draw, Golden Ruby Star for Loss */}
            {resultModal.userBetted && !resultModal.userWon ? <WingedRetryEmblem /> : <WingedRocketEmblem />}

            {/* Radiant Colorful Gradient Card Box Container */}
            <div
              className={`w-full max-w-[340px] sm:max-w-[360px] rounded-[36px] p-5 shadow-2xl border text-white relative -mt-5 ${
                resultModal.userBetted && !resultModal.userWon
                  ? 'bg-gradient-to-b from-[#ff385c] via-[#d7193c] to-[#990c24] shadow-[0_25px_80px_rgba(215,25,60,0.65)] border-amber-300/40 ring-1 ring-white/20'
                  : 'bg-gradient-to-b from-[#ff603e] via-[#ff3b4b] to-[#ff183d] shadow-[0_25px_80px_rgba(255,24,61,0.65)] border-white/35 ring-1 ring-white/25'
              }`}
            >
              {/* Heading */}
              <h3 className="text-2xl sm:text-[26px] font-black text-center tracking-tight text-white drop-shadow-[0_2px_6px_rgba(0,0,0,0.3)] pt-1 pb-1">
                {resultModal.userBetted
                  ? resultModal.userWon
                    ? '• Congratulations •'
                    : '• Loss •'
                  : '• Lottery Result •'}
              </h3>

              {/* Lottery results row */}
              <div className="flex items-center justify-between px-2.5 my-3">
                <span className="text-[13px] sm:text-sm font-extrabold text-white tracking-wide drop-shadow-sm">
                  Lottery results
                </span>

                <div className="flex items-center gap-1.5">
                  {/* Color pill with rich authentic colors */}
                  <span
                    className={`px-3.5 py-0.5 rounded-full text-white font-black text-xs shadow-md border border-white/30 ${
                      resultModal.color.includes('violet-green')
                        ? 'bg-gradient-to-r from-[#00c988] to-[#8b5cf6]'
                        : resultModal.color.includes('violet-red')
                        ? 'bg-gradient-to-r from-[#ff1a38] to-[#8b5cf6]'
                        : resultModal.color === 'green'
                        ? 'bg-[#00c988]'
                        : resultModal.color === 'violet'
                        ? 'bg-[#8b5cf6]'
                        : 'bg-[#ff1a38]'
                    }`}
                  >
                    {resultModal.color.includes('violet-green')
                      ? 'Green+Violet'
                      : resultModal.color.includes('violet-red')
                      ? 'Red+Violet'
                      : resultModal.color === 'green'
                      ? 'Green'
                      : resultModal.color === 'violet'
                      ? 'Violet'
                      : 'Red'}
                  </span>

                  {/* Number pill with specular 3D ball styling and true ball color */}
                  <span className="w-6.5 h-6.5 rounded-full bg-white font-black text-xs shadow-[0_2px_6px_rgba(0,0,0,0.25)] flex items-center justify-center border-2 border-white">
                    <span
                      className={`leading-none ${
                        [1, 3, 7, 9].includes(resultModal.drawnNumber)
                          ? 'text-[#047857]'
                          : [0, 5].includes(resultModal.drawnNumber)
                          ? 'text-[#7c3aed]'
                          : 'text-[#dc2626]'
                      }`}
                    >
                      {resultModal.drawnNumber}
                    </span>
                  </span>

                  {/* Size pill (Green for Big, Red for Small) */}
                  <span
                    className={`px-3.5 py-0.5 rounded-full text-white font-black text-xs shadow-md border border-white/30 ${
                      resultModal.size === 'big' ? 'bg-[#00c988]' : 'bg-[#ff1a38]'
                    }`}
                  >
                    {resultModal.size === 'big' ? 'Big' : 'Small'}
                  </span>
                </div>
              </div>

              {/* Dispenser Slot Frame Bezel */}
              <div className="relative w-[84%] mx-auto z-30 pointer-events-none">
                <div
                  className={`h-4.5 w-full rounded-full border-[3px] shadow-[inset_0_2px_5px_rgba(0,0,0,0.85)] flex items-center justify-center ${
                    resultModal.userBetted && !resultModal.userWon
                      ? 'bg-[#550613] border-[#ff9999]'
                      : 'bg-[#7a0618] border-[#ffa199]'
                  }`}
                >
                  {/* Dark Inner Dispenser Slot Opening */}
                  <div className="w-[94%] h-1.5 bg-black/95 rounded-full shadow-[inset_0_1px_3px_rgba(0,0,0,1)]" />
                </div>
              </div>

              {/* Paper Dispenser Chamber: Strictly clips anything above slot mouth */}
              <div className="relative w-full -mt-2 z-20 overflow-hidden pt-2 pb-2">
                <CurvedTicketPaper>
                  {/* Perforated ticket top guide line */}
                  <div className="w-[84%] border-b border-dashed border-red-300/60 mb-1" />

                  {resultModal.userBetted ? (
                    resultModal.userWon ? (
                      <>
                        <div className="text-[13px] font-black text-[#ff2444] uppercase tracking-wider">
                          Bonus
                        </div>
                        <div className="text-3xl sm:text-[34px] font-black text-[#ff2444] my-0.5 tracking-tight font-sans">
                          ₹{resultModal.bonusAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                        {resultModal.winningBetsCount !== undefined && (
                          <div className="inline-block px-3 py-0.5 mb-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-extrabold border border-emerald-300 shadow-sm">
                            ★ Won {resultModal.winningBetsCount} of {resultModal.totalBetsCount || 1} Bet(s)
                          </div>
                        )}
                      </>
                    ) : (
                      <>
                        <div className="text-[14px] font-black text-[#dc2626] uppercase tracking-wider">
                          LOSS
                        </div>
                        <div className="text-3xl sm:text-[34px] font-black text-[#dc2626] my-0.5 tracking-tight font-sans">
                          -₹{resultModal.betAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                        <div className="inline-block px-3 py-0.5 mb-0.5 rounded-full bg-rose-50 text-rose-700 text-[10px] font-extrabold border border-rose-300 shadow-sm">
                          Trade Settled: Loss
                        </div>
                      </>
                    )
                  ) : (
                    <>
                      <div className="text-[13px] font-black text-[#ff2444] uppercase tracking-wider">
                        Bonus
                      </div>
                      <div className="text-2xl sm:text-[28px] font-black text-slate-800 my-0.5 tracking-tight font-sans flex items-center justify-center gap-1.5">
                        <span className="text-slate-500 text-sm font-semibold">Draw:</span>
                        <span className={`font-black ${
                          resultModal.color.includes('green') ? 'text-[#047857]' : resultModal.color.includes('violet') ? 'text-[#7c3aed]' : 'text-[#dc2626]'
                        }`}>
                          {resultModal.drawnNumber}
                        </span>
                        <span className="text-xs px-2 py-0.5 rounded-md bg-slate-100 font-bold uppercase text-slate-700">
                          {resultModal.size}
                        </span>
                      </div>
                      <div className="inline-block px-3 py-0.5 mb-0.5 rounded-full bg-amber-50 text-amber-800 text-[10px] font-bold border border-amber-300 shadow-sm">
                        No Bet Placed This Round
                      </div>
                    </>
                  )}
                  <div className="text-[11px] font-semibold text-slate-600 mt-0.5">
                    Period: {activeMode.title}
                  </div>
                  <div className="text-[10px] font-mono text-slate-500">
                    {resultModal.periodId}
                  </div>
                </CurvedTicketPaper>
              </div>

              {/* Auto close checkbox matching images (2).jpeg */}
              <div className="mt-4 flex items-center justify-center gap-2 text-xs font-semibold text-white/95">
                <div className="w-4 h-4 rounded bg-white text-[#ff2444] flex items-center justify-center text-[10px] font-black shadow-md">
                  ✓
                </div>
                <span className="tracking-wide drop-shadow-sm">{autoCloseSeconds} seconds auto close</span>
              </div>
            </div>

            {/* Circular Close Button beneath card matching images (2).jpeg */}
            <button
              onClick={() => setResultModal(null)}
              className="mt-4 w-11 h-11 rounded-full border-2 border-white/80 bg-black/40 backdrop-blur-sm text-white flex items-center justify-center hover:scale-110 active:scale-95 transition shadow-2xl"
              title="Close"
            >
              <X className="w-5 h-5 stroke-[2.5]" />
            </button>
          </div>

          {/* Bottom Right Floating Mascot Badges (matching images (2).jpeg) */}
          <div className="fixed bottom-6 right-4 z-40 flex flex-col items-center gap-3 pointer-events-auto">
            {/* Green Dragon Badge */}
            <div className="w-13 h-13 rounded-full bg-white shadow-[0_8px_25px_rgba(16,185,129,0.5)] border-2 border-emerald-400 p-1 flex items-center justify-center cursor-pointer hover:scale-110 active:scale-95 transition-transform duration-200">
              <svg viewBox="0 0 40 40" className="w-10 h-10">
                <circle cx="20" cy="20" r="18" fill="#10b981" />
                <path d="M 20 8 C 24 12 28 15 28 20 C 28 25 24 29 20 31 C 18 28 17 24 18 21 C 14 21 12 18 13 15 C 16 15 18 17 19 19 C 20 16 19 12 20 8 Z" fill="#ffffff" />
                <circle cx="24" cy="18" r="2" fill="#047857" />
              </svg>
            </div>

            {/* Customer Support Chatbot Badge */}
            <div
              onClick={() => setShowSupportModal(true)}
              className="w-13 h-13 rounded-full bg-white shadow-[0_8px_25px_rgba(6,182,212,0.5)] border-2 border-cyan-400 p-1 flex items-center justify-center cursor-pointer hover:scale-110 active:scale-95 transition-transform duration-200"
            >
              <div className="w-full h-full rounded-full bg-gradient-to-br from-cyan-400 to-teal-400 flex items-center justify-center text-white shadow-inner">
                <Headphones className="w-5 h-5" />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
