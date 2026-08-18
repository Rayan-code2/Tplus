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
} from 'lucide-react';
import { User, LuckyDrawState, DrawnPrizeTicket, LuckyDrawWinner } from '../types';

interface LuckyDrawViewProps {
  currentUser: User;
  users: User[];
  onOpenDeposit?: () => void;
  onOpenWithdraw?: () => void;
  onRefreshState?: () => void;
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
}) => {
  const [luckyDraw, setLuckyDraw] = useState<LuckyDrawState | null>(null);
  const [loading, setLoading] = useState(false);
  const [buying, setBuying] = useState(false);
  const [ticketQty, setTicketQty] = useState(1);
  const [selectionMode, setSelectionMode] = useState<'random' | 'custom'>('custom');
  const [customCouponInput, setCustomCouponInput] = useState<string>('');
  const [customCouponList, setCustomCouponList] = useState<string[]>([]);

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

  const [adminTicketPrice, setAdminTicketPrice] = useState<number | string>(5);
  const [adminPrizeAmount, setAdminPrizeAmount] = useState<number | string>(250);
  const [adminSecondPrize, setAdminSecondPrize] = useState<number | string>(100);
  const [adminThirdPrize, setAdminThirdPrize] = useState<number | string>(50);
  const [adminFourthPrize, setAdminFourthPrize] = useState<number | string>(25);
  const [adminFifthPrize, setAdminFifthPrize] = useState<number | string>(15);
  const [adminGuaranteedPrize, setAdminGuaranteedPrize] = useState<number | string>(5);
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
    const headers = ['Ticket Number', 'User Node ID', 'User Name', 'User ID', 'Price (USDT)', 'Purchased At'];
    const csvRows = [
      headers.join(','),
      ...tickets.map((t) =>
        [
          `"${t.ticketNumber}"`,
          `"${t.userNodeId || ''}"`,
          `"${(t.userName || '').replace(/"/g, '""')}"`,
          `"${t.userId}"`,
          t.price ?? 5,
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
      'Prize Amount (USDT)',
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
      alert('Please enter a valid 6-digit coupon number (e.g. 786910, 123456).');
      return;
    }
    if (customCouponList.includes(cleaned)) {
      alert('Coupon number already added to your list!');
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

    const totalUserAvail = (currentUser.depositBalance || 0) + (currentUser.winningBalance || 0) + (currentUser.balance || 0);
    if (totalUserAvail < totalCost) {
      alert(`Insufficient funds! Total cost is $${totalCost} USDT. (Available Balance: $${totalUserAvail.toFixed(2)} USDT). Please deposit funds.`);
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
        alert(data.error || 'Failed to purchase tickets');
      } else {
        setCustomCouponList([]);
        setCustomCouponInput('');
        if (data.luckyDraw) {
          setLuckyDraw(data.luckyDraw);
        }
        await fetchLuckyDraw();
        if (onRefreshState) onRefreshState();
        alert(`🎉 Success! Purchased ${finalQty} Lucky Draw coupon(s)!`);
      }
    } catch (err: any) {
      alert('Error purchasing tickets: ' + err.message);
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
        ticketPrice: overrides?.ticketPrice !== undefined ? overrides.ticketPrice : (adminTicketPrice === '' ? 5 : Number(adminTicketPrice)),
        prizeAmount: overrides?.prizeAmount !== undefined ? overrides.prizeAmount : (adminPrizeAmount === '' ? 250 : Number(adminPrizeAmount)),
        secondPrizeAmount: overrides?.secondPrizeAmount !== undefined ? overrides.secondPrizeAmount : (adminSecondPrize === '' ? 100 : Number(adminSecondPrize)),
        thirdPrizeAmount: overrides?.thirdPrizeAmount !== undefined ? overrides.thirdPrizeAmount : (adminThirdPrize === '' ? 50 : Number(adminThirdPrize)),
        fourthPrizeAmount: overrides?.fourthPrizeAmount !== undefined ? overrides.fourthPrizeAmount : (adminFourthPrize === '' ? 25 : Number(adminFourthPrize)),
        fifthPrizeAmount: overrides?.fifthPrizeAmount !== undefined ? overrides.fifthPrizeAmount : (adminFifthPrize === '' ? 15 : Number(adminFifthPrize)),
        guaranteedPrizeAmount: overrides?.guaranteedPrizeAmount !== undefined ? overrides.guaranteedPrizeAmount : (adminGuaranteedPrize === '' ? 5 : Number(adminGuaranteedPrize)),
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
          setAdminTicketPrice(data.luckyDraw.ticketPrice !== undefined ? data.luckyDraw.ticketPrice : 5);
          setAdminPrizeAmount(data.luckyDraw.prizeAmount !== undefined ? data.luckyDraw.prizeAmount : 250);
          setAdminSecondPrize(data.luckyDraw.secondPrizeAmount !== undefined ? data.luckyDraw.secondPrizeAmount : 100);
          setAdminThirdPrize(data.luckyDraw.thirdPrizeAmount !== undefined ? data.luckyDraw.thirdPrizeAmount : 50);
          setAdminFourthPrize(data.luckyDraw.fourthPrizeAmount !== undefined ? data.luckyDraw.fourthPrizeAmount : 25);
          setAdminFifthPrize(data.luckyDraw.fifthPrizeAmount !== undefined ? data.luckyDraw.fifthPrizeAmount : 15);
          setAdminGuaranteedPrize(data.luckyDraw.guaranteedPrizeAmount !== undefined ? data.luckyDraw.guaranteedPrizeAmount : 5);
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
          ticketPrice: adminTicketPrice === '' ? 5 : Number(adminTicketPrice),
          prizeAmount: adminPrizeAmount === '' ? 250 : Number(adminPrizeAmount),
          secondPrizeAmount: adminSecondPrize === '' ? 100 : Number(adminSecondPrize),
          thirdPrizeAmount: adminThirdPrize === '' ? 50 : Number(adminThirdPrize),
          fourthPrizeAmount: adminFourthPrize === '' ? 25 : Number(adminFourthPrize),
          fifthPrizeAmount: adminFifthPrize === '' ? 15 : Number(adminFifthPrize),
          guaranteedPrizeAmount: adminGuaranteedPrize === '' ? 5 : Number(adminGuaranteedPrize),
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
    { rank: 1, name: '1st Prize', amount: luckyDraw?.prizeAmount ?? 250, badge: '🥇 1st', color: 'border-amber-500/60 text-amber-300 bg-amber-500/10' },
    { rank: 2, name: '2nd Prize', amount: luckyDraw?.secondPrizeAmount ?? 100, badge: '🥈 2nd', color: 'border-purple-500/60 text-purple-300 bg-purple-500/10' },
    { rank: 3, name: '3rd Prize', amount: luckyDraw?.thirdPrizeAmount ?? 50, badge: '🥉 3rd', color: 'border-cyan-500/60 text-cyan-300 bg-cyan-500/10' },
    { rank: 4, name: '4th Prize', amount: luckyDraw?.fourthPrizeAmount ?? 25, badge: '⭐ 4th', color: 'border-emerald-500/60 text-emerald-300 bg-emerald-500/10' },
    { rank: 5, name: '5th Prize', amount: luckyDraw?.fifthPrizeAmount ?? 15, badge: '🎖️ 5th', color: 'border-rose-500/60 text-rose-300 bg-rose-500/10' },
    { rank: 6, name: 'Guaranteed (45x)', amount: luckyDraw?.guaranteedPrizeAmount ?? 5, badge: '🎁 45 Series', color: 'border-yellow-500/60 text-yellow-300 bg-yellow-500/10' },
  ];

  return (
    <div className="space-y-6 font-mono text-slate-100 pb-16">
      {/* 1. ELECTRIC HERO HEADER BANNER */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0a1120] via-[#050c18] to-[#0d0720] border border-cyan-500/40 p-5 sm:p-8 shadow-[0_0_40px_rgba(6,182,212,0.2)]">
        <div className="absolute top-0 right-0 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-3 text-center md:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/20 border border-cyan-400/50 text-cyan-300 text-xs font-bold uppercase tracking-wider animate-pulse">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span>5-Step Sequential Draw (1st to 5th Prize + 45 Guaranteed Winners)</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-white flex items-center justify-center md:justify-start gap-2">
              <span className="bg-gradient-to-r from-cyan-400 via-amber-300 to-rose-400 bg-clip-text text-transparent">
                {luckyDraw?.title || 'MEGA USDT ELECTRIC 5-TIER DRAW'}
              </span>
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm max-w-xl">
              Admin triggers 5 sequential draws (1st to 5th Prize). Plus, all <strong className="text-amber-300">45 Guaranteed Winners</strong> (matching last 5 digits across 9 other series for all 5 prizes) win guaranteed cash prizes!
            </p>
          </div>

          {/* 5 Tiered Prizes + Guaranteed Pool Overview Cards */}
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 shrink-0 w-full md:w-auto">
            {prizeCardsConfig.map((p) => (
              <div key={p.rank} className={`bg-[#030712]/90 border rounded-2xl p-2 sm:p-2.5 text-center shadow-md ${p.color}`}>
                <div className="text-[9px] uppercase font-bold tracking-wider">{p.badge}</div>
                <div className="text-sm sm:text-base font-black">${p.amount}</div>
                <div className="text-[8px] text-slate-400 truncate">{p.rank === 6 ? 'Match 5 Digits' : 'Exact 6 Digits'}</div>
              </div>
            ))}
          </div>
        </div>

        {/* User Balance Display Bar */}
        <div className="mt-4 pt-3 border-t border-cyan-500/20 flex flex-col sm:flex-row items-center justify-between gap-3 bg-[#040812]/80 rounded-2xl p-3 px-4">
          <div className="flex items-center gap-4">
            <div>
              <div className="text-[10px] text-cyan-400 uppercase tracking-wider font-extrabold flex items-center gap-1">
                <span>💳 Deposit Wallet</span>
              </div>
              <div className="text-base font-black text-cyan-300">${(currentUser?.depositBalance || 0).toFixed(2)} USDT</div>
            </div>
            <div className="h-8 w-[1px] bg-slate-800" />
            <div>
              <div className="text-[10px] text-amber-400 uppercase tracking-wider font-extrabold flex items-center gap-1">
                <span>🎮 Winning Wallet</span>
              </div>
              <div className="text-base font-black text-amber-300">${(currentUser?.winningBalance || 0).toFixed(2)} USDT</div>
            </div>
          </div>

          <div className="flex items-center gap-2">
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
                className="px-3.5 py-1.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/50 text-xs font-black transition shadow-[0_0_10px_rgba(6,182,212,0.2)]"
              >
                Withdraw
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 2. ELECTRIC ROLLER SLOT REEL DISPLAY & LIVE 5-STEP DRAW STAGE */}
      <div
        className={`bg-[#070d18] border-2 rounded-2xl sm:rounded-3xl p-3.5 sm:p-6 md:p-8 text-center relative overflow-hidden transition-all duration-300 ${
          isRolling
            ? 'border-cyan-400 shadow-[0_0_70px_rgba(6,182,212,0.45)] ring-2 ring-cyan-500/50'
            : 'border-cyan-500/50 shadow-[0_0_50px_rgba(6,182,212,0.25)]'
        }`}
      >
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-cyan-900/20 via-transparent to-transparent pointer-events-none" />

        {/* Top Roller Controls Bar */}
        <div className="flex flex-wrap items-center justify-between gap-2.5 mb-3 sm:mb-4 relative z-10">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <Crown className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400" />
            <span className="text-xs sm:text-sm font-black text-cyan-300 uppercase tracking-wider sm:tracking-widest flex items-center gap-1.5">
              <span>Electric Roller</span>
              <span className="text-[10px] bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full border border-amber-500/40">
                {isRolling ? `Drawing ${currentRollingPrizeName}` : currentStepNum > 0 ? `Step ${currentStepNum}/5 Complete` : 'Ready For Draw'}
              </span>
            </span>
          </div>

          <div className="flex items-center gap-2 text-xs">
            {/* Audio Toggle Button */}
            <button
              onClick={() => setSoundEnabled((prev) => !prev)}
              type="button"
              className={`flex items-center gap-1.5 px-2 sm:px-2.5 py-1 rounded-xl text-xs font-bold transition border ${
                soundEnabled
                  ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 hover:bg-cyan-500/30'
                  : 'bg-slate-800/80 text-slate-400 border-slate-700 hover:bg-slate-800'
              }`}
              title={soundEnabled ? 'Mute Sound FX' : 'Enable Sound FX'}
            >
              {soundEnabled ? <Volume2 className="w-3.5 h-3.5 text-cyan-400" /> : <VolumeX className="w-3.5 h-3.5 text-slate-500" />}
              <span>{soundEnabled ? 'FX On' : 'Muted'}</span>
            </button>

            {/* Live Status Badge */}
            <div
              className={`flex items-center gap-1.5 px-2 sm:px-2.5 py-1 rounded-xl border font-bold uppercase text-[11px] sm:text-xs ${
                isRolling
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 animate-pulse'
                  : currentStepNum >= 5
                  ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                  : 'bg-cyan-500/20 text-cyan-400 border-cyan-500/40'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${isRolling ? 'bg-amber-400 animate-ping' : 'bg-emerald-400'}`} />
              <span>{isRolling ? `⚡ ROLLING (${rollSecondsLeft.toFixed(1)}s)` : currentStepNum >= 5 ? 'ROUND COMPLETED' : `STEP ${currentStepNum} OF 5`}</span>
            </div>
          </div>
        </div>

        {/* 10-Second High-Voltage Tension Progress Meter (Smooth transition, zero layout jolt) */}
        <div className={`transition-all duration-300 overflow-hidden ${isRolling ? 'max-h-24 opacity-100 mb-3 sm:mb-4' : 'max-h-0 opacity-0 mb-0 pointer-events-none'}`}>
          <div className="bg-[#030712]/90 border border-cyan-500/40 rounded-2xl p-2.5 sm:p-3 space-y-1.5 shadow-[0_0_20px_rgba(6,182,212,0.25)]">
            <div className="flex items-center justify-between text-[11px] sm:text-xs font-bold">
              <span className="flex items-center gap-1.5 text-cyan-300">
                <Zap className="w-3.5 h-3.5 text-amber-400" />
                <span className="tracking-wide">DRAWING {currentRollingPrizeName.toUpperCase()} (10-SECOND ROLLER)...</span>
              </span>
              <span className="font-mono text-amber-300 bg-amber-500/20 border border-amber-500/40 px-2 py-0.5 rounded-full text-[10px] sm:text-[11px]">
                {rollSecondsLeft.toFixed(1)}s remaining
              </span>
            </div>
            <div className="w-full bg-slate-900 rounded-full h-2.5 sm:h-3 border border-cyan-500/40 p-0.5 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-cyan-500 via-amber-400 to-emerald-400 transition-all duration-75"
                style={{ width: `${Math.min(100, Math.max(0, rollProgress))}%` }}
              />
            </div>
          </div>
        </div>

        {/* Roller Slots Container */}
        <div className="my-2.5 sm:my-5 py-2.5 sm:py-5 px-1.5 sm:px-4 bg-[#02050b] rounded-2xl border border-cyan-500/30 shadow-inner w-full max-w-2xl mx-auto">
          <div className="grid grid-cols-6 gap-1 xs:gap-1.5 sm:gap-3 md:gap-4 select-none w-full">
            {displayDigits.map((digit, idx) => {
              const isThisLocked = isRolling ? lockedReelMask[idx] : true;
              return (
                <div key={idx} className="flex flex-col items-center gap-1 w-full min-w-0">
                  {/* Reel Status Pill */}
                  {isRolling ? (
                    <div
                      className={`text-[8px] xs:text-[9px] font-black uppercase px-1 py-0.5 rounded-full transition-all duration-200 flex items-center justify-center gap-0.5 w-full truncate ${
                        !isThisLocked
                          ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/50'
                          : 'bg-amber-500/30 text-amber-300 border border-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.5)]'
                      }`}
                    >
                      {isThisLocked ? (
                        <>
                          <Lock className="w-2 h-2 text-amber-400 shrink-0" />
                          <span className="truncate">L#{idx + 1}</span>
                        </>
                      ) : (
                        <>
                          <Zap className="w-2 h-2 text-cyan-400 shrink-0" />
                          <span className="truncate">SPIN</span>
                        </>
                      )}
                    </div>
                  ) : (
                    <div className="text-[8px] xs:text-[9px] font-black uppercase px-1 py-0.5 rounded-full bg-slate-800/80 text-slate-400 border border-slate-700 w-full text-center truncate">
                      #{idx + 1}
                    </div>
                  )}

                  {/* Digit Display Reel Box */}
                  <div
                    className={`w-full aspect-[3/4] max-w-[80px] rounded-lg xs:rounded-xl sm:rounded-2xl flex items-center justify-center font-black text-xl xs:text-2xl sm:text-3xl md:text-4xl transition-colors duration-150 ${
                      isRolling && !isThisLocked
                        ? 'bg-gradient-to-b from-cyan-500/30 via-cyan-400/20 to-indigo-600/30 text-cyan-200 border-2 border-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.6)]'
                        : isRolling && isThisLocked
                        ? 'bg-gradient-to-b from-amber-500/30 via-yellow-500/20 to-amber-600/30 text-amber-300 border-2 border-amber-400 shadow-[0_0_25px_rgba(245,158,11,0.7)]'
                        : 'bg-[#0b1424] text-amber-300 border-2 border-amber-500/50 shadow-[0_0_15px_rgba(245,158,11,0.2)]'
                    }`}
                  >
                    <span>{digit}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 🌟 SEQUENTIAL 5 DRAWN TICKETS BOARD (Fixed heights, perfectly stable) */}
        <div className="mt-4 p-4 bg-[#030612]/90 border border-cyan-500/30 rounded-2xl space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
            <div className="flex items-center gap-2 text-cyan-300 font-bold text-xs sm:text-sm">
              <Layers className="w-4 h-4 text-amber-400" />
              <span>Current Round Drawn Tickets ({currentDrawnPrizes.length} / 5 Revealed)</span>
            </div>
            {currentDrawnPrizes.length > 0 && (
              <span className="text-[10px] text-slate-400 font-normal">
                Drawn sequential tickets stay placed on the board!
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-5 gap-2.5">
            {[1, 2, 3, 4, 5].map((step) => {
              const drawn = currentDrawnPrizes.find((p) => p.prizeRank === step);
              const prizeConf = prizeCardsConfig[step - 1];

              return (
                <div
                  key={step}
                  className={`p-3 rounded-2xl border transition-all flex flex-col justify-between text-left h-[115px] min-h-[115px] ${
                    drawn
                      ? 'bg-gradient-to-b from-[#081226] to-[#040814] border-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.25)]'
                      : 'bg-[#02050c]/80 border-slate-800/80 opacity-60'
                  }`}
                >
                  <div className="flex items-center justify-between gap-1 shrink-0">
                    <span className="text-[10px] font-black uppercase text-amber-300">{prizeConf.badge}</span>
                    <span className="text-xs font-black text-emerald-400">${prizeConf.amount} USDT</span>
                  </div>

                  <div className="my-auto text-center">
                    {drawn ? (
                      <div className="space-y-0.5">
                        <div className="text-lg font-black font-mono tracking-widest text-amber-300 leading-tight">
                          #{drawn.ticketNumber}
                        </div>
                        <div className="text-[10px] font-bold text-white truncate max-w-[140px] mx-auto">
                          {drawn.userName ? `${drawn.userName} (#${drawn.userNodeId || ''})` : 'Winner'}
                        </div>
                      </div>
                    ) : (
                      <div className="text-[11px] text-slate-600 font-bold italic py-1">
                        {isRolling && currentRollingStep === step ? '⚡ Rolling...' : 'Pending Draw'}
                      </div>
                    )}
                  </div>

                  <div className="text-[9px] text-slate-500 text-center shrink-0">
                    {drawn ? `Drawn at ${new Date(drawn.drawnAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : `Step ${step}`}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Winner Announcement Banner */}
        {winnerAnnouncedList && winnerAnnouncedList.length > 0 && (
          <div className="mt-4 p-4 bg-gradient-to-r from-amber-500/20 via-emerald-500/20 to-cyan-500/20 border-2 border-amber-400 rounded-2xl shadow-[0_0_30px_rgba(245,158,11,0.4)] space-y-2 animate-fadeIn">
            <div className="flex items-center justify-center gap-2 text-amber-300 font-black text-sm sm:text-base">
              <Trophy className="w-5 h-5 text-amber-400" />
              <span>🎉 STEP WINNERS ANNOUNCED ({winnerAnnouncedList.length}):</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 text-xs">
              {winnerAnnouncedList.map((w, idx) => (
                <div key={idx} className="bg-[#030712]/90 border border-amber-500/40 p-2.5 rounded-xl text-left space-y-1">
                  <div className="font-bold text-amber-300 flex items-center justify-between">
                    <span>{w.prizeTier || 'Winner'}</span>
                    <span className="text-emerald-400 font-black">+${w.prizeAmount} USDT</span>
                  </div>
                  <div className="text-[11px] text-white">
                    {w.userName} (<span className="text-cyan-300">#{w.userNodeId}</span>)
                  </div>
                  <div className="text-[10px] text-slate-400">
                    Coupon: <strong className="text-amber-300">#{w.ticketNumber}</strong>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Countdown Timer */}
        <div className="mt-6 pt-6 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-slate-300 text-xs sm:text-sm">
            <Clock className="w-4 h-4 text-cyan-400" />
            <span>Next Weekly Mega Grand Draw (Sunday 9:00 PM):</span>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 font-black">
            <div className="bg-[#0b1424] border border-amber-500/50 rounded-xl px-2.5 sm:px-3 py-1.5 text-center min-w-[46px] sm:min-w-[50px] shadow-[0_0_10px_rgba(245,158,11,0.2)]">
              <div className="text-base sm:text-lg text-amber-300">{String(timeLeft.days).padStart(2, '0')}</div>
              <div className="text-[8px] sm:text-[9px] text-amber-400 uppercase font-bold">Days</div>
            </div>
            <span className="text-cyan-400 font-bold">:</span>
            <div className="bg-[#0b1424] border border-cyan-500/40 rounded-xl px-2.5 sm:px-3 py-1.5 text-center min-w-[46px] sm:min-w-[50px]">
              <div className="text-base sm:text-lg text-cyan-300">{String(timeLeft.hours).padStart(2, '0')}</div>
              <div className="text-[8px] sm:text-[9px] text-slate-400 uppercase font-bold">Hours</div>
            </div>
            <span className="text-cyan-400 font-bold">:</span>
            <div className="bg-[#0b1424] border border-cyan-500/40 rounded-xl px-2.5 sm:px-3 py-1.5 text-center min-w-[46px] sm:min-w-[50px]">
              <div className="text-base sm:text-lg text-cyan-300">{String(timeLeft.minutes).padStart(2, '0')}</div>
              <div className="text-[8px] sm:text-[9px] text-slate-400 uppercase font-bold">Mins</div>
            </div>
            <span className="text-cyan-400 font-bold">:</span>
            <div className="bg-[#0b1424] border border-cyan-500/40 rounded-xl px-2.5 sm:px-3 py-1.5 text-center min-w-[46px] sm:min-w-[50px]">
              <div className="text-base sm:text-lg text-emerald-300">{String(timeLeft.seconds).padStart(2, '0')}</div>
              <div className="text-[8px] sm:text-[9px] text-slate-400 uppercase font-bold">Secs</div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. BUY TICKETS SECTION & USER TICKETS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Buy Tickets Form Card */}
        <div className="lg:col-span-1 bg-[#0a1120] border border-cyan-500/30 rounded-3xl p-5 sm:p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2 text-sm font-bold text-white">
              <Ticket className="w-4 h-4 text-cyan-400" />
              <span>Get Lucky Coupons</span>
            </div>
            <span className="text-xs text-amber-400 font-bold">
              ${luckyDraw?.ticketPrice ?? 5} USDT / coupon
            </span>
          </div>

          {/* User Available Balance */}
          <div className="bg-[#050a14] border border-slate-800 rounded-2xl p-3 flex items-center justify-between text-xs">
            <span className="text-slate-400">Your Wallet Balance:</span>
            <span className="text-emerald-400 font-bold text-sm">
              ${((currentUser.depositBalance || 0) + (currentUser.winningBalance || 0) + (currentUser.balance || 0)).toFixed(2)} USDT
            </span>
          </div>

          {/* Selection Mode Toggle */}
          <div className="space-y-2">
            <label className="text-xs text-slate-400 font-bold block">Coupon Selection Mode:</label>
            <div className="grid grid-cols-2 gap-2 bg-[#050a14] p-1 rounded-2xl border border-slate-800">
              <button
                type="button"
                onClick={() => setSelectionMode('custom')}
                className={`py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                  selectionMode === 'custom'
                    ? 'bg-cyan-500/30 border border-cyan-400 text-cyan-200 shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                Custom Choice
              </button>
              <button
                type="button"
                onClick={() => setSelectionMode('random')}
                className={`py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                  selectionMode === 'random'
                    ? 'bg-cyan-500/30 border border-cyan-400 text-cyan-200 shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <RefreshCw className="w-3.5 h-3.5 text-cyan-400" />
                Random Auto
              </button>
            </div>
          </div>

          {/* Custom Number Picker Input */}
          {selectionMode === 'custom' ? (
            <div className="space-y-3 bg-[#050a14] border border-cyan-500/20 rounded-2xl p-3.5">
              <label className="text-xs text-amber-300 font-bold flex items-center justify-between">
                <span>Enter Your Preferred 6-Digit Coupon:</span>
                <button
                  type="button"
                  onClick={handleGenerateRandomCoupon}
                  className="text-[10px] text-cyan-400 hover:underline flex items-center gap-1 font-bold"
                >
                  <RefreshCw className="w-3 h-3" /> Random Number
                </button>
              </label>

              <div className="flex items-center gap-2">
                <input
                  type="text"
                  maxLength={6}
                  placeholder="e.g. 786910"
                  value={customCouponInput}
                  onChange={(e) => setCustomCouponInput(e.target.value.replace(/\D/g, ''))}
                  className="w-full bg-[#0d1726] border border-cyan-500/40 rounded-xl px-3 py-2 text-center text-amber-300 font-black tracking-widest text-base focus:outline-none focus:border-amber-400"
                />
                <button
                  type="button"
                  onClick={handleAddCustomCoupon}
                  className="px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-xs rounded-xl shrink-0 transition"
                >
                  + Add
                </button>
              </div>

              {/* Added Custom Coupons List */}
              {customCouponList.length > 0 && (
                <div className="space-y-1.5 pt-2 border-t border-slate-800">
                  <div className="text-[10px] text-slate-400 font-bold uppercase">Chosen Coupons ({customCouponList.length}):</div>
                  <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto">
                    {customCouponList.map((num, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-cyan-950 border border-cyan-500/40 rounded-lg text-xs font-bold text-cyan-300"
                      >
                        #{num}
                        <button
                          type="button"
                          onClick={() => handleRemoveCustomCoupon(idx)}
                          className="text-slate-400 hover:text-red-400 text-xs font-bold"
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
            /* Quantity Selector for Random Mode */
            <div className="space-y-2">
              <label className="text-xs text-slate-400 font-bold">Select Ticket Quantity:</label>
              <div className="grid grid-cols-4 gap-2">
                {[1, 3, 5, 10].map((qty) => (
                  <button
                    key={qty}
                    type="button"
                    onClick={() => setTicketQty(qty)}
                    className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                      ticketQty === qty
                        ? 'bg-cyan-500/30 border-cyan-400 text-cyan-200 shadow-[0_0_12px_rgba(6,182,212,0.3)]'
                        : 'bg-[#050a14] border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    {qty} {qty === 1 ? 'Coupon' : 'Coupons'}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Cost Summary */}
          <div className="bg-[#050a14] border border-cyan-500/20 rounded-2xl p-3 space-y-1 text-xs">
            <div className="flex justify-between text-slate-400">
              <span>Total Coupons:</span>
              <span className="text-white font-bold">
                {selectionMode === 'custom' && customCouponList.length > 0 ? customCouponList.length : ticketQty}
              </span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Unit Price:</span>
              <span className="text-white font-bold">${luckyDraw?.ticketPrice ?? 5} USDT</span>
            </div>
            <div className="pt-2 border-t border-slate-800 flex justify-between font-bold text-sm">
              <span className="text-cyan-300">Total Price:</span>
              <span className="text-amber-400 font-black">
                $
                {(
                  (luckyDraw?.ticketPrice ?? 5) *
                  (selectionMode === 'custom' && customCouponList.length > 0 ? customCouponList.length : ticketQty)
                ).toFixed(2)}{' '}
                USDT
              </span>
            </div>
          </div>

          {/* Buy Button */}
          <button
            type="button"
            onClick={handleBuyTickets}
            disabled={buying}
            className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-cyan-500 via-indigo-600 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-white font-bold text-sm shadow-[0_0_25px_rgba(6,182,212,0.4)] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {buying ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin text-white" />
                <span>Purchasing Coupons...</span>
              </>
            ) : (
              <>
                <Ticket className="w-4 h-4 text-cyan-200" />
                <span>
                  Buy{' '}
                  {selectionMode === 'custom' && customCouponList.length > 0 ? customCouponList.length : ticketQty}{' '}
                  Lucky Coupon(s)
                </span>
              </>
            )}
          </button>
        </div>

        {/* User's Ticket Numbers List */}
        <div className="lg:col-span-2 bg-[#0a1120] border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2 text-sm font-bold text-white">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>My Active Coupons ({userTickets.length})</span>
            </div>
            <span className="text-xs text-slate-400">
              Total Pool Coupons: {luckyDraw?.tickets?.length || 0}
            </span>
          </div>

          {userTickets.length === 0 ? (
            <div className="py-12 text-center text-slate-500 space-y-2">
              <Ticket className="w-10 h-10 mx-auto text-slate-600" />
              <div className="text-sm font-bold text-slate-400">No Coupons Purchased Yet</div>
              <p className="text-xs text-slate-500">Pick your own 6-digit lucky numbers above to participate!</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-[260px] overflow-y-auto pr-1">
              {userTickets.map((tkt) => (
                <div
                  key={tkt.id}
                  className="bg-[#050a14] border border-cyan-500/30 rounded-2xl p-3 text-center space-y-1 shadow-inner relative overflow-hidden group hover:border-amber-400 transition"
                >
                  <div className="text-[10px] text-cyan-400 uppercase font-bold tracking-wider">
                    Coupon No
                  </div>
                  <div className="text-lg font-black text-amber-300 font-mono tracking-widest">
                    #{tkt.ticketNumber}
                  </div>
                  <div className="text-[9px] text-slate-500">
                    {new Date(tkt.purchasedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 4. PAST WINNERS HALL OF FAME */}
      <div className="bg-[#0a1120] border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-800 pb-3 gap-3">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 text-sm font-bold text-white">
            <div className="flex items-center gap-2">
              <Trophy className="w-4 h-4 text-amber-400" />
              <span>Lucky Draw Past Champions</span>
            </div>
            {luckyDraw?.lastWinningNumber && (
              <span className="text-xs text-cyan-300 font-mono">
                (Last Winning #: <strong className="text-amber-400">#{luckyDraw.lastWinningNumber}</strong>)
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={downloadPastResultsCSV}
              className="px-3 py-1 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
              title="Export all past winner records to Excel / CSV"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
              <span>Export Results (CSV)</span>
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
                title="Clear past demo/test winners history"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                <span>{showClearConfirm ? '⚠️ Click again to Confirm Clear!' : 'Clear History'}</span>
              </button>
            )}

            {/* Prize Category Filter Tabs */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <button
                type="button"
                onClick={() => setWinnerTierFilter('all')}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                  winnerTierFilter === 'all'
                    ? 'bg-cyan-500/30 border-cyan-400 text-cyan-200'
                    : 'bg-[#050a14] border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                🌟 All ({luckyDraw?.pastWinners?.length || 0})
              </button>
              <button
                type="button"
                onClick={() => setWinnerTierFilter('1st')}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                  winnerTierFilter === '1st'
                    ? 'bg-amber-500/30 border-amber-400 text-amber-200 shadow-[0_0_10px_rgba(245,158,11,0.3)]'
                    : 'bg-[#050a14] border-slate-800 text-amber-400/80 hover:text-amber-300'
                }`}
              >
                🥇 1st (${luckyDraw?.prizeAmount ?? 250})
              </button>
              <button
                type="button"
                onClick={() => setWinnerTierFilter('2nd')}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                  winnerTierFilter === '2nd'
                    ? 'bg-purple-500/30 border-purple-400 text-purple-200 shadow-[0_0_10px_rgba(168,85,247,0.3)]'
                    : 'bg-[#050a14] border-slate-800 text-purple-300/80 hover:text-purple-200'
                }`}
              >
                🥈 2nd (${luckyDraw?.secondPrizeAmount ?? 100})
              </button>
              <button
                type="button"
                onClick={() => setWinnerTierFilter('3rd')}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                  winnerTierFilter === '3rd'
                    ? 'bg-cyan-500/30 border-cyan-400 text-cyan-200 shadow-[0_0_10px_rgba(6,182,212,0.3)]'
                    : 'bg-[#050a14] border-slate-800 text-cyan-400/80 hover:text-cyan-300'
                }`}
              >
                🥉 3rd (${luckyDraw?.thirdPrizeAmount ?? 50})
              </button>
              <button
                type="button"
                onClick={() => setWinnerTierFilter('4th')}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                  winnerTierFilter === '4th'
                    ? 'bg-emerald-500/30 border-emerald-400 text-emerald-200 shadow-[0_0_10px_rgba(16,185,129,0.3)]'
                    : 'bg-[#050a14] border-slate-800 text-emerald-400/80 hover:text-emerald-300'
                }`}
              >
                ⭐ 4th (${luckyDraw?.fourthPrizeAmount ?? 25})
              </button>
              <button
                type="button"
                onClick={() => setWinnerTierFilter('5th')}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                  winnerTierFilter === '5th'
                    ? 'bg-rose-500/30 border-rose-400 text-rose-200 shadow-[0_0_10px_rgba(244,63,94,0.3)]'
                    : 'bg-[#050a14] border-slate-800 text-rose-400/80 hover:text-rose-300'
                }`}
              >
                🎖️ 5th (${luckyDraw?.fifthPrizeAmount ?? 15})
              </button>
              <button
                type="button"
                onClick={() => setWinnerTierFilter('guaranteed')}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                  winnerTierFilter === 'guaranteed'
                    ? 'bg-yellow-500/30 border-yellow-400 text-yellow-200 shadow-[0_0_10px_rgba(234,179,8,0.3)]'
                    : 'bg-[#050a14] border-slate-800 text-yellow-400/80 hover:text-yellow-300'
                }`}
              >
                🎁 Guaranteed (45x)
              </button>
            </div>
          </div>
        </div>

        {(() => {
          const past = luckyDraw?.pastWinners || [];
          const filtered = past.filter((win) => {
            if (winnerTierFilter === '1st') {
              return win.prizeTier?.toLowerCase().includes('1st');
            }
            if (winnerTierFilter === '2nd') {
              return win.prizeTier?.toLowerCase().includes('2nd');
            }
            if (winnerTierFilter === '3rd') {
              return win.prizeTier?.toLowerCase().includes('3rd');
            }
            if (winnerTierFilter === '4th') {
              return win.prizeTier?.toLowerCase().includes('4th');
            }
            if (winnerTierFilter === '5th') {
              return win.prizeTier?.toLowerCase().includes('5th');
            }
            if (winnerTierFilter === 'guaranteed') {
              return win.prizeTier?.toLowerCase().includes('guaranteed');
            }
            return true;
          });

          if (filtered.length === 0) {
            return (
              <div className="text-center py-8 text-slate-500 text-xs space-y-1">
                <Trophy className="w-8 h-8 mx-auto text-slate-600" />
                <div className="font-bold text-slate-400">No winners found for selected prize tier.</div>
                <p className="text-slate-500 text-[11px]">Winners will appear here automatically when draws complete.</p>
              </div>
            );
          }

          return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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

                return (
                  <div key={win.id} className={`bg-[#050a14] border rounded-2xl p-4 flex items-center justify-between gap-3 ${cardStyle}`}>
                    <div className="space-y-1">
                      <div className="text-xs font-bold text-white flex items-center gap-1.5">
                        <Crown className="w-3.5 h-3.5 text-amber-400" />
                        <span>{win.userName}</span>
                      </div>
                      <div className="text-[10px] text-slate-400">
                        Node ID: <span className="text-cyan-300">#{win.userNodeId}</span>
                      </div>
                      <div className="text-[10px] text-slate-400">
                        Winning Coupon: <span className="text-amber-300 font-bold">#{win.ticketNumber}</span>
                      </div>
                      {win.prizeTier && (
                        <div className={`text-[9px] font-bold px-2 py-0.5 rounded-md border inline-block ${badgeStyle}`}>
                          {win.prizeTier}
                        </div>
                      )}
                    </div>

                    <div className="text-right">
                      <div className="text-sm font-black text-emerald-400">+${win.prizeAmount} USDT</div>
                      <div className="text-[9px] text-slate-500">{new Date(win.wonAt).toLocaleDateString()}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })()}
      </div>

      {/* 5. ADMIN CONTROLLER PANEL (5-Step Sequential Draw & Forced Winner Controls) */}
      {(currentUser.isAdmin || currentUser.nodeId === 'NX-ROOT01') && (
        <div className="bg-[#0d0a18] border-2 border-rose-500/60 rounded-3xl p-5 sm:p-6 shadow-[0_0_30px_rgba(244,63,94,0.2)] space-y-5">
          <div className="flex items-center justify-between border-b border-rose-500/30 pb-3">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-rose-400" />
              <span className="text-sm font-bold text-rose-300 uppercase tracking-wider">
                Admin Sequential Lucky Draw Control Panel
              </span>
            </div>
            <button
              type="button"
              onClick={() => setIsAdminPanelOpen(!isAdminPanelOpen)}
              className="px-3 py-1 bg-rose-500/20 text-rose-300 border border-rose-500/40 rounded-xl text-xs font-bold hover:bg-rose-500/30 transition"
            >
              {isAdminPanelOpen ? 'Hide Admin Controls' : 'Show Admin Controls'}
            </button>
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

          {isAdminPanelOpen && (
            <div className="space-y-5 pt-2">
              {/* Sequential Draw Trigger Action Bar */}
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

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleResetDrawRound}
                      className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-bold transition flex items-center gap-1.5"
                    >
                      <RotateCcw className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Reset Round (Start Step 1)</span>
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-5 gap-2">
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
                        <span className="text-[10px] opacity-80">${prizeAmt} USDT</span>
                      </button>
                    );
                  })}
                </div>

                <div className="pt-2 flex items-center justify-between text-xs">
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
                    className="px-5 py-2 rounded-xl bg-gradient-to-r from-rose-500 via-amber-500 to-emerald-400 text-black font-black text-xs shadow-[0_0_20px_rgba(245,158,11,0.4)] transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    <Play className="w-3.5 h-3.5 fill-black" />
                    <span>
                      {(luckyDraw?.currentDrawStep || 0) >= 5 ? '⚡ START NEW ROUND (STEP 1)' : `⚡ GAME PLAY (TRIGGER STEP ${(luckyDraw?.currentDrawStep || 0) + 1})`}
                    </span>
                  </button>
                </div>
              </div>

              {/* Active Coupons Tracking & CSV Export Card */}
              <div className="bg-[#050814] border border-cyan-500/30 rounded-2xl p-4 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
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
                      className="px-3 py-1.5 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-[0_0_10px_rgba(6,182,212,0.2)]"
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
                        className="w-full pl-8 pr-3 py-1.5 bg-[#0a0f1d] border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                      />
                    </div>

                    <div className="max-h-60 overflow-y-auto border border-slate-800 rounded-xl bg-[#030610]">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead className="bg-slate-900/90 text-slate-400 font-bold sticky top-0 border-b border-slate-800">
                          <tr>
                            <th className="p-2 pl-3">Ticket #</th>
                            <th className="p-2">User / Node ID</th>
                            <th className="p-2">Price</th>
                            <th className="p-2 text-center">Set Forced Step</th>
                            <th className="p-2 pr-3 text-right">Date</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/60">
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
                            return filteredTkts.map((tkt, idx) => {
                              return (
                                <tr key={tkt.id || idx} className="hover:bg-slate-800/40 transition">
                                  <td className="p-2 pl-3 font-mono font-bold text-amber-300">
                                    #{tkt.ticketNumber}
                                  </td>
                                  <td className="p-2">
                                    <div className="font-bold text-white">{tkt.userName || 'User'}</div>
                                    <div className="text-[10px] text-slate-400">#{tkt.userNodeId || tkt.userId}</div>
                                  </td>
                                  <td className="p-2 text-cyan-300 font-bold">${tkt.price ?? 5} USDT</td>
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
                              );
                            });
                          })()}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>

              {/* 🎯 Forced Winner Selection for all 5 Steps (1st to 5th Prizes) */}
              <div className="bg-[#05050f] border border-amber-500/40 rounded-2xl p-4 space-y-4 shadow-[0_0_20px_rgba(245,158,11,0.15)]">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
                  <div>
                    <div className="text-xs font-black text-amber-300 flex items-center gap-2">
                      <UserCheck className="w-4 h-4 text-amber-400" />
                      <span>ADMIN WINNER CONTROLLER (1st to 5th PRIZES)</span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Select any registered member or enter custom 6-digit coupon for each prize slot (1st, 2nd, 3rd, 4th, 5th). Changes automatically save.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleAdminSaveConfig()}
                      className="px-3 py-1 bg-amber-500 hover:bg-amber-400 text-black text-xs font-black rounded-xl transition flex items-center gap-1.5 shadow-[0_0_10px_rgba(245,158,11,0.3)] cursor-pointer"
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
                      className="px-3 py-1 bg-rose-500/20 text-rose-300 border border-rose-500/40 hover:bg-rose-500/30 text-xs font-bold rounded-xl transition flex items-center gap-1 cursor-pointer"
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
                            ? 'bg-gradient-to-b from-[#0f172a] to-[#080d1a] border-amber-400/80 shadow-[0_0_15px_rgba(245,158,11,0.25)]'
                            : 'bg-[#060a15] border-slate-800'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-black text-amber-300">{prizeName}</span>
                          <span className="text-[10px] font-bold text-emerald-400">${prizeAmt} USDT</span>
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
                            className="w-full p-2 bg-[#02050e] border border-slate-700 rounded-xl text-[11px] text-amber-300 font-bold focus:outline-none focus:border-amber-500 cursor-pointer"
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
                            className="w-full p-1.5 bg-[#02050e] border border-slate-800 rounded-xl text-xs text-amber-300 placeholder-slate-600 focus:outline-none focus:border-amber-500 font-mono tracking-widest font-bold text-center"
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Configure Prize Amounts */}
              <div className="bg-[#050814] border border-cyan-500/30 rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                  <div className="flex items-center gap-2">
                    <Sliders className="w-4 h-4 text-cyan-400" />
                    <span className="text-xs font-bold text-cyan-200">Configure Prize Pool Amounts ($ USDT)</span>
                    {isAdminDirty && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse font-bold">
                        Unsaved Changes
                      </span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => handleAdminSaveConfig()}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                      isAdminDirty
                        ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-black font-black shadow-[0_0_12px_rgba(245,158,11,0.5)] border border-amber-300'
                        : 'bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40'
                    }`}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>{isAdminDirty ? 'Save Amounts Now' : 'Save Amounts'}</span>
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3">
                  <div>
                    <label className="text-[10px] text-slate-400 font-bold block">Ticket Price ($):</label>
                    <input
                      type="number"
                      min="0.1"
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
                    <label className="text-[10px] text-amber-400 font-bold block">🥇 1st Prize ($):</label>
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
                    <label className="text-[10px] text-purple-400 font-bold block">🥈 2nd Prize ($):</label>
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
                    <label className="text-[10px] text-cyan-400 font-bold block">🥉 3rd Prize ($):</label>
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
                    <label className="text-[10px] text-emerald-400 font-bold block">⭐ 4th Prize ($):</label>
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
                    <label className="text-[10px] text-rose-400 font-bold block">🎖️ 5th Prize ($):</label>
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
                    <label className="text-[10px] text-yellow-400 font-bold block">🎁 Guaranteed 45x ($):</label>
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

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => handleAdminSaveConfig()}
                  className="w-full sm:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-black text-xs border border-amber-300 transition shadow-[0_0_20px_rgba(245,158,11,0.4)] flex items-center justify-center gap-2 cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Save All Prize Amounts & Winner Settings</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
