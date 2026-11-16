import React, { useState, useEffect, useRef } from 'react';
import {
  Ticket,
  Sparkles,
  Trophy,
  Clock,
  Zap,
  CheckCircle2,
  UserCheck,
  RefreshCw,
  Sliders,
  ShieldCheck,
  Coins,
  Flame,
  Crown,
  Play,
  Gift,
  Search,
  Download,
  FileSpreadsheet,
  ListFilter,
  Trash2,
  Volume2,
  VolumeX,
  Lock,
  Layers,
  RotateCcw,
  ChevronLeft,
  Headphones,
  Music2,
  Wallet,
  X,
  HelpCircle,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';
import { User, LuckyDrawState, DrawnPrizeTicket, LuckyDrawWinner } from '../types';
import { JalwaLogo } from './JalwaLogo';

interface LuckyDrawViewProps {
  currentUser: User;
  users: User[];
  onOpenDeposit?: () => void;
  onOpenWithdraw?: () => void;
  onRefreshState?: () => void;
  onBack?: () => void;
  showToast?: (message: string, type?: 'success' | 'error') => void;
}

// Shared AudioContext Singleton to eliminate browser stutter and audio thread leaks
let sharedAudioCtx: AudioContext | null = null;
function getSharedAudioContext(): AudioContext | null {
  try {
    if (!sharedAudioCtx) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        sharedAudioCtx = new AudioContextClass();
      }
    }
    if (sharedAudioCtx && sharedAudioCtx.state === 'suspended') {
      sharedAudioCtx.resume().catch(() => {});
    }
    return sharedAudioCtx;
  } catch {
    return null;
  }
}

export const LuckyDrawView: React.FC<LuckyDrawViewProps> = ({
  currentUser,
  users,
  onOpenDeposit,
  onOpenWithdraw,
  onRefreshState,
  onBack,
  showToast,
}) => {
  const [luckyDraw, setLuckyDraw] = useState<LuckyDrawState | null>(null);
  const [loading, setLoading] = useState(false);
  const [buying, setBuying] = useState(false);
  const [ticketQty, setTicketQty] = useState(1);
  const [selectionMode, setSelectionMode] = useState<'random' | 'custom'>('custom');
  const [customCouponInput, setCustomCouponInput] = useState<string>('');
  const [customCouponList, setCustomCouponList] = useState<string[]>([]);
  const [activeLotteryTab, setActiveLotteryTab] = useState<'draw' | 'tickets' | 'winners' | 'rules' | 'admin'>('draw');
  const [showSupportModal, setShowSupportModal] = useState(false);
  const [showRulesModal, setShowRulesModal] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [localToast, setLocalToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const displayToast = (msg: string, type: 'success' | 'error' = 'success') => {
    if (showToast) {
      showToast(msg, type);
    } else {
      setLocalToast({ message: msg, type });
      setTimeout(() => setLocalToast(null), 3500);
    }
  };

  const [timeLeft, setTimeLeft] = useState<{ days: number; hours: number; minutes: number; seconds: number }>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  // 10-Second Roller animation states
  const ROLL_TOTAL_MS = 10000;
  const [isRolling, setIsRolling] = useState(false);
  const isRollingRef = useRef<boolean>(false);
  const [rollSecondsLeft, setRollSecondsLeft] = useState<number>(10.0);
  const [rollProgress, setRollProgress] = useState<number>(0);
  const [lockedReelMask, setLockedReelMask] = useState<boolean[]>([false, false, false, false, false, false]);
  const [displayDigits, setDisplayDigits] = useState<string[]>(['7', '3', '9', '2', '1', '0']);
  const [currentRollingPrizeName, setCurrentRollingPrizeName] = useState<string>('1st Prize');
  const [currentRollingStep, setCurrentRollingStep] = useState<number>(1);
  const [winnerAnnouncedList, setWinnerAnnouncedList] = useState<LuckyDrawWinner[] | null>(null);
  const [winnerTierFilter, setWinnerTierFilter] = useState<'all' | '1st' | '2nd' | '3rd' | '4th' | '5th' | 'guaranteed'>('all');
  const lastSeenRollTimeRef = useRef<number>(0);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);

  // Active animation refs
  const rollIntervalRef = useRef<any>(null);
  const soundEnabledRef = useRef<boolean>(true);
  useEffect(() => {
    soundEnabledRef.current = soundEnabled;
  }, [soundEnabled]);

  // Web Audio Synth Helpers (Zero Lag via Shared Audio Context)
  const playElectricTick = () => {
    if (!soundEnabledRef.current) return;
    try {
      const audioCtx = getSharedAudioContext();
      if (!audioCtx) return;
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(600 + Math.random() * 400, audioCtx.currentTime);
      gain.gain.setValueAtTime(0.015, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.03);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.03);
    } catch {}
  };

  const playReelLockSound = (reelIdx: number) => {
    if (!soundEnabledRef.current) return;
    try {
      const audioCtx = getSharedAudioContext();
      if (!audioCtx) return;
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'triangle';
      const freqs = [392, 440, 523, 587, 659, 784];
      osc.frequency.setValueAtTime(freqs[reelIdx] || 523, audioCtx.currentTime);
      gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.18);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.18);
    } catch {}
  };

  const playJackpotFanfare = () => {
    if (!soundEnabledRef.current) return;
    try {
      const audioCtx = getSharedAudioContext();
      if (!audioCtx) return;
      const notes = [523.25, 659.25, 783.99, 1046.5];
      notes.forEach((freq, i) => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, audioCtx.currentTime + i * 0.1);
        gain.gain.setValueAtTime(0.1, audioCtx.currentTime + i * 0.1);
        gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + i * 0.1 + 0.4);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(audioCtx.currentTime + i * 0.1);
        osc.stop(audioCtx.currentTime + i * 0.1 + 0.4);
      });
    } catch {}
  };

  // Staged locking animation engine (10 full seconds, ultra smooth)
  const start10SecRollAnimation = (
    targetWinNum: string,
    winners: any[],
    rollStartTimestamp?: number,
    prizeRank: number = 1,
    drawnPrizesSnapshot?: DrawnPrizeTicket[]
  ) => {
    if (rollIntervalRef.current) {
      clearInterval(rollIntervalRef.current);
    }

    const start = rollStartTimestamp || Date.now();
    setIsRolling(true);
    isRollingRef.current = true;
    setCurrentRollingStep(prizeRank);
    const prizeRankNamesMap: Record<number, string> = {
      1: '1st Prize',
      2: '2nd Prize',
      3: '3rd Prize',
      4: '4th Prize',
      5: '5th Prize',
    };
    setCurrentRollingPrizeName(prizeRankNamesMap[prizeRank] || `${prizeRank}th Prize`);
    setWinnerAnnouncedList(null);

    const safeTargetDigits = (targetWinNum || '786910').padStart(6, '0').slice(-6).split('');
    const prevLockedState = [false, false, false, false, false, false];
    const lockMilestones = [6000, 6800, 7600, 8400, 9200, 10000];

    let tickCount = 0;
    rollIntervalRef.current = setInterval(() => {
      const now = Date.now();
      const elapsed = now - start;
      const remainingMs = Math.max(0, ROLL_TOTAL_MS - elapsed);
      const remainingSec = remainingMs / 1000;
      const progressPercent = Math.min(100, (elapsed / ROLL_TOTAL_MS) * 100);

      // Evaluate lock status for each reel
      const currentLocks = lockMilestones.map((milestone) => elapsed >= milestone);
      
      // Play lock chime when a new reel locks
      currentLocks.forEach((isLocked, idx) => {
        if (isLocked && !prevLockedState[idx]) {
          prevLockedState[idx] = true;
          playReelLockSound(idx);
        }
      });

      // Sound tick occasionally for spinning reels
      tickCount++;
      if (tickCount % 3 === 0 && elapsed < ROLL_TOTAL_MS) {
        playElectricTick();
      }

      // Generate digit display
      const currentDigits = safeTargetDigits.map((digit, idx) => {
        if (currentLocks[idx]) {
          return digit;
        }
        return Math.floor(Math.random() * 10).toString();
      });

      // Batch state updates
      setRollSecondsLeft(remainingSec);
      setRollProgress(progressPercent);
      setLockedReelMask(currentLocks);
      setDisplayDigits(currentDigits);

      // Finish 10-second draw: roller stops completely and reveals ticket smoothly
      if (elapsed >= ROLL_TOTAL_MS) {
        if (rollIntervalRef.current) {
          clearInterval(rollIntervalRef.current);
          rollIntervalRef.current = null;
        }
        setIsRolling(false);
        isRollingRef.current = false;
        setLockedReelMask([true, true, true, true, true, true]);
        setDisplayDigits(safeTargetDigits);
        setRollSecondsLeft(0);
        setRollProgress(100);
        playJackpotFanfare();

        // Update state with newly drawn prizes after roller completely finishes
        if (drawnPrizesSnapshot && drawnPrizesSnapshot.length > 0) {
          setLuckyDraw((prev) => (prev ? { ...prev, drawnPrizes: drawnPrizesSnapshot, currentDrawStep: prizeRank } : null));
        }

        if (winners && winners.length > 0) {
          setWinnerAnnouncedList(winners);
        }
        if (onRefreshState) onRefreshState();
      }
    }, 55);
  };

  useEffect(() => {
    return () => {
      if (rollIntervalRef.current) {
        clearInterval(rollIntervalRef.current);
      }
    };
  }, []);

  // Admin Config State
  const [isAdminPanelOpen, setIsAdminPanelOpen] = useState(false);
  const [adminSelectedStep, setAdminSelectedStep] = useState<1 | 2 | 3 | 4 | 5>(1);
  const [forcedPrizesState, setForcedPrizesState] = useState<{
    '1': { userId: string; ticketNumber: string };
    '2': { userId: string; ticketNumber: string };
    '3': { userId: string; ticketNumber: string };
    '4': { userId: string; ticketNumber: string };
    '5': { userId: string; ticketNumber: string };
  }>({
    '1': { userId: '', ticketNumber: '' },
    '2': { userId: '', ticketNumber: '' },
    '3': { userId: '', ticketNumber: '' },
    '4': { userId: '', ticketNumber: '' },
    '5': { userId: '', ticketNumber: '' },
  });

  const [previewLast5Input, setPreviewLast5Input] = useState<string>('');
  const [assignTargetUsers, setAssignTargetUsers] = useState<Record<string, string>>({});

  const [adminTicketPrice, setAdminTicketPrice] = useState<number | string>(100);
  const [adminPrizeAmount, setAdminPrizeAmount] = useState<number | string>(25000);
  const [adminSecondPrize, setAdminSecondPrize] = useState<number | string>(10000);
  const [adminThirdPrize, setAdminThirdPrize] = useState<number | string>(5000);
  const [adminFourthPrize, setAdminFourthPrize] = useState<number | string>(2500);
  const [adminFifthPrize, setAdminFifthPrize] = useState<number | string>(1500);
  const [adminGuaranteedPrize, setAdminGuaranteedPrize] = useState<number | string>(500);
  const [adminCountdownMins, setAdminCountdownMins] = useState<number>(60);
  const [adminSearchUser, setAdminSearchUser] = useState('');
  const [adminCouponSearch, setAdminCouponSearch] = useState('');
  const [showActiveCouponsList, setShowActiveCouponsList] = useState(false);
  const [adminMsg, setAdminMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [hasInitializedConfig, setHasInitializedConfig] = useState(false);
  const [isAdminDirty, setIsAdminDirty] = useState(false);
  const isAdminDirtyRef = useRef(false);
  const hasInitializedConfigRef = useRef(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  // CSV Export Active Coupons
  const downloadActiveCouponsCSV = () => {
    const tickets = luckyDraw?.tickets || [];
    if (tickets.length === 0) {
      alert('No active coupons found in the current pool.');
      return;
    }
    const headers = ['Ticket Number', 'User Node ID', 'User Name', 'User ID', 'Price (INR)', 'Purchased At'];
    const csvRows = [
      headers.join(','),
      ...tickets.map((t) =>
        [
          `"${t.ticketNumber}"`,
          `"${t.userNodeId || ''}"`,
          `"${(t.userName || '').replace(/"/g, '""')}"`,
          `"${t.userId}"`,
          t.price ?? 100,
          `"${t.purchasedAt || ''}"`,
        ].join(',')
      ),
    ];
    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `LuckyDraw_ActiveCoupons_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // CSV Export Past Winner Results
  const downloadPastResultsCSV = () => {
    const past = luckyDraw?.pastWinners || [];
    if (past.length === 0) {
      alert('No past winner results found to export.');
      return;
    }
    const headers = [
      'Draw Title',
      'Winning Ticket Number',
      'Prize Tier',
      'Prize Amount (INR)',
      'Winner Name',
      'Winner Node ID',
      'Winner User ID',
      'Draw Date',
    ];
    const csvRows = [
      headers.join(','),
      ...past.map((w) => {
        const ticketNo = w.ticketNumber || (w as any).winningTicketNumber || (w as any).winningNumber || '';
        const winnerName = w.userName || (w as any).winnerUserName || (w as any).winnerName || 'User';
        const node = w.userNodeId || (w as any).winnerUserNodeId || '';
        const uid = w.userId || (w as any).winnerUserId || '';
        const date = (w as any).wonAt || (w as any).drawDate || '';
        return [
          `"${(w.drawTitle || 'Lucky Draw').replace(/"/g, '""')}"`,
          `"${ticketNo}"`,
          `"${(w.prizeTier || '1st Prize').replace(/"/g, '""')}"`,
          w.prizeAmount ?? 0,
          `"${winnerName.replace(/"/g, '""')}"`,
          `"${node}"`,
          `"${uid}"`,
          `"${date}"`,
        ].join(',');
      }),
    ];
    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `LuckyDraw_PastResults_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleClearPastHistory = async () => {
    try {
      const res = await fetch('/api/luckydraw/admin/clear-history', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setLuckyDraw((prev) => (prev ? { ...prev, pastWinners: [] } : null));
        setAdminMsg({ text: '🎉 Past winner history cleared successfully!', type: 'success' });
        fetchLuckyDraw();
        if (onRefreshState) onRefreshState();
      } else {
        setAdminMsg({ text: data.error || 'Failed to clear history.', type: 'error' });
      }
    } catch (err: any) {
      setAdminMsg({ text: 'Error clearing past winner history: ' + err.message, type: 'error' });
    }
  };

  const handleResetDrawRound = async () => {
    try {
      const res = await fetch('/api/luckydraw/admin/reset-round', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setLuckyDraw(data.luckyDraw);
        setAdminMsg({ text: '🔄 Lucky Draw Round Reset! Ready to start 1st Prize Draw!', type: 'success' });
        fetchLuckyDraw();
        if (onRefreshState) onRefreshState();
      }
    } catch (err: any) {
      setAdminMsg({ text: 'Error resetting round: ' + err.message, type: 'error' });
    }
  };

  // Fetch Lucky Draw State
  const fetchLuckyDraw = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/luckydraw');
      if (res.ok) {
        const data = await res.json();
        const ld = data.luckyDraw as LuckyDrawState;

        // Check if admin recently triggered a live draw spin across all users
        if (ld.rollingStartedAt && ld.rollingStartedAt > lastSeenRollTimeRef.current && Date.now() - ld.rollingStartedAt < 12000) {
          lastSeenRollTimeRef.current = ld.rollingStartedAt;
          const winNum = ld.rollingWinningNumber || ld.lastWinningNumber || '786910';
          const stepRank = ld.rollingPrizeRank || 1;
          const previousDrawnPrizes = (ld.drawnPrizes || []).filter((p: any) => p.prizeRank < stepRank);
          setLuckyDraw({
            ...ld,
            drawnPrizes: previousDrawnPrizes,
            currentDrawStep: stepRank - 1,
          });
          start10SecRollAnimation(
            winNum,
            ld.rollingWinners || [],
            ld.rollingStartedAt,
            stepRank,
            ld.drawnPrizes || []
          );
        } else if (!isRollingRef.current) {
          setLuckyDraw(ld);
          if (ld.lastWinningNumber) {
            setDisplayDigits(ld.lastWinningNumber.padStart(6, '0').split(''));
          }
        }

        // Initialize admin input fields on first load or if not currently being edited by admin
        if (!hasInitializedConfigRef.current || !isAdminDirtyRef.current) {
          if (ld.ticketPrice !== undefined) setAdminTicketPrice(ld.ticketPrice);
          if (ld.prizeAmount !== undefined) setAdminPrizeAmount(ld.prizeAmount);
          if (ld.secondPrizeAmount !== undefined) setAdminSecondPrize(ld.secondPrizeAmount);
          if (ld.thirdPrizeAmount !== undefined) setAdminThirdPrize(ld.thirdPrizeAmount);
          if (ld.fourthPrizeAmount !== undefined) setAdminFourthPrize(ld.fourthPrizeAmount);
          if (ld.fifthPrizeAmount !== undefined) setAdminFifthPrize(ld.fifthPrizeAmount);
          if (ld.guaranteedPrizeAmount !== undefined) setAdminGuaranteedPrize(ld.guaranteedPrizeAmount);

          if (ld.forcedPrizes && (!hasInitializedConfigRef.current || !isAdminDirtyRef.current)) {
            setForcedPrizesState({
              '1': { userId: ld.forcedPrizes['1']?.userId || '', ticketNumber: ld.forcedPrizes['1']?.ticketNumber || '' },
              '2': { userId: ld.forcedPrizes['2']?.userId || '', ticketNumber: ld.forcedPrizes['2']?.ticketNumber || '' },
              '3': { userId: ld.forcedPrizes['3']?.userId || '', ticketNumber: ld.forcedPrizes['3']?.ticketNumber || '' },
              '4': { userId: ld.forcedPrizes['4']?.userId || '', ticketNumber: ld.forcedPrizes['4']?.ticketNumber || '' },
              '5': { userId: ld.forcedPrizes['5']?.userId || '', ticketNumber: ld.forcedPrizes['5']?.ticketNumber || '' },
            });
          }
          hasInitializedConfigRef.current = true;
          setHasInitializedConfig(true);
        }
      }
    } catch (err) {
      console.error('Failed to fetch lucky draw state:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLuckyDraw();
    const interval = setInterval(fetchLuckyDraw, 2500);
    return () => clearInterval(interval);
  }, []);

  // Countdown timer logic
  useEffect(() => {
    if (!luckyDraw?.targetEndTime) return;

    const timer = setInterval(() => {
      const target = new Date(luckyDraw.targetEndTime).getTime();
      const now = Date.now();
      const diff = Math.max(0, target - now);

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeLeft({ days, hours, minutes, seconds });
    }, 1000);

    return () => clearInterval(timer);
  }, [luckyDraw?.targetEndTime]);

  // Helper to add custom coupon
  const handleAddCustomCoupon = () => {
    const cleaned = customCouponInput.trim();
    if (!/^\d{6}$/.test(cleaned)) {
      displayToast('Please enter a valid 6-digit coupon number (e.g. 786910, 123456).', 'error');
      return;
    }
    if (customCouponList.includes(cleaned)) {
      displayToast('Coupon number already added to your list!', 'error');
      return;
    }
    const updated = [...customCouponList, cleaned];
    setCustomCouponList(updated);
    setTicketQty(updated.length);
    setCustomCouponInput('');
  };

  const handleRemoveCustomCoupon = (idx: number) => {
    const updated = customCouponList.filter((_, i) => i !== idx);
    setCustomCouponList(updated);
    setTicketQty(Math.max(1, updated.length));
  };

  const handleGenerateRandomCoupon = () => {
    const rand = Math.floor(100000 + Math.random() * 900000).toString();
    setCustomCouponInput(rand);
  };

  // Buy Ticket Handler
  const handleBuyTickets = async () => {
    if (!luckyDraw) return;

    let effectiveCustomList = [...customCouponList];
    const pendingInput = customCouponInput.trim();
    if (selectionMode === 'custom' && /^\d{6}$/.test(pendingInput) && !effectiveCustomList.includes(pendingInput)) {
      effectiveCustomList.push(pendingInput);
    }

    const finalQty = selectionMode === 'custom' && effectiveCustomList.length > 0 ? effectiveCustomList.length : ticketQty;
    const totalCost = luckyDraw.ticketPrice * finalQty;
    const totalCostInr = totalCost;

    const totalUserAvail = (currentUser.depositBalance || 0) + (currentUser.winningBalance || 0) + (currentUser.balance || 0);
    const totalUserAvailInr = totalUserAvail;

    if (totalUserAvail < totalCost) {
      displayToast(`Insufficient funds! Total cost is ₹${totalCostInr.toLocaleString('en-IN', { minimumFractionDigits: 2 })} INR. Available: ₹${totalUserAvailInr.toLocaleString('en-IN', { minimumFractionDigits: 2 })} INR. Please deposit funds.`, 'error');
      if (onOpenDeposit) onOpenDeposit();
      return;
    }

    try {
      setBuying(true);
      const res = await fetch('/api/luckydraw/buy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': currentUser.id || currentUser.nodeId,
        },
        body: JSON.stringify({
          userId: currentUser.id || currentUser.nodeId,
          quantity: finalQty,
          customNumbers: selectionMode === 'custom' ? effectiveCustomList : [],
        }),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        displayToast(data.error || 'Failed to purchase tickets', 'error');
      } else {
        setCustomCouponList([]);
        setCustomCouponInput('');
        if (data.luckyDraw) {
          setLuckyDraw(data.luckyDraw);
        }
        await fetchLuckyDraw();
        if (onRefreshState) onRefreshState();
        displayToast(`🎉 Success! Purchased ${finalQty} Lucky Draw coupon(s) for ₹${totalCostInr.toLocaleString('en-IN', { minimumFractionDigits: 2 })} INR!`, 'success');
      }
    } catch (err: any) {
      displayToast('Error purchasing tickets: ' + err.message, 'error');
    } finally {
      setBuying(false);
    }
  };

  // Admin Save Settings
  const handleAdminSaveConfig = async (overrides?: any) => {
    try {
      setAdminMsg(null);
      const targetEndTime = overrides?.targetEndTime !== undefined
        ? overrides.targetEndTime
        : (overrides?.countdownMins !== undefined
          ? new Date(Date.now() + adminCountdownMins * 60 * 1000).toISOString()
          : luckyDraw?.targetEndTime);

      const payload = {
        ticketPrice: overrides?.ticketPrice !== undefined ? overrides.ticketPrice : (adminTicketPrice === '' ? 100 : Number(adminTicketPrice)),
        prizeAmount: overrides?.prizeAmount !== undefined ? overrides.prizeAmount : (adminPrizeAmount === '' ? 25000 : Number(adminPrizeAmount)),
        secondPrizeAmount: overrides?.secondPrizeAmount !== undefined ? overrides.secondPrizeAmount : (adminSecondPrize === '' ? 10000 : Number(adminSecondPrize)),
        thirdPrizeAmount: overrides?.thirdPrizeAmount !== undefined ? overrides.thirdPrizeAmount : (adminThirdPrize === '' ? 5000 : Number(adminThirdPrize)),
        fourthPrizeAmount: overrides?.fourthPrizeAmount !== undefined ? overrides.fourthPrizeAmount : (adminFourthPrize === '' ? 2500 : Number(adminFourthPrize)),
        fifthPrizeAmount: overrides?.fifthPrizeAmount !== undefined ? overrides.fifthPrizeAmount : (adminFifthPrize === '' ? 1500 : Number(adminFifthPrize)),
        guaranteedPrizeAmount: overrides?.guaranteedPrizeAmount !== undefined ? overrides.guaranteedPrizeAmount : (adminGuaranteedPrize === '' ? 500 : Number(adminGuaranteedPrize)),
        targetEndTime,
        status: 'active',
        forcedPrizes: overrides?.forcedPrizes || forcedPrizesState,
        ...overrides,
      };

      const res = await fetch('/api/luckydraw/admin/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        if (data.luckyDraw) {
          setLuckyDraw(data.luckyDraw);
          setAdminTicketPrice(data.luckyDraw.ticketPrice !== undefined ? data.luckyDraw.ticketPrice : 100);
          setAdminPrizeAmount(data.luckyDraw.prizeAmount !== undefined ? data.luckyDraw.prizeAmount : 25000);
          setAdminSecondPrize(data.luckyDraw.secondPrizeAmount !== undefined ? data.luckyDraw.secondPrizeAmount : 10000);
          setAdminThirdPrize(data.luckyDraw.thirdPrizeAmount !== undefined ? data.luckyDraw.thirdPrizeAmount : 5000);
          setAdminFourthPrize(data.luckyDraw.fourthPrizeAmount !== undefined ? data.luckyDraw.fourthPrizeAmount : 2500);
          setAdminFifthPrize(data.luckyDraw.fifthPrizeAmount !== undefined ? data.luckyDraw.fifthPrizeAmount : 1500);
          setAdminGuaranteedPrize(data.luckyDraw.guaranteedPrizeAmount !== undefined ? data.luckyDraw.guaranteedPrizeAmount : 500);
          if (data.luckyDraw.forcedPrizes) {
            setForcedPrizesState({
              '1': { userId: data.luckyDraw.forcedPrizes['1']?.userId || '', ticketNumber: data.luckyDraw.forcedPrizes['1']?.ticketNumber || '' },
              '2': { userId: data.luckyDraw.forcedPrizes['2']?.userId || '', ticketNumber: data.luckyDraw.forcedPrizes['2']?.ticketNumber || '' },
              '3': { userId: data.luckyDraw.forcedPrizes['3']?.userId || '', ticketNumber: data.luckyDraw.forcedPrizes['3']?.ticketNumber || '' },
              '4': { userId: data.luckyDraw.forcedPrizes['4']?.userId || '', ticketNumber: data.luckyDraw.forcedPrizes['4']?.ticketNumber || '' },
              '5': { userId: data.luckyDraw.forcedPrizes['5']?.userId || '', ticketNumber: data.luckyDraw.forcedPrizes['5']?.ticketNumber || '' },
            });
          }
        }
        setAdminMsg({ text: '🎉 Prize amounts & forced winners saved successfully to system!', type: 'success' });
        isAdminDirtyRef.current = false;
        setIsAdminDirty(false);
        if (onRefreshState) onRefreshState();
      } else {
        setAdminMsg({ text: data.error || 'Failed to update settings', type: 'error' });
      }
    } catch (err: any) {
      setAdminMsg({ text: 'Error saving settings: ' + err.message, type: 'error' });
    }
  };

  // Admin Trigger Roller Draw (Next Step or Specific Step)
  const handleAdminTriggerDraw = async (targetStep?: number) => {
    try {
      setAdminMsg(null);
      const stepToDraw = targetStep || ((luckyDraw?.currentDrawStep || 0) >= 5 ? 1 : (luckyDraw?.currentDrawStep || 0) + 1);

      const res = await fetch('/api/luckydraw/admin/trigger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          step: stepToDraw,
          forcedPrizes: forcedPrizesState,
          ticketPrice: adminTicketPrice === '' ? 100 : Number(adminTicketPrice),
          prizeAmount: adminPrizeAmount === '' ? 25000 : Number(adminPrizeAmount),
          secondPrizeAmount: adminSecondPrize === '' ? 10000 : Number(adminSecondPrize),
          thirdPrizeAmount: adminThirdPrize === '' ? 5000 : Number(adminThirdPrize),
          fourthPrizeAmount: adminFourthPrize === '' ? 2500 : Number(adminFourthPrize),
          fifthPrizeAmount: adminFifthPrize === '' ? 1500 : Number(adminFifthPrize),
          guaranteedPrizeAmount: adminGuaranteedPrize === '' ? 500 : Number(adminGuaranteedPrize),
        }),
      });
      const data = await res.json();

      if (res.ok && data.success && data.winningNumber) {
        if (data.luckyDraw?.rollingStartedAt) {
          lastSeenRollTimeRef.current = data.luckyDraw.rollingStartedAt;
        }
        // Keep prior drawn prizes during the 10-second roll so the current one only reveals when locked
        const stepTriggered = data.step || stepToDraw;
        const previousDrawnPrizes = (data.luckyDraw?.drawnPrizes || []).filter((p: any) => p.prizeRank < stepTriggered);
        if (data.luckyDraw) {
          setLuckyDraw({
            ...data.luckyDraw,
            drawnPrizes: previousDrawnPrizes,
            currentDrawStep: stepTriggered - 1,
          });
        }
        start10SecRollAnimation(
          data.winningNumber,
          data.winners || [],
          data.luckyDraw?.rollingStartedAt || Date.now(),
          stepTriggered,
          data.luckyDraw?.drawnPrizes || []
        );
      } else {
        setIsRolling(false);
        alert(data.error || 'Error triggering draw');
      }
    } catch (err: any) {
      setIsRolling(false);
      alert('Error triggering draw: ' + err.message);
    }
  };

  // Admin Assign / Gift Reserved Ticket Handler
  const handleAdminAssignTicket = async (ticketNumber: string) => {
    const targetUserId = assignTargetUsers[ticketNumber];
    const targetUser = users.find((u) => u.id === targetUserId);
    if (!targetUserId) {
      setAdminMsg({ text: `Please select a user to assign coupon #${ticketNumber}`, type: 'error' });
      return;
    }

    try {
      const res = await fetch('/api/luckydraw/admin/assign-ticket', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: targetUserId, ticketNumber }),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        setAdminMsg({ text: data.error || 'Failed to assign ticket', type: 'error' });
      } else {
        setAdminMsg({ text: `🎉 Success! Coupon #${ticketNumber} has been assigned to ${targetUser?.name || 'user'}!`, type: 'success' });
        fetchLuckyDraw();
        if (onRefreshState) onRefreshState();
      }
    } catch (err: any) {
      setAdminMsg({ text: 'Error assigning ticket: ' + err.message, type: 'error' });
    }
  };

  const userTickets =
    luckyDraw?.tickets?.filter(
      (t) => t.userId === currentUser.id || t.userNodeId === currentUser.nodeId || t.userId === currentUser.nodeId
    ) || [];

  const filteredAdminUsers = users.filter(
    (u) =>
      u.name.toLowerCase().includes(adminSearchUser.toLowerCase()) ||
      u.nodeId.toLowerCase().includes(adminSearchUser.toLowerCase())
  );

  const currentDrawnPrizes = luckyDraw?.drawnPrizes || [];
  const currentStepNum = luckyDraw?.currentDrawStep || 0;

  // Prize rank configuration summary
  const prizeCardsConfig = [
    { rank: 1, name: '1st Prize', amount: luckyDraw?.prizeAmount ?? 25000, badge: '🥇 1st', color: 'border-amber-500/60 text-amber-300 bg-amber-500/10' },
    { rank: 2, name: '2nd Prize', amount: luckyDraw?.secondPrizeAmount ?? 10000, badge: '🥈 2nd', color: 'border-purple-500/60 text-purple-300 bg-purple-500/10' },
    { rank: 3, name: '3rd Prize', amount: luckyDraw?.thirdPrizeAmount ?? 5000, badge: '🥉 3rd', color: 'border-cyan-500/60 text-cyan-300 bg-cyan-500/10' },
    { rank: 4, name: '4th Prize', amount: luckyDraw?.fourthPrizeAmount ?? 2500, badge: '⭐ 4th', color: 'border-emerald-500/60 text-emerald-300 bg-emerald-500/10' },
    { rank: 5, name: '5th Prize', amount: luckyDraw?.fifthPrizeAmount ?? 1500, badge: '🎖️ 5th', color: 'border-rose-500/60 text-rose-300 bg-rose-500/10' },
    { rank: 6, name: 'Guaranteed (45x)', amount: luckyDraw?.guaranteedPrizeAmount ?? 500, badge: '🎁 45 Series', color: 'border-yellow-500/60 text-yellow-300 bg-yellow-500/10' },
  ];

  return (
    <div className="max-w-3xl mx-auto px-3 sm:px-4 py-3 space-y-4 font-sans text-slate-100 pb-24">
      {/* 1. TOP HEADER BAR */}
      <header className="flex items-center justify-between pb-1">
        <div className="flex items-center gap-2">
          {onBack && (
            <button
              onClick={onBack}
              className="w-9 h-9 rounded-full bg-[#0b1430] border border-blue-900/60 hover:border-cyan-500/40 flex items-center justify-center text-slate-300 hover:text-white transition active:scale-95"
              title="Go Back"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
          )}
          <div className="flex items-center gap-2">
            <JalwaLogo size="sm" showSubtext={false} />
            <span className="text-xs font-black tracking-widest uppercase bg-gradient-to-r from-amber-300 via-yellow-200 to-amber-400 bg-clip-text text-transparent">
              Mega Lottery
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Customer Support */}
          <button
            onClick={() => setShowSupportModal(true)}
            className="w-9 h-9 rounded-full bg-[#0b1430] border border-blue-900/60 hover:border-cyan-500/40 flex items-center justify-center text-cyan-300 transition active:scale-95"
            title="Customer Support"
          >
            <Headphones className="w-4 h-4" />
          </button>

          {/* Sound FX Toggle */}
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

      {/* 2. TOP WALLET BALANCE CARD (Matching 1_8cbf79a2.jpeg & Jalwa-Game-Deposit_16b672e4.webp) */}
      <div className="rounded-2xl bg-gradient-to-r from-[#0d1e48] via-[#0b1739] to-[#08122c] border border-blue-900/40 p-3.5 shadow-xl">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-black text-white tracking-tight">
                ₹{((currentUser?.depositBalance || 0) + (currentUser?.winningBalance || 0) + (currentUser?.balance || 0)).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
              <button
                onClick={() => {
                  setIsRefreshing(true);
                  if (onRefreshState) onRefreshState();
                  fetchLuckyDraw();
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
              <span className="text-[10px] text-emerald-400 font-mono ml-1">
                Pure INR
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onOpenWithdraw && (
              <button
                onClick={onOpenWithdraw}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#ff4d4f] to-[#d9363e] hover:from-[#ff7875] hover:to-[#ff4d4f] text-white font-bold text-xs shadow-md transition active:scale-95"
              >
                Withdraw
              </button>
            )}

            {onOpenDeposit && (
              <button
                onClick={onOpenDeposit}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#10b981] to-[#059669] hover:from-[#34d399] hover:to-[#10b981] text-white font-bold text-xs shadow-md transition active:scale-95"
              >
                Deposit
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 3. MARQUEE ANNOUNCEMENT TICKER */}
      <div className="rounded-xl bg-[#09122c] border border-blue-900/50 p-2.5 flex items-center gap-2 overflow-hidden text-xs text-slate-300">
        <Volume2 className="w-4 h-4 text-cyan-400 shrink-0" />
        <div className="whitespace-nowrap overflow-hidden relative w-full">
          <div className="inline-block animate-marquee font-medium">
            🎉 Welcome to SportX 6-Digit Mega Lottery Draw! 1st Prize ₹{(luckyDraw?.prizeAmount ?? 25000).toLocaleString('en-IN')} INR • 45 Guaranteed Cash Winners • Next Draw: Sunday 9:00 PM • Pick your 6 lucky digits now!
          </div>
        </div>
      </div>

      {/* 4. PRIMARY TABS NAVIGATION */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-1">
        <button
          onClick={() => setActiveLotteryTab('draw')}
          className={`px-3.5 py-2 rounded-xl text-xs font-black transition whitespace-nowrap ${
            activeLotteryTab === 'draw'
              ? 'bg-gradient-to-r from-[#38bdf8] to-[#2dd4bf] text-[#070d1e] shadow-md'
              : 'bg-[#0b1433] text-slate-300 border border-blue-900/40 hover:text-white'
          }`}
        >
          🎯 Live Draw
        </button>

        <button
          onClick={() => setActiveLotteryTab('tickets')}
          className={`px-3.5 py-2 rounded-xl text-xs font-black transition whitespace-nowrap flex items-center gap-1 ${
            activeLotteryTab === 'tickets'
              ? 'bg-gradient-to-r from-[#38bdf8] to-[#2dd4bf] text-[#070d1e] shadow-md'
              : 'bg-[#0b1433] text-slate-300 border border-blue-900/40 hover:text-white'
          }`}
        >
          <Ticket className="w-3.5 h-3.5" />
          <span>My Coupons ({userTickets.length})</span>
        </button>

        <button
          onClick={() => setActiveLotteryTab('winners')}
          className={`px-3.5 py-2 rounded-xl text-xs font-black transition whitespace-nowrap flex items-center gap-1 ${
            activeLotteryTab === 'winners'
              ? 'bg-gradient-to-r from-[#38bdf8] to-[#2dd4bf] text-[#070d1e] shadow-md'
              : 'bg-[#0b1433] text-slate-300 border border-blue-900/40 hover:text-white'
          }`}
        >
          <Trophy className="w-3.5 h-3.5" />
          <span>Winners Hall</span>
        </button>

        <button
          onClick={() => setActiveLotteryTab('rules')}
          className={`px-3.5 py-2 rounded-xl text-xs font-black transition whitespace-nowrap flex items-center gap-1 ${
            activeLotteryTab === 'rules'
              ? 'bg-gradient-to-r from-[#38bdf8] to-[#2dd4bf] text-[#070d1e] shadow-md'
              : 'bg-[#0b1433] text-slate-300 border border-blue-900/40 hover:text-white'
          }`}
        >
          <HelpCircle className="w-3.5 h-3.5" />
          <span>Draw Rules</span>
        </button>

        {(currentUser.isAdmin || currentUser.nodeId === 'NX-ROOT01') && (
          <button
            onClick={() => setActiveLotteryTab('admin')}
            className={`px-3.5 py-2 rounded-xl text-xs font-black transition whitespace-nowrap flex items-center gap-1 ${
              activeLotteryTab === 'admin'
                ? 'bg-gradient-to-r from-rose-500 to-amber-500 text-black shadow-md'
                : 'bg-rose-950/40 text-rose-300 border border-rose-500/40 hover:text-white'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Admin Controls</span>
          </button>
        )}
      </div>

      {/* 5. TAB CONTENT: LIVE DRAW & BUY TICKETS */}
      {activeLotteryTab === 'draw' && (
        <div className="space-y-4">
          {/* PRIZE POOL OVERVIEW (6 TIERS DISPLAYED IN ₹ INR) */}
          <div className="rounded-3xl bg-gradient-to-br from-[#0c1b40] via-[#091433] to-[#060c22] border border-blue-900/50 p-4 sm:p-5 shadow-xl">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Crown className="w-4 h-4 text-amber-400" />
                <span className="text-xs font-black uppercase tracking-wider text-amber-300">
                  Prize Pool Breakdown
                </span>
              </div>
              <span className="text-[10px] text-cyan-400 font-bold bg-cyan-500/10 border border-cyan-500/30 px-2 py-0.5 rounded-full">
                5 Prizes + 45 Guaranteed
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
              {prizeCardsConfig.map((p) => {
                const prizeInr = p.amount;
                return (
                  <div
                    key={p.rank}
                    className={`rounded-2xl p-2.5 text-center border bg-[#060e26]/80 transition transform hover:scale-[1.02] ${p.color}`}
                  >
                    <div className="text-[10px] font-black uppercase tracking-wider mb-0.5">
                      {p.badge}
                    </div>
                    <div className="text-base sm:text-lg font-black text-white font-sans">
                      ₹{prizeInr.toLocaleString('en-IN')}
                    </div>
                    <div className="text-[9px] text-slate-400 font-mono">
                      INR Prize
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 6-DIGIT ROLLER SLOT REEL (Jalwa Neon Theme) */}
          <div
            className={`rounded-3xl p-4 sm:p-6 text-center relative overflow-hidden transition-all duration-300 border ${
              isRolling
                ? 'bg-[#091438] border-cyan-400 shadow-[0_0_50px_rgba(34,211,238,0.4)] ring-2 ring-cyan-500/40'
                : 'bg-[#08122e] border-blue-900/60 shadow-xl'
            }`}
          >
            {/* Top Stage Header */}
            <div className="flex flex-wrap items-center justify-between gap-2 mb-3 relative z-10">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                  <span>6-Digit Lottery Roller</span>
                  <span className="text-[10px] bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full border border-amber-500/40 font-bold">
                    {isRolling ? `Drawing ${currentRollingPrizeName}` : currentStepNum > 0 ? `Step ${currentStepNum}/5 Drawn` : 'Ready For Draw'}
                  </span>
                </span>
              </div>

              {/* Status Badge */}
              <div
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl border text-[11px] font-black uppercase ${
                  isRolling
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 animate-pulse'
                    : currentStepNum >= 5
                    ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                    : 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${isRolling ? 'bg-amber-400 animate-ping' : 'bg-emerald-400'}`} />
                <span>{isRolling ? `⚡ ROLLING (${rollSecondsLeft.toFixed(1)}s)` : currentStepNum >= 5 ? 'ROUND COMPLETED' : `STEP ${currentStepNum} OF 5`}</span>
              </div>
            </div>

            {/* 10-Second High-Voltage Tension Progress Bar */}
            <div className={`transition-all duration-300 overflow-hidden ${isRolling ? 'max-h-20 opacity-100 mb-3' : 'max-h-0 opacity-0 mb-0 pointer-events-none'}`}>
              <div className="bg-[#050c22] border border-cyan-500/40 rounded-2xl p-2.5 space-y-1 shadow-[0_0_20px_rgba(34,211,238,0.25)]">
                <div className="flex items-center justify-between text-[11px] font-bold">
                  <span className="flex items-center gap-1.5 text-cyan-300">
                    <Zap className="w-3.5 h-3.5 text-amber-400 animate-bounce" />
                    <span>DRAWING {currentRollingPrizeName.toUpperCase()}...</span>
                  </span>
                  <span className="font-mono text-amber-300 bg-amber-500/20 border border-amber-500/40 px-2 py-0.5 rounded-full text-[10px]">
                    {rollSecondsLeft.toFixed(1)}s remaining
                  </span>
                </div>
                <div className="w-full bg-slate-900 rounded-full h-2.5 border border-cyan-500/40 p-0.5 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-cyan-400 via-amber-400 to-emerald-400 transition-all duration-75"
                    style={{ width: `${Math.min(100, Math.max(0, rollProgress))}%` }}
                  />
                </div>
              </div>
            </div>

            {/* 6 Digit Slot Machine Reels */}
            <div className="my-3 py-3 px-2 sm:px-4 bg-[#050a1d] rounded-2xl border border-blue-900/60 shadow-inner w-full max-w-xl mx-auto">
              <div className="grid grid-cols-6 gap-1.5 sm:gap-2.5 select-none w-full">
                {displayDigits.map((digit, idx) => {
                  const isThisLocked = isRolling ? lockedReelMask[idx] : true;
                  return (
                    <div key={idx} className="flex flex-col items-center gap-1 w-full min-w-0">
                      {/* Reel Status Badge */}
                      {isRolling ? (
                        <div
                          className={`text-[8px] font-black uppercase px-1 py-0.5 rounded-full transition-all flex items-center justify-center gap-0.5 w-full truncate ${
                            !isThisLocked
                              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/50'
                              : 'bg-amber-500/30 text-amber-300 border border-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.5)]'
                          }`}
                        >
                          {isThisLocked ? (
                            <>
                              <Lock className="w-2 h-2 text-amber-400 shrink-0" />
                              <span>L#{idx + 1}</span>
                            </>
                          ) : (
                            <>
                              <Zap className="w-2 h-2 text-cyan-400 shrink-0" />
                              <span>ROLL</span>
                            </>
                          )}
                        </div>
                      ) : (
                        <div className="text-[8px] font-bold uppercase px-1 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700 w-full text-center">
                          #{idx + 1}
                        </div>
                      )}

                      {/* Digit Box (Jalwa Neon Typography) */}
                      <div
                        className={`w-full aspect-[3/4] max-w-[76px] rounded-2xl flex items-center justify-center font-black text-2xl sm:text-3xl md:text-4xl transition-all duration-150 font-sans ${
                          isRolling && !isThisLocked
                            ? 'bg-[#0c245c] text-[#00f59b] border-2 border-cyan-400 shadow-[0_0_20px_rgba(0,245,155,0.6)] animate-pulse'
                            : isRolling && isThisLocked
                            ? 'bg-gradient-to-b from-[#1c2c5c] to-[#0a183d] text-amber-300 border-2 border-amber-400 shadow-[0_0_25px_rgba(245,158,11,0.7)]'
                            : 'bg-[#0c245c] text-[#00f59b] border border-blue-500/30 shadow-[0_0_15px_rgba(0,245,155,0.25)]'
                        }`}
                      >
                        <span className="drop-shadow-[0_0_12px_rgba(0,245,155,0.6)]">{digit}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 5 SEQUENTIAL DRAWN TICKETS BOARD */}
            <div className="mt-4 p-3.5 bg-[#050c22] border border-blue-900/60 rounded-2xl space-y-2.5 text-left">
              <div className="flex items-center justify-between border-b border-blue-950 pb-2">
                <div className="flex items-center gap-1.5 text-cyan-300 font-bold text-xs">
                  <Layers className="w-3.5 h-3.5 text-amber-400" />
                  <span>Sequential 5 Drawn Tickets ({currentDrawnPrizes.length}/5 Revealed)</span>
                </div>
                <span className="text-[10px] text-slate-400">
                  Exact 6 Digits Match
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                {[1, 2, 3, 4, 5].map((step) => {
                  const drawn = currentDrawnPrizes.find((p) => p.prizeRank === step);
                  const prizeConf = prizeCardsConfig[step - 1];
                  const prizeInr = prizeConf.amount;

                  return (
                    <div
                      key={step}
                      className={`p-2.5 rounded-xl border flex flex-col justify-between text-left min-h-[96px] ${
                        drawn
                          ? 'bg-gradient-to-b from-[#0e1d44] to-[#071026] border-amber-400/80 shadow-[0_0_12px_rgba(245,158,11,0.25)]'
                          : 'bg-[#060c20]/80 border-blue-950/80 opacity-70'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-[10px] font-black uppercase text-amber-300">{prizeConf.badge}</span>
                        <span className="text-[11px] font-black text-emerald-400 font-sans">₹{prizeInr.toLocaleString('en-IN')}</span>
                      </div>

                      <div className="my-auto text-center py-1">
                        {drawn ? (
                          <div className="space-y-0.5">
                            <div className="text-base font-black font-mono tracking-widest text-amber-300 leading-tight">
                              #{drawn.ticketNumber}
                            </div>
                            <div className="text-[10px] font-bold text-white truncate max-w-[120px] mx-auto">
                              {drawn.userName ? `${drawn.userName}` : 'Winner'}
                            </div>
                          </div>
                        ) : (
                          <div className="text-[10px] text-slate-500 font-bold italic">
                            {isRolling && currentRollingStep === step ? '⚡ Rolling...' : 'Pending Draw'}
                          </div>
                        )}
                      </div>

                      <div className="text-[8px] text-slate-500 text-center">
                        {drawn ? `Revealed` : `Step ${step}`}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Winner Announcement Banner */}
            {winnerAnnouncedList && winnerAnnouncedList.length > 0 && (
              <div className="mt-3.5 p-3.5 bg-gradient-to-r from-amber-500/20 via-emerald-500/20 to-cyan-500/20 border-2 border-amber-400 rounded-2xl shadow-[0_0_25px_rgba(245,158,11,0.35)] space-y-2 animate-fade-in text-left">
                <div className="flex items-center justify-center gap-2 text-amber-300 font-black text-sm">
                  <Trophy className="w-4 h-4 text-amber-400" />
                  <span>🎉 STEP WINNERS ANNOUNCED ({winnerAnnouncedList.length}):</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 text-xs">
                  {winnerAnnouncedList.map((w, idx) => (
                    <div key={idx} className="bg-[#050a1d]/90 border border-amber-500/40 p-2.5 rounded-xl text-left space-y-1">
                      <div className="font-bold text-amber-300 flex items-center justify-between">
                        <span>{w.prizeTier || 'Winner'}</span>
                        <span className="text-emerald-400 font-black font-sans">+₹{w.prizeAmount.toLocaleString('en-IN')}</span>
                      </div>
                      <div className="text-[11px] text-white">
                        {w.userName} (<span className="text-cyan-300 font-mono">#{w.userNodeId}</span>)
                      </div>
                      <div className="text-[10px] text-slate-400">
                        Coupon: <strong className="text-amber-300 font-mono">#{w.ticketNumber}</strong>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Grand Draw Countdown Bar */}
            <div className="mt-4 pt-4 border-t border-blue-950 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2 text-slate-300">
                <Clock className="w-4 h-4 text-cyan-400" />
                <span>Weekly Mega Grand Draw (Sunday 9:00 PM):</span>
              </div>

              <div className="flex items-center gap-1.5 font-black font-mono">
                <div className="bg-[#091535] border border-amber-500/50 rounded-xl px-2.5 py-1 text-center min-w-[44px]">
                  <div className="text-sm text-amber-300">{String(timeLeft.days).padStart(2, '0')}</div>
                  <div className="text-[8px] text-amber-400 uppercase font-bold">Days</div>
                </div>
                <span className="text-cyan-400 font-bold">:</span>
                <div className="bg-[#091535] border border-cyan-500/40 rounded-xl px-2.5 py-1 text-center min-w-[44px]">
                  <div className="text-sm text-cyan-300">{String(timeLeft.hours).padStart(2, '0')}</div>
                  <div className="text-[8px] text-slate-400 uppercase font-bold">Hours</div>
                </div>
                <span className="text-cyan-400 font-bold">:</span>
                <div className="bg-[#091535] border border-cyan-500/40 rounded-xl px-2.5 py-1 text-center min-w-[44px]">
                  <div className="text-sm text-cyan-300">{String(timeLeft.minutes).padStart(2, '0')}</div>
                  <div className="text-[8px] text-slate-400 uppercase font-bold">Mins</div>
                </div>
                <span className="text-cyan-400 font-bold">:</span>
                <div className="bg-[#091535] border border-cyan-500/40 rounded-xl px-2.5 py-1 text-center min-w-[44px]">
                  <div className="text-sm text-emerald-300">{String(timeLeft.seconds).padStart(2, '0')}</div>
                  <div className="text-[8px] text-slate-400 uppercase font-bold">Secs</div>
                </div>
              </div>
            </div>
          </div>

          {/* 7. GET LUCKY COUPONS (BUY TICKETS SECTION) */}
          <div className="rounded-3xl bg-[#09122c] border border-blue-900/50 p-4 sm:p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-blue-950 pb-3">
              <div className="flex items-center gap-2 text-sm font-black text-white">
                <Ticket className="w-4 h-4 text-cyan-400" />
                <span>Get Lucky Coupons</span>
              </div>
              <div className="text-right">
                <span className="text-xs font-black text-amber-400 font-sans">
                  ₹{(luckyDraw?.ticketPrice ?? 100).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </span>
                <span className="text-[10px] text-slate-400 font-mono ml-1">
                  INR / Coupon
                </span>
              </div>
            </div>

            {/* Selection Mode Selector */}
            <div>
              <label className="text-xs text-slate-300 font-bold block mb-1.5">Coupon Selection Method:</label>
              <div className="grid grid-cols-2 gap-2 bg-[#050a1d] p-1.5 rounded-2xl border border-blue-950">
                <button
                  type="button"
                  onClick={() => setSelectionMode('custom')}
                  className={`py-2 px-3 rounded-xl text-xs font-black transition flex items-center justify-center gap-1.5 ${
                    selectionMode === 'custom'
                      ? 'bg-gradient-to-r from-cyan-400 to-blue-500 text-black shadow-md'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Custom Choice</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectionMode('random')}
                  className={`py-2 px-3 rounded-xl text-xs font-black transition flex items-center justify-center gap-1.5 ${
                    selectionMode === 'random'
                      ? 'bg-gradient-to-r from-cyan-400 to-blue-500 text-black shadow-md'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Quick Random Auto</span>
                </button>
              </div>
            </div>

            {/* Mode 1: Custom 6-Digit Picker */}
            {selectionMode === 'custom' ? (
              <div className="space-y-3 bg-[#050a1d] border border-blue-900/60 rounded-2xl p-3.5">
                <div className="flex items-center justify-between text-xs text-amber-300 font-bold">
                  <span>Enter 6-Digit Lucky Number:</span>
                  <button
                    type="button"
                    onClick={handleGenerateRandomCoupon}
                    className="text-[11px] text-cyan-400 hover:underline flex items-center gap-1 font-bold"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>Generate Random</span>
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    maxLength={6}
                    placeholder="e.g. 786910"
                    value={customCouponInput}
                    onChange={(e) => setCustomCouponInput(e.target.value.replace(/\D/g, ''))}
                    className="w-full bg-[#091535] border border-blue-900 rounded-xl px-3 py-2.5 text-center text-amber-300 font-black tracking-widest text-lg font-mono focus:outline-none focus:border-cyan-400"
                  />
                  <button
                    type="button"
                    onClick={handleAddCustomCoupon}
                    className="px-4 py-2.5 bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-300 hover:to-yellow-400 text-black font-black text-xs rounded-xl shrink-0 transition active:scale-95 shadow-md"
                  >
                    + Add
                  </button>
                </div>

                {/* Added Custom Coupons Chips */}
                {customCouponList.length > 0 && (
                  <div className="space-y-1.5 pt-2 border-t border-blue-950">
                    <div className="text-[10px] text-slate-400 font-bold uppercase">Chosen Coupons ({customCouponList.length}):</div>
                    <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto pr-1">
                      {customCouponList.map((num, idx) => (
                        <span
                          key={idx}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-[#091b40] border border-cyan-500/40 rounded-lg text-xs font-mono font-bold text-cyan-300"
                        >
                          #{num}
                          <button
                            type="button"
                            onClick={() => handleRemoveCustomCoupon(idx)}
                            className="text-slate-400 hover:text-rose-400 text-xs font-bold"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* Mode 2: Quick Quantity Chips for Random Mode */
              <div className="space-y-2">
                <label className="text-xs text-slate-300 font-bold">Select Quantity of Random Coupons:</label>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                  {[1, 3, 5, 10, 20, 50].map((qty) => (
                    <button
                      key={qty}
                      type="button"
                      onClick={() => setTicketQty(qty)}
                      className={`py-2 rounded-xl text-xs font-black transition active:scale-95 border ${
                        ticketQty === qty
                          ? 'bg-gradient-to-r from-cyan-400 to-blue-500 text-black border-cyan-400 shadow-md font-bold'
                          : 'bg-[#050a1d] border-blue-900/60 text-slate-300 hover:border-cyan-500/40 hover:text-white'
                      }`}
                    >
                      {qty} {qty === 1 ? 'Coupon' : 'Coupons'}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Cost Summary Box */}
            <div className="bg-[#050a1d] border border-blue-900/60 rounded-2xl p-3 space-y-1.5 text-xs">
              <div className="flex justify-between text-slate-400">
                <span>Total Coupons:</span>
                <span className="text-white font-bold font-mono">
                  {selectionMode === 'custom' && customCouponList.length > 0 ? customCouponList.length : ticketQty}
                </span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Unit Price:</span>
                <span className="text-white font-bold font-sans">
                  ₹{(luckyDraw?.ticketPrice ?? 100).toLocaleString('en-IN', { minimumFractionDigits: 2 })} INR
                </span>
              </div>
              <div className="pt-2 border-t border-blue-950 flex justify-between font-bold text-sm">
                <span className="text-cyan-300">Total Payable:</span>
                <div className="text-right">
                  <span className="text-amber-300 font-black text-base font-sans">
                    ₹{(
                      (luckyDraw?.ticketPrice ?? 100) *
                      (selectionMode === 'custom' && customCouponList.length > 0 ? customCouponList.length : ticketQty)
                    ).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </span>
                  <span className="text-[11px] text-emerald-400 font-mono block">
                    100% Pure INR
                  </span>
                </div>
              </div>
            </div>

            {/* Low Balance Warning & Recharge Link */}
            {(luckyDraw?.ticketPrice ?? 100) * (selectionMode === 'custom' && customCouponList.length > 0 ? customCouponList.length : ticketQty) >
              ((currentUser.depositBalance || 0) + (currentUser.winningBalance || 0) + (currentUser.balance || 0)) && (
              <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-1.5 text-amber-300 text-[11px]">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>
                    Need ₹{(
                      (luckyDraw?.ticketPrice ?? 100) * (selectionMode === 'custom' && customCouponList.length > 0 ? customCouponList.length : ticketQty) -
                      ((currentUser.depositBalance || 0) + (currentUser.winningBalance || 0) + (currentUser.balance || 0))
                    ).toFixed(2)} more
                  </span>
                </div>
                {onOpenDeposit && (
                  <button
                    onClick={onOpenDeposit}
                    className="px-2.5 py-1 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black font-black text-[11px] shadow-sm transition active:scale-95 shrink-0"
                  >
                    Deposit Now
                  </button>
                )}
              </div>
            )}

            {/* Purchase Action Button */}
            <button
              type="button"
              onClick={handleBuyTickets}
              disabled={buying}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-cyan-400 via-teal-400 to-emerald-400 hover:from-cyan-300 hover:to-emerald-300 text-black font-black text-sm shadow-[0_0_25px_rgba(34,211,238,0.4)] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 active:scale-95"
            >
              {buying ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-black" />
                  <span>Purchasing Coupons...</span>
                </>
              ) : (
                <>
                  <Ticket className="w-4 h-4 text-black" />
                  <span>
                    Buy{' '}
                    {selectionMode === 'custom' && customCouponList.length > 0 ? customCouponList.length : ticketQty}{' '}
                    Coupon(s) • ₹{(
                      (luckyDraw?.ticketPrice ?? 100) *
                      (selectionMode === 'custom' && customCouponList.length > 0 ? customCouponList.length : ticketQty)
                    ).toLocaleString('en-IN', { minimumFractionDigits: 2 })} INR
                  </span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* 6. TAB CONTENT: MY TICKETS */}
      {activeLotteryTab === 'tickets' && (
        <div className="rounded-3xl bg-[#09122c] border border-blue-900/50 p-4 sm:p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-blue-950 pb-3">
            <div className="flex items-center gap-2 text-sm font-black text-white">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>My Active Coupons ({userTickets.length})</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400">
                Total Pool: {luckyDraw?.tickets?.length || 0}
              </span>
              <button
                onClick={() => setActiveLotteryTab('draw')}
                className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 hover:bg-cyan-500/30 transition"
              >
                + Get More
              </button>
            </div>
          </div>

          {userTickets.length === 0 ? (
            <div className="py-12 text-center text-slate-400 space-y-3">
              <Ticket className="w-12 h-12 mx-auto text-slate-600 opacity-60" />
              <div className="text-sm font-bold text-slate-300">No Coupons Purchased in This Round</div>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Select your lucky 6-digit numbers in the Live Draw tab to take part in the 5-Step draw + 45 guaranteed prizes!
              </p>
              <button
                onClick={() => setActiveLotteryTab('draw')}
                className="mt-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 text-black font-black text-xs shadow-md transition active:scale-95"
              >
                Buy Lucky Coupons Now
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 max-h-[460px] overflow-y-auto pr-1">
              {userTickets.map((tkt) => (
                <div
                  key={tkt.id}
                  className="bg-[#050a1d] border border-blue-900/60 rounded-2xl p-3 text-center space-y-1 shadow-md relative overflow-hidden group hover:border-amber-400 transition"
                >
                  <div className="text-[10px] text-cyan-400 uppercase font-black tracking-wider">
                    Coupon No
                  </div>
                  <div className="text-lg font-black text-amber-300 font-mono tracking-widest">
                    #{tkt.ticketNumber}
                  </div>
                  <div className="text-[9px] text-slate-400 font-mono">
                    {new Date(tkt.purchasedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                  <span className="inline-block mt-1 text-[8px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                    Active In Pool
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 7. TAB CONTENT: WINNERS HALL */}
      {activeLotteryTab === 'winners' && (
        <div className="rounded-3xl bg-[#09122c] border border-blue-900/50 p-4 sm:p-6 shadow-xl space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-blue-950 pb-3 gap-3">
            <div className="flex items-center gap-2 text-sm font-black text-white">
              <Trophy className="w-4 h-4 text-amber-400" />
              <span>Past Champions Hall of Fame</span>
              {luckyDraw?.lastWinningNumber && (
                <span className="text-xs text-cyan-300 font-mono">
                  (Last: <strong className="text-amber-400">#{luckyDraw.lastWinningNumber}</strong>)
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={downloadPastResultsCSV}
                className="px-3 py-1 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                title="Export results to CSV"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
                <span>Export CSV</span>
              </button>

              {(currentUser.isAdmin || currentUser.nodeId === 'NX-ROOT01') && (
                <button
                  type="button"
                  onClick={() => {
                    if (!showClearConfirm) {
                      setShowClearConfirm(true);
                      setTimeout(() => setShowClearConfirm(false), 5000);
                    } else {
                      setShowClearConfirm(false);
                      handleClearPastHistory();
                    }
                  }}
                  className={`px-3 py-1 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer border ${
                    showClearConfirm
                      ? 'bg-rose-600 text-white border-rose-300 shadow-[0_0_15px_rgba(244,63,94,0.5)] animate-pulse'
                      : 'bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40'
                  }`}
                >
                  <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                  <span>{showClearConfirm ? 'Confirm Clear' : 'Clear History'}</span>
                </button>
              )}
            </div>
          </div>

          {/* Winner Tier Filter Tabs */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              type="button"
              onClick={() => setWinnerTierFilter('all')}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition border ${
                winnerTierFilter === 'all'
                  ? 'bg-cyan-500/30 border-cyan-400 text-cyan-200'
                  : 'bg-[#050a1d] border-blue-950 text-slate-400 hover:text-white'
              }`}
            >
              All ({luckyDraw?.pastWinners?.length || 0})
            </button>
            <button
              type="button"
              onClick={() => setWinnerTierFilter('1st')}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition border ${
                winnerTierFilter === '1st'
                  ? 'bg-amber-500/30 border-amber-400 text-amber-200 shadow-sm'
                  : 'bg-[#050a1d] border-blue-950 text-amber-400/80 hover:text-amber-300'
              }`}
            >
              🥇 1st (₹{(luckyDraw?.prizeAmount ?? 25000).toLocaleString('en-IN')})
            </button>
            <button
              type="button"
              onClick={() => setWinnerTierFilter('2nd')}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition border ${
                winnerTierFilter === '2nd'
                  ? 'bg-purple-500/30 border-purple-400 text-purple-200 shadow-sm'
                  : 'bg-[#050a1d] border-blue-950 text-purple-300/80 hover:text-purple-200'
              }`}
            >
              🥈 2nd (₹{(luckyDraw?.secondPrizeAmount ?? 10000).toLocaleString('en-IN')})
            </button>
            <button
              type="button"
              onClick={() => setWinnerTierFilter('3rd')}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition border ${
                winnerTierFilter === '3rd'
                  ? 'bg-cyan-500/30 border-cyan-400 text-cyan-200 shadow-sm'
                  : 'bg-[#050a1d] border-blue-950 text-cyan-400/80 hover:text-cyan-300'
              }`}
            >
              🥉 3rd (₹{(luckyDraw?.thirdPrizeAmount ?? 5000).toLocaleString('en-IN')})
            </button>
            <button
              type="button"
              onClick={() => setWinnerTierFilter('guaranteed')}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition border ${
                winnerTierFilter === 'guaranteed'
                  ? 'bg-yellow-500/30 border-yellow-400 text-yellow-200 shadow-sm'
                  : 'bg-[#050a1d] border-blue-950 text-yellow-400/80 hover:text-yellow-300'
              }`}
            >
              🎁 Guaranteed (45x)
            </button>
          </div>

          {/* Filtered Winners Grid */}
          {(() => {
            const past = luckyDraw?.pastWinners || [];
            const filtered = past.filter((win) => {
              if (winnerTierFilter === '1st') return win.prizeTier?.toLowerCase().includes('1st');
              if (winnerTierFilter === '2nd') return win.prizeTier?.toLowerCase().includes('2nd');
              if (winnerTierFilter === '3rd') return win.prizeTier?.toLowerCase().includes('3rd');
              if (winnerTierFilter === '4th') return win.prizeTier?.toLowerCase().includes('4th');
              if (winnerTierFilter === '5th') return win.prizeTier?.toLowerCase().includes('5th');
              if (winnerTierFilter === 'guaranteed') return win.prizeTier?.toLowerCase().includes('guaranteed');
              return true;
            });

            if (filtered.length === 0) {
              return (
                <div className="text-center py-10 text-slate-400 text-xs space-y-1">
                  <Trophy className="w-8 h-8 mx-auto text-slate-600 opacity-60" />
                  <div className="font-bold text-slate-300">No winners found for selected prize tier.</div>
                  <p className="text-slate-500 text-[11px]">Winners appear automatically when draws complete.</p>
                </div>
              );
            }

            return (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {filtered.map((win) => {
                  const is1st = win.prizeTier?.toLowerCase().includes('1st');
                  const is2nd = win.prizeTier?.toLowerCase().includes('2nd');
                  const isGuaranteed = win.prizeTier?.toLowerCase().includes('guaranteed');

                  const cardStyle = is1st
                    ? 'border-amber-500/50 shadow-[0_0_15px_rgba(245,158,11,0.2)]'
                    : is2nd
                    ? 'border-purple-500/50 shadow-[0_0_15px_rgba(168,85,247,0.2)]'
                    : isGuaranteed
                    ? 'border-yellow-500/50 shadow-[0_0_15px_rgba(234,179,8,0.2)]'
                    : 'border-cyan-500/50 shadow-[0_0_15px_rgba(6,182,212,0.2)]';

                  const badgeStyle = is1st
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                    : is2nd
                    ? 'bg-purple-500/20 text-purple-300 border-purple-500/40'
                    : isGuaranteed
                    ? 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40'
                    : 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40';

                  const winInr = win.prizeAmount;

                  return (
                    <div key={win.id} className={`bg-[#050a1d] border rounded-2xl p-3.5 flex items-center justify-between gap-3 ${cardStyle}`}>
                      <div className="space-y-1">
                        <div className="text-xs font-black text-white flex items-center gap-1.5">
                          <Crown className="w-3.5 h-3.5 text-amber-400" />
                          <span>{win.userName}</span>
                        </div>
                        <div className="text-[10px] text-slate-400">
                          Node: <span className="text-cyan-300 font-mono">#{win.userNodeId}</span>
                        </div>
                        <div className="text-[10px] text-slate-400">
                          Coupon: <span className="text-amber-300 font-black font-mono">#{win.ticketNumber}</span>
                        </div>
                        {win.prizeTier && (
                          <div className={`text-[9px] font-bold px-2 py-0.5 rounded-md border inline-block ${badgeStyle}`}>
                            {win.prizeTier}
                          </div>
                        )}
                      </div>

                      <div className="text-right">
                        <div className="text-sm font-black text-emerald-400 font-sans">+₹{winInr.toLocaleString('en-IN')}</div>
                        <div className="text-[9px] text-slate-500 font-mono">INR Cash Prize</div>
                        <div className="text-[9px] text-slate-500">{new Date(win.wonAt).toLocaleDateString()}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })()}
        </div>
      )}

      {/* 8. TAB CONTENT: RULES & TRANSPARENCY */}
      {activeLotteryTab === 'rules' && (
        <div className="rounded-3xl bg-[#09122c] border border-blue-900/50 p-4 sm:p-6 shadow-xl space-y-4">
          <div className="flex items-center gap-2 border-b border-blue-950 pb-3 text-sm font-black text-white">
            <HelpCircle className="w-4 h-4 text-cyan-400" />
            <span>Official SportX Mega Lottery Rules & Matching System</span>
          </div>

          <div className="space-y-3 text-xs text-slate-300 leading-relaxed">
            <div className="p-3.5 rounded-2xl bg-[#050a1d] border border-amber-500/20 space-y-1">
              <span className="font-bold text-amber-300 block text-sm">🥇 1st to 5th Grand Prizes (Exact 6-Digit Match)</span>
              <p>
                Each coupon consists of a unique 6-digit number (e.g. <strong>786910</strong>). In each round, the slot reel rolls 5 times sequentially to reveal 1st, 2nd, 3rd, 4th, and 5th Prize winners. If your coupon matches all 6 digits of that step, you win the top jackpot!
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-[#050a1d] border border-yellow-500/20 space-y-1">
              <span className="font-bold text-yellow-300 block text-sm">🎁 45 Guaranteed Cash Winners (Last 5 Digits Match)</span>
              <p>
                Across all 5 prize draws, any member whose coupon matches the <strong>last 5 digits</strong> across the 9 other series (e.g. series 0 to 9) wins a guaranteed cash reward automatically! That is 9 winners per step = <strong>45 total guaranteed winners</strong> every single round.
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-[#050a1d] border border-emerald-500/20 space-y-1">
              <span className="font-bold text-emerald-400 block text-sm">🤝 10% Direct Seller Referral Bonus</span>
              <p>
                Whenever someone you sponsor purchases lucky coupons, you instantly receive a <strong>10% Direct Seller Bonus</strong> credited immediately to your wallet. Plus, an additional 10% Royalty is awarded to sponsors whenever their direct members win any grand prize!
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-[#050a1d] border border-cyan-500/20 space-y-1">
              <span className="font-bold text-cyan-300 block text-sm">🔒 Provably Fair & Instant Payouts</span>
              <p>
                Winnings are deposited straight into your Winning Wallet with zero delay and can be withdrawn or used to play any SportX games.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 9. TAB CONTENT: ADMIN CONTROLS */}
      {activeLotteryTab === 'admin' && (currentUser.isAdmin || currentUser.nodeId === 'NX-ROOT01') && (
        <div className="rounded-3xl bg-[#0d091a] border-2 border-rose-500/60 p-4 sm:p-6 shadow-2xl space-y-5">
          <div className="flex items-center justify-between border-b border-rose-500/30 pb-3">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-rose-400" />
              <span className="text-sm font-black text-rose-300 uppercase tracking-wider">
                Admin Sequential Lucky Draw Control
              </span>
            </div>
            <span className="text-xs bg-rose-500/20 text-rose-300 border border-rose-500/40 px-2.5 py-1 rounded-full font-bold">
              Root Master Access
            </span>
          </div>

          {adminMsg && (
            <div
              className={`p-3 rounded-xl text-xs font-bold border ${
                adminMsg.type === 'success'
                  ? 'bg-emerald-950/80 border-emerald-500/50 text-emerald-300'
                  : 'bg-rose-950/80 border-rose-500/50 text-rose-300'
              }`}
            >
              {adminMsg.text}
            </div>
          )}

          {/* Sequential 5-Step Game Play Trigger Bar */}
          <div className="bg-[#050814] border-2 border-amber-500/50 rounded-2xl p-4 space-y-3">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
              <div>
                <div className="text-xs font-black text-amber-300 flex items-center gap-2">
                  <Play className="w-4 h-4 text-amber-400 fill-amber-400" />
                  <span>ELECTRIC 5-STEP GAME PLAY CONTROLLER</span>
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Press "Game Play" 5 times sequentially. Each press rolls the 10-second electric roller and reveals one prize on the board!
                </p>
              </div>

              <button
                type="button"
                onClick={handleResetDrawRound}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-bold transition flex items-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5 text-cyan-400" />
                <span>Reset Round (Step 1)</span>
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {[1, 2, 3, 4, 5].map((step) => {
                const prizeName = prizeCardsConfig[step - 1].name;
                const prizeAmt = prizeCardsConfig[step - 1].amount;
                const isDrawn = currentDrawnPrizes.some((p) => p.prizeRank === step);
                const isNextToDraw = (luckyDraw?.currentDrawStep || 0) + 1 === step;

                return (
                  <button
                    key={step}
                    type="button"
                    onClick={() => handleAdminTriggerDraw(step)}
                    disabled={isRolling}
                    className={`p-3 rounded-xl border font-bold text-xs transition flex flex-col items-center justify-center gap-1 cursor-pointer disabled:opacity-50 ${
                      isNextToDraw
                        ? 'bg-gradient-to-b from-amber-500 to-amber-600 text-black border-amber-300 shadow-[0_0_20px_rgba(245,158,11,0.5)] animate-pulse'
                        : isDrawn
                        ? 'bg-emerald-950/60 text-emerald-300 border-emerald-500/50'
                        : 'bg-slate-900/80 text-slate-300 border-slate-700 hover:bg-slate-800'
                    }`}
                  >
                    <span className="text-[10px] uppercase font-black">{isDrawn ? '✓ Drawn' : `Press #${step}`}</span>
                    <span className="font-black text-sm">{prizeName}</span>
                    <span className="text-[10px] opacity-80">₹{prizeAmt.toLocaleString('en-IN')} INR</span>
                  </button>
                );
              })}
            </div>

            <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
              <span className="text-slate-400">
                Next Action:{' '}
                <strong className="text-amber-300">
                  {(luckyDraw?.currentDrawStep || 0) >= 5
                    ? 'All 5 Prizes Drawn! Guaranteed 45 Prizes Distributed.'
                    : `Step ${(luckyDraw?.currentDrawStep || 0) + 1} of 5 (${prizeCardsConfig[luckyDraw?.currentDrawStep || 0]?.name})`}
                </strong>
              </span>

              <button
                type="button"
                onClick={() => handleAdminTriggerDraw()}
                disabled={isRolling}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-gradient-to-r from-rose-500 via-amber-500 to-emerald-400 text-black font-black text-xs shadow-[0_0_20px_rgba(245,158,11,0.4)] transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 active:scale-95"
              >
                <Play className="w-3.5 h-3.5 fill-black" />
                <span>
                  {(luckyDraw?.currentDrawStep || 0) >= 5 ? '⚡ START NEW ROUND (STEP 1)' : `⚡ GAME PLAY (TRIGGER STEP ${(luckyDraw?.currentDrawStep || 0) + 1})`}
                </span>
              </button>
            </div>
          </div>

          {/* Active Sold Coupons Table & CSV Export */}
          <div className="bg-[#050814] border border-blue-900/60 rounded-2xl p-4 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-blue-950 pb-3">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4 text-cyan-400" />
                <span className="text-xs font-bold text-cyan-200">Active Pool Sold Coupons ({luckyDraw?.tickets?.length || 0})</span>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={() => setShowActiveCouponsList(!showActiveCouponsList)}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                >
                  <ListFilter className="w-3.5 h-3.5 text-cyan-300" />
                  <span>{showActiveCouponsList ? 'Hide Coupons Table' : 'View Sold Coupons'}</span>
                </button>

                <button
                  type="button"
                  onClick={downloadActiveCouponsCSV}
                  className="px-3 py-1.5 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-sm"
                >
                  <Download className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Download Active Coupons (CSV)</span>
                </button>
              </div>
            </div>

            {showActiveCouponsList && (
              <div className="space-y-3 pt-1">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="Filter active coupons by Ticket #, Name or Node ID..."
                    value={adminCouponSearch}
                    onChange={(e) => setAdminCouponSearch(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 bg-[#0a0f1d] border border-blue-950 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
                  />
                </div>

                <div className="max-h-60 overflow-y-auto border border-blue-950 rounded-xl bg-[#030610]">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-slate-900/90 text-slate-400 font-bold sticky top-0 border-b border-blue-950">
                      <tr>
                        <th className="p-2 pl-3">Ticket #</th>
                        <th className="p-2">User / Node ID</th>
                        <th className="p-2">Price</th>
                        <th className="p-2 text-center">Set Forced Step</th>
                        <th className="p-2 pr-3 text-right">Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-blue-950/60 font-mono">
                      {(() => {
                        const tkts = luckyDraw?.tickets || [];
                        const filteredTkts = tkts.filter(
                          (t) =>
                            t.ticketNumber.includes(adminCouponSearch) ||
                            (t.userName || '').toLowerCase().includes(adminCouponSearch.toLowerCase()) ||
                            (t.userNodeId || '').toLowerCase().includes(adminCouponSearch.toLowerCase())
                        );
                        if (filteredTkts.length === 0) {
                          return (
                            <tr>
                              <td colSpan={5} className="p-4 text-center text-slate-500 text-xs">
                                No matching active coupons found in current pool.
                              </td>
                            </tr>
                          );
                        }
                        return filteredTkts.map((tkt, idx) => (
                          <tr key={tkt.id || idx} className="hover:bg-slate-800/40 transition">
                            <td className="p-2 pl-3 font-bold text-amber-300">#{tkt.ticketNumber}</td>
                            <td className="p-2">
                              <div className="font-bold text-white font-sans">{tkt.userName || 'User'}</div>
                              <div className="text-[10px] text-slate-400">#{tkt.userNodeId || tkt.userId}</div>
                            </td>
                            <td className="p-2 text-cyan-300 font-bold">₹{(tkt.price ?? 100).toLocaleString('en-IN')} INR</td>
                            <td className="p-2 text-center">
                              <div className="flex items-center justify-center gap-1">
                                {([1, 2, 3, 4, 5] as const).map((st) => (
                                  <button
                                    key={st}
                                    type="button"
                                    onClick={() => {
                                      setForcedPrizesState((prev) => ({
                                        ...prev,
                                        [String(st)]: { userId: tkt.userId, ticketNumber: tkt.ticketNumber },
                                      }));
                                    }}
                                    className={`px-1.5 py-0.5 rounded text-[9px] font-bold transition cursor-pointer border ${
                                      forcedPrizesState[String(st) as '1' | '2' | '3' | '4' | '5']?.ticketNumber === tkt.ticketNumber
                                        ? 'bg-amber-500 text-black border-amber-300'
                                        : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                                    }`}
                                  >
                                    #{st}
                                  </button>
                                ))}
                              </div>
                            </td>
                            <td className="p-2 pr-3 text-right text-[10px] text-slate-400">
                              {tkt.purchasedAt ? new Date(tkt.purchasedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'}
                            </td>
                          </tr>
                        ));
                      })()}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          {/* Forced Winner Selection for 1st to 5th Prizes */}
          <div className="bg-[#05050f] border border-amber-500/40 rounded-2xl p-4 space-y-4 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-blue-950 pb-3">
              <div>
                <div className="text-xs font-black text-amber-300 flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-amber-400" />
                  <span>ADMIN WINNER CONTROLLER (1st to 5th PRIZES)</span>
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Select any registered member or enter custom 6-digit coupon for each prize slot (1st, 2nd, 3rd, 4th, 5th).
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleAdminSaveConfig()}
                  className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-black text-xs font-black rounded-xl transition flex items-center gap-1.5 shadow-md cursor-pointer"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Save Selections</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const cleared = {
                      '1': { userId: '', ticketNumber: '' },
                      '2': { userId: '', ticketNumber: '' },
                      '3': { userId: '', ticketNumber: '' },
                      '4': { userId: '', ticketNumber: '' },
                      '5': { userId: '', ticketNumber: '' },
                    };
                    setForcedPrizesState(cleared);
                    handleAdminSaveConfig({ forcedPrizes: cleared });
                  }}
                  className="px-3 py-1.5 bg-rose-500/20 text-rose-300 border border-rose-500/40 hover:bg-rose-500/30 text-xs font-bold rounded-xl transition flex items-center gap-1 cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Clear All</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              {([1, 2, 3, 4, 5] as const).map((step) => {
                const stKey = String(step) as '1' | '2' | '3' | '4' | '5';
                const prizeName = prizeCardsConfig[step - 1].name;
                const prizeAmt = prizeCardsConfig[step - 1].amount;
                const currentForced = forcedPrizesState[stKey];
                const chosenUser = users.find((u) => u.id === currentForced.userId);
                const userCoupons = luckyDraw?.tickets?.filter((t) => t.userId === currentForced.userId) || [];

                return (
                  <div
                    key={step}
                    className={`rounded-2xl p-3 space-y-2 border transition-all ${
                      currentForced.userId || currentForced.ticketNumber
                        ? 'bg-gradient-to-b from-[#0f172a] to-[#080d1a] border-amber-400/80 shadow-md'
                        : 'bg-[#060a15] border-blue-950'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-amber-300">{prizeName}</span>
                      <span className="text-[10px] font-bold text-emerald-400 font-mono">₹{prizeAmt.toLocaleString('en-IN')} INR</span>
                    </div>

                    <div>
                      <label className="text-[9px] text-slate-400 font-bold block mb-1">
                        Select Winning Member:
                      </label>
                      <select
                        value={currentForced.userId}
                        onChange={(e) => {
                          const val = e.target.value;
                          const updated = {
                            ...forcedPrizesState,
                            [stKey]: { ...forcedPrizesState[stKey], userId: val },
                          };
                          setForcedPrizesState(updated);
                          handleAdminSaveConfig({ forcedPrizes: updated });
                        }}
                        className="w-full p-2 bg-[#02050e] border border-blue-950 rounded-xl text-[11px] text-amber-300 font-bold focus:outline-none focus:border-amber-500 cursor-pointer"
                      >
                        <option value="">-- Random Member (System Pick) --</option>
                        {users.map((u) => {
                          const count = luckyDraw?.tickets?.filter((t) => t.userId === u.id).length || 0;
                          return (
                            <option key={u.id} value={u.id}>
                              #{u.nodeId} - {u.name} ({count} tickets)
                            </option>
                          );
                        })}
                      </select>
                    </div>

                    {chosenUser && (
                      <div className="bg-[#020612] p-1.5 rounded-lg border border-cyan-500/30 text-[10px] space-y-0.5">
                        <div className="text-cyan-300 font-bold truncate">✓ {chosenUser.name}</div>
                        <div className="text-slate-400 text-[9px]">
                          Active Tickets: <strong className="text-amber-400">{userCoupons.length}</strong>
                          {userCoupons.length === 0 && ' (Auto-gift on draw)'}
                        </div>
                      </div>
                    )}

                    <div>
                      <label className="text-[9px] text-slate-400 font-bold block mb-1">
                        Or Specific 6-Digit Ticket:
                      </label>
                      <input
                        type="text"
                        maxLength={6}
                        placeholder="e.g. 786910"
                        value={currentForced.ticketNumber}
                        onChange={(e) => {
                          const val = e.target.value.replace(/\D/g, '');
                          const updated = {
                            ...forcedPrizesState,
                            [stKey]: { ...forcedPrizesState[stKey], ticketNumber: val },
                          };
                          setForcedPrizesState(updated);
                        }}
                        onBlur={() => {
                          handleAdminSaveConfig();
                        }}
                        className="w-full p-1.5 bg-[#02050e] border border-blue-950 rounded-xl text-xs text-amber-300 placeholder-slate-600 focus:outline-none focus:border-amber-500 font-mono tracking-widest font-bold text-center"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Configure Prize Amounts (₹ INR) */}
          <div className="bg-[#050814] border border-blue-900/60 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-blue-950 pb-2">
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-cyan-400" />
                <span className="text-xs font-bold text-cyan-200">Configure Prize Pool Amounts (₹ INR)</span>
                {isAdminDirty && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse font-bold">
                    Unsaved
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={() => handleAdminSaveConfig()}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                  isAdminDirty
                    ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-black font-black shadow-md border border-amber-300'
                    : 'bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40'
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{isAdminDirty ? 'Save Amounts Now' : 'Save Amounts'}</span>
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3">
              <div>
                <label className="text-[10px] text-slate-400 font-bold block">Ticket Price (₹):</label>
                <input
                  type="number"
                  min="1"
                  step="any"
                  value={adminTicketPrice}
                  onChange={(e) => {
                    const val = e.target.value === '' ? '' : Number(e.target.value);
                    setAdminTicketPrice(val);
                    isAdminDirtyRef.current = true;
                    setIsAdminDirty(true);
                  }}
                  className="w-full mt-1 p-2 bg-[#02050e] border border-slate-700 rounded-xl text-xs text-white font-bold focus:border-amber-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[10px] text-amber-400 font-bold block">🥇 1st Prize (₹):</label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={adminPrizeAmount}
                  onChange={(e) => {
                    const val = e.target.value === '' ? '' : Number(e.target.value);
                    setAdminPrizeAmount(val);
                    isAdminDirtyRef.current = true;
                    setIsAdminDirty(true);
                  }}
                  className="w-full mt-1 p-2 bg-[#02050e] border border-amber-500/50 rounded-xl text-xs text-amber-400 font-bold focus:border-amber-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[10px] text-purple-400 font-bold block">🥈 2nd Prize (₹):</label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={adminSecondPrize}
                  onChange={(e) => {
                    const val = e.target.value === '' ? '' : Number(e.target.value);
                    setAdminSecondPrize(val);
                    isAdminDirtyRef.current = true;
                    setIsAdminDirty(true);
                  }}
                  className="w-full mt-1 p-2 bg-[#02050e] border border-purple-500/50 rounded-xl text-xs text-purple-300 font-bold focus:border-purple-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[10px] text-cyan-400 font-bold block">🥉 3rd Prize (₹):</label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={adminThirdPrize}
                  onChange={(e) => {
                    const val = e.target.value === '' ? '' : Number(e.target.value);
                    setAdminThirdPrize(val);
                    isAdminDirtyRef.current = true;
                    setIsAdminDirty(true);
                  }}
                  className="w-full mt-1 p-2 bg-[#02050e] border border-cyan-500/50 rounded-xl text-xs text-cyan-300 font-bold focus:border-cyan-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[10px] text-emerald-400 font-bold block">⭐ 4th Prize (₹):</label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={adminFourthPrize}
                  onChange={(e) => {
                    const val = e.target.value === '' ? '' : Number(e.target.value);
                    setAdminFourthPrize(val);
                    isAdminDirtyRef.current = true;
                    setIsAdminDirty(true);
                  }}
                  className="w-full mt-1 p-2 bg-[#02050e] border border-emerald-500/50 rounded-xl text-xs text-emerald-300 font-bold focus:border-emerald-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[10px] text-rose-400 font-bold block">🎖️ 5th Prize (₹):</label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={adminFifthPrize}
                  onChange={(e) => {
                    const val = e.target.value === '' ? '' : Number(e.target.value);
                    setAdminFifthPrize(val);
                    isAdminDirtyRef.current = true;
                    setIsAdminDirty(true);
                  }}
                  className="w-full mt-1 p-2 bg-[#02050e] border border-rose-500/50 rounded-xl text-xs text-rose-300 font-bold focus:border-rose-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[10px] text-yellow-400 font-bold block">🎁 Guaranteed (₹):</label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={adminGuaranteedPrize}
                  onChange={(e) => {
                    const val = e.target.value === '' ? '' : Number(e.target.value);
                    setAdminGuaranteedPrize(val);
                    isAdminDirtyRef.current = true;
                    setIsAdminDirty(true);
                  }}
                  className="w-full mt-1 p-2 bg-[#02050e] border border-yellow-500/50 rounded-xl text-xs text-yellow-300 font-bold focus:border-yellow-400 focus:outline-none"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 10. FLOATING JALWA BADGES (Green Dragon & Cyan Jalwa Support) */}
      <div className="fixed right-3 bottom-24 z-30 flex flex-col gap-2 pointer-events-auto">
        {/* Green Dragon Token */}
        <div
          onClick={() => setShowRulesModal(true)}
          className="w-12 h-12 rounded-full bg-gradient-to-tr from-emerald-600 to-teal-400 p-0.5 shadow-[0_4px_15px_rgba(16,185,129,0.5)] cursor-pointer hover:scale-110 active:scale-95 transition"
          title="Lottery Draw Rules"
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

      {/* 11. 24/7 SUPPORT MODAL */}
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

            <h3 className="text-lg font-black text-white mb-1">SportX 24/7 Lottery Support</h3>
            <p className="text-xs text-slate-300 mb-4">
              Need assistance with coupon numbers, prize claims, or draw schedules? We are here 24/7.
            </p>

            <div className="space-y-2 text-xs font-mono">
              <div className="p-3 rounded-xl bg-[#080d20] border border-blue-900/50 text-cyan-300">
                Telegram: @SportXOfficialSupport
              </div>
              <div className="p-3 rounded-xl bg-[#080d20] border border-blue-900/50 text-emerald-300">
                Live Support: 24/7 Response Time &lt; 2 mins
              </div>
            </div>

            <button
              onClick={() => setShowSupportModal(false)}
              className="w-full mt-5 py-2.5 rounded-xl bg-cyan-400 text-black font-black text-xs shadow-lg"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* 12. RULES MODAL */}
      {showRulesModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#0b1430] border border-cyan-500/40 rounded-3xl max-w-sm w-full p-6 shadow-2xl relative">
            <button
              onClick={() => setShowRulesModal(false)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-800 text-slate-300 hover:text-white flex items-center justify-center"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="w-12 h-12 rounded-2xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-300 mb-3">
              <HelpCircle className="w-6 h-6" />
            </div>

            <h3 className="text-lg font-black text-white mb-2">Mega Lottery Rules</h3>
            <div className="space-y-2 text-xs text-slate-300 max-h-72 overflow-y-auto pr-1">
              <div className="p-2.5 rounded-xl bg-[#080d20] border border-blue-900/50">
                <span className="font-bold text-amber-300 block mb-0.5">🥇 Exact 6 Digits Match</span>
                Matches all 6 digits of that step's roller to win the 1st to 5th Grand Prize.
              </div>
              <div className="p-2.5 rounded-xl bg-[#080d20] border border-blue-900/50">
                <span className="font-bold text-yellow-300 block mb-0.5">🎁 45 Guaranteed Winners</span>
                Matches last 5 digits across all 9 series for all 5 steps to win guaranteed cash rewards!
              </div>
              <div className="p-2.5 rounded-xl bg-[#080d20] border border-blue-900/50">
                <span className="font-bold text-emerald-400 block mb-0.5">🤝 10% Direct Bonus</span>
                10% direct sponsor bonus on every coupon purchase + 10% winner royalty.
              </div>
            </div>

            <button
              onClick={() => setShowRulesModal(false)}
              className="w-full mt-4 py-2.5 rounded-xl bg-cyan-400 text-black font-black text-xs shadow-lg"
            >
              Got it!
            </button>
          </div>
        </div>
      )}

      {/* 13. INLINE TOAST NOTIFICATION */}
      {localToast && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 pointer-events-none animate-fade-in">
          <div
            className={`px-4 py-2 rounded-2xl shadow-2xl border text-xs font-black flex items-center gap-2 ${
              localToast.type === 'success'
                ? 'bg-emerald-950/95 text-emerald-200 border-emerald-400'
                : 'bg-rose-950/95 text-rose-200 border-rose-400'
            }`}
          >
            {localToast.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            )}
            <span>{localToast.message}</span>
          </div>
        </div>
      )}
    </div>
  );
};
