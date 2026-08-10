import React, { useState, useEffect } from 'react';
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
} from 'lucide-react';
import { User, LuckyDrawState } from '../types';

interface LuckyDrawViewProps {
  currentUser: User;
  users: User[];
  onOpenDeposit?: () => void;
  onRefreshState?: () => void;
}

export const LuckyDrawView: React.FC<LuckyDrawViewProps> = ({
  currentUser,
  users,
  onOpenDeposit,
  onRefreshState,
}) => {
  const [luckyDraw, setLuckyDraw] = useState<LuckyDrawState | null>(null);
  const [loading, setLoading] = useState(false);
  const [buying, setBuying] = useState(false);
  const [ticketQty, setTicketQty] = useState(1);
  const [selectionMode, setSelectionMode] = useState<'random' | 'custom'>('custom');
  const [customCouponInput, setCustomCouponInput] = useState<string>('');
  const [customCouponList, setCustomCouponList] = useState<string[]>([]);
  
  const [timeLeft, setTimeLeft] = useState<{ hours: number; minutes: number; seconds: number }>({
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  // Roller animation states
  const [isRolling, setIsRolling] = useState(false);
  const [displayDigits, setDisplayDigits] = useState<string[]>(['7', '3', '9', '2', '1', '0']);
  const [winnerAnnouncedList, setWinnerAnnouncedList] = useState<any[] | null>(null);
  const [winnerTierFilter, setWinnerTierFilter] = useState<'all' | '1st' | '2nd' | '3rd'>('all');

  // Admin Config State
  const [isAdminPanelOpen, setIsAdminPanelOpen] = useState(false);
  const [forcedUserId, setForcedUserId] = useState<string>('');
  const [forcedTicketNum, setForcedTicketNum] = useState<string>('');
  const [adminTicketPrice, setAdminTicketPrice] = useState<number | string>(5);
  const [adminPrizeAmount, setAdminPrizeAmount] = useState<number | string>(250);
  const [adminSecondPrize, setAdminSecondPrize] = useState<number | string>(50);
  const [adminThirdPrize, setAdminThirdPrize] = useState<number | string>(10);
  const [adminCountdownMins, setAdminCountdownMins] = useState<number>(60);
  const [adminSearchUser, setAdminSearchUser] = useState('');
  const [adminMsg, setAdminMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [hasInitializedConfig, setHasInitializedConfig] = useState(false);

  // Fetch Lucky Draw State
  const fetchLuckyDraw = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/luckydraw');
      if (res.ok) {
        const data = await res.json();
        setLuckyDraw(data.luckyDraw);

        // Only set admin input fields once on initial load or if admin panel is closed
        if (!hasInitializedConfig) {
          setAdminTicketPrice(data.luckyDraw.ticketPrice ?? 5);
          setAdminPrizeAmount(data.luckyDraw.prizeAmount ?? 250);
          setAdminSecondPrize(data.luckyDraw.secondPrizeAmount ?? 50);
          setAdminThirdPrize(data.luckyDraw.thirdPrizeAmount ?? 10);
          if (data.luckyDraw.forcedWinnerUserId) {
            setForcedUserId(data.luckyDraw.forcedWinnerUserId);
          }
          if (data.luckyDraw.forcedWinnerTicketNumber) {
            setForcedTicketNum(data.luckyDraw.forcedWinnerTicketNumber);
          }
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
    const interval = setInterval(fetchLuckyDraw, 8000);
    return () => clearInterval(interval);
  }, []);

  // Countdown timer logic
  useEffect(() => {
    if (!luckyDraw?.targetEndTime) return;

    const timer = setInterval(() => {
      const target = new Date(luckyDraw.targetEndTime).getTime();
      const now = Date.now();
      const diff = Math.max(0, target - now);

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeLeft({ hours, minutes, seconds });
    }, 1000);

    return () => clearInterval(timer);
  }, [luckyDraw?.targetEndTime]);

  // Handle Roller Animation Effect
  useEffect(() => {
    if (!isRolling) return;

    const reelInterval = setInterval(() => {
      const randDigits = Array.from({ length: 6 }, () => Math.floor(Math.random() * 10).toString());
      setDisplayDigits(randDigits);
    }, 80);

    return () => clearInterval(reelInterval);
  }, [isRolling]);

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
    const finalQty = selectionMode === 'custom' && customCouponList.length > 0 ? customCouponList.length : ticketQty;
    const totalCost = luckyDraw.ticketPrice * finalQty;
    
    // Check balance
    if (currentUser.depositBalance < totalCost && currentUser.balance < totalCost) {
      alert(`Insufficient funds! Total cost is $${totalCost} USDT. Please deposit funds or upgrade.`);
      if (onOpenDeposit) onOpenDeposit();
      return;
    }

    try {
      setBuying(true);
      const res = await fetch('/api/luckydraw/buy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser.id,
          quantity: finalQty,
          customNumbers: selectionMode === 'custom' ? customCouponList : [],
        }),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        alert(data.error || 'Failed to purchase tickets');
      } else {
        setCustomCouponList([]);
        setCustomCouponInput('');
        fetchLuckyDraw();
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
  const handleAdminSaveConfig = async () => {
    try {
      setAdminMsg(null);
      const targetEndTime = new Date(Date.now() + adminCountdownMins * 60 * 1000).toISOString();
      const res = await fetch('/api/luckydraw/admin/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ticketPrice: adminTicketPrice === '' ? 5 : Number(adminTicketPrice),
          prizeAmount: adminPrizeAmount === '' ? 250 : Number(adminPrizeAmount),
          secondPrizeAmount: adminSecondPrize === '' ? 50 : Number(adminSecondPrize),
          thirdPrizeAmount: adminThirdPrize === '' ? 10 : Number(adminThirdPrize),
          targetEndTime,
          status: 'active',
          forcedWinnerUserId: forcedUserId || null,
          forcedWinnerTicketNumber: forcedTicketNum || null,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setLuckyDraw(data.luckyDraw);
        setAdminTicketPrice(data.luckyDraw.ticketPrice);
        setAdminPrizeAmount(data.luckyDraw.prizeAmount);
        setAdminSecondPrize(data.luckyDraw.secondPrizeAmount);
        setAdminThirdPrize(data.luckyDraw.thirdPrizeAmount);
        setAdminMsg({ text: '🎉 Tiered Prize Pools & Lucky Draw Config Saved Successfully!', type: 'success' });
        if (onRefreshState) onRefreshState();
      } else {
        setAdminMsg({ text: data.error || 'Failed to update settings', type: 'error' });
      }
    } catch (err: any) {
      setAdminMsg({ text: 'Error saving settings: ' + err.message, type: 'error' });
    }
  };

  // Admin Trigger Roller Draw
  const handleAdminTriggerDraw = async () => {
    try {
      setAdminMsg(null);
      setIsRolling(true);
      setWinnerAnnouncedList(null);

      const res = await fetch('/api/luckydraw/admin/trigger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          forcedWinnerUserId: forcedUserId || null,
          forcedWinnerTicketNumber: forcedTicketNum || null,
        }),
      });
      const data = await res.json();

      // Keep spinning for 3.5 seconds for visual thrill
      setTimeout(() => {
        setIsRolling(false);
        if (res.ok && data.success && data.winningNumber) {
          const winDigits = data.winningNumber.padStart(6, '0').split('');
          setDisplayDigits(winDigits);
          setWinnerAnnouncedList(data.winners || []);
          setLuckyDraw(data.luckyDraw);
          if (onRefreshState) onRefreshState();
        } else {
          alert(data.error || 'Error triggering draw');
        }
      }, 3500);
    } catch (err: any) {
      setIsRolling(false);
      alert('Error triggering draw: ' + err.message);
    }
  };

  const userTickets = luckyDraw?.tickets?.filter((t) => t.userId === currentUser.id) || [];
  const filteredAdminUsers = users.filter((u) =>
    u.name.toLowerCase().includes(adminSearchUser.toLowerCase()) ||
    u.nodeId.toLowerCase().includes(adminSearchUser.toLowerCase())
  );

  const selectedWinnerUser = users.find((u) => u.id === forcedUserId);

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
              <span>Electric Lucky Draw Reel & Custom Coupon Picker</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-white flex items-center justify-center md:justify-start gap-2">
              <span className="bg-gradient-to-r from-cyan-400 via-amber-300 to-rose-400 bg-clip-text text-transparent">
                {luckyDraw?.title || 'MEGA USDT ELECTRIC DRAW'}
              </span>
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm max-w-xl">
              Pick your own 6-digit lucky coupons! Match full 6 digits for 1st Prize, last 5 digits for 2nd Prize, or last 4 digits for 3rd Prize!
            </p>
          </div>

          {/* Tiered Prizes Overview Cards */}
          <div className="grid grid-cols-3 gap-2 shrink-0 w-full md:w-auto">
            <div className="bg-[#030712]/90 border border-amber-500/60 rounded-2xl p-3 text-center shadow-[0_0_15px_rgba(245,158,11,0.2)]">
              <div className="text-[9px] uppercase font-bold text-amber-400 tracking-wider">🥇 1st Prize</div>
              <div className="text-base sm:text-xl font-black text-amber-300">${luckyDraw?.prizeAmount ?? 250}</div>
              <div className="text-[9px] text-slate-400">Match 6 Digits</div>
            </div>

            <div className="bg-[#030712]/90 border border-purple-500/50 rounded-2xl p-3 text-center shadow-[0_0_15px_rgba(168,85,247,0.2)]">
              <div className="text-[9px] uppercase font-bold text-purple-300 tracking-wider">🥈 2nd Prize</div>
              <div className="text-base sm:text-xl font-black text-purple-300">${luckyDraw?.secondPrizeAmount ?? 50}</div>
              <div className="text-[9px] text-slate-400">Match Last 5</div>
            </div>

            <div className="bg-[#030712]/90 border border-emerald-500/50 rounded-2xl p-3 text-center shadow-[0_0_15px_rgba(16,185,129,0.2)]">
              <div className="text-[9px] uppercase font-bold text-emerald-400 tracking-wider">🥉 3rd Prize</div>
              <div className="text-base sm:text-xl font-black text-emerald-300">${luckyDraw?.thirdPrizeAmount ?? 10}</div>
              <div className="text-[9px] text-slate-400">Match Last 4</div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. ELECTRIC ROLLER SLOT REEL DISPLAY */}
      <div className="bg-[#070d18] border-2 border-cyan-500/50 rounded-3xl p-6 sm:p-8 text-center relative overflow-hidden shadow-[0_0_50px_rgba(6,182,212,0.25)]">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-cyan-900/20 via-transparent to-transparent pointer-events-none" />

        <div className="flex items-center justify-between gap-2 mb-4">
          <div className="flex items-center gap-2">
            <Crown className="w-5 h-5 text-amber-400" />
            <span className="text-xs sm:text-sm font-black text-cyan-300 uppercase tracking-widest">
              Live Electric Ticket Roller
            </span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
            <span className="text-emerald-400 font-bold uppercase">{isRolling ? 'ROLLING...' : 'LIVE READY'}</span>
          </div>
        </div>

        {/* Roller Slots Container - Single Row on Mobile & Desktop */}
        <div className="my-4 sm:my-6 py-4 sm:py-6 px-2 sm:px-4 bg-[#02050b] rounded-2xl border border-cyan-500/30 shadow-inner flex items-center justify-center gap-1.5 xs:gap-2 sm:gap-3 md:gap-4 flex-nowrap overflow-x-auto select-none max-w-full">
          {displayDigits.map((digit, idx) => (
            <div
              key={idx}
              className={`w-9 h-13 xs:w-11 xs:h-16 sm:w-16 sm:h-24 shrink-0 rounded-xl sm:rounded-2xl flex items-center justify-center font-black text-lg xs:text-2xl sm:text-4xl transition-all duration-150 ${
                isRolling
                  ? 'bg-gradient-to-b from-cyan-500/30 via-cyan-400/20 to-indigo-600/30 text-cyan-200 border-2 border-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.5)] animate-pulse'
                  : 'bg-[#0b1424] text-amber-300 border-2 border-amber-500/50 shadow-[0_0_15px_rgba(245,158,11,0.2)]'
              }`}
            >
              <span>{digit}</span>
            </div>
          ))}
        </div>

        {/* Winner Announcement Banner */}
        {winnerAnnouncedList && winnerAnnouncedList.length > 0 && (
          <div className="mt-4 p-4 bg-gradient-to-r from-amber-500/20 via-emerald-500/20 to-cyan-500/20 border-2 border-amber-400 rounded-2xl shadow-[0_0_30px_rgba(245,158,11,0.4)] space-y-2">
            <div className="flex items-center justify-center gap-2 text-amber-300 font-black text-sm sm:text-base">
              <Trophy className="w-5 h-5 text-amber-400" />
              <span>🎉 DRAW COMPLETED! WINNERS ANNOUNCED ({winnerAnnouncedList.length}):</span>
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
            <span>Next Automatic Draw In:</span>
          </div>

          <div className="flex items-center gap-2 font-black">
            <div className="bg-[#0b1424] border border-cyan-500/40 rounded-xl px-3 py-1.5 text-center min-w-[50px]">
              <div className="text-lg text-cyan-300">{String(timeLeft.hours).padStart(2, '0')}</div>
              <div className="text-[9px] text-slate-400 uppercase">Hours</div>
            </div>
            <span className="text-cyan-400 font-bold">:</span>
            <div className="bg-[#0b1424] border border-cyan-500/40 rounded-xl px-3 py-1.5 text-center min-w-[50px]">
              <div className="text-lg text-cyan-300">{String(timeLeft.minutes).padStart(2, '0')}</div>
              <div className="text-[9px] text-slate-400 uppercase">Mins</div>
            </div>
            <span className="text-cyan-400 font-bold">:</span>
            <div className="bg-[#0b1424] border border-cyan-500/40 rounded-xl px-3 py-1.5 text-center min-w-[50px]">
              <div className="text-lg text-amber-300">{String(timeLeft.seconds).padStart(2, '0')}</div>
              <div className="text-[9px] text-slate-400 uppercase">Secs</div>
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
              ${(currentUser.depositBalance + currentUser.balance).toFixed(2)} USDT
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
          <div className="flex items-center gap-2 text-sm font-bold text-white">
            <Trophy className="w-4 h-4 text-amber-400" />
            <span>Lucky Draw Past Champions</span>
            {luckyDraw?.lastWinningNumber && (
              <span className="text-xs text-cyan-300 font-mono ml-2">
                (Last Winning #: <strong className="text-amber-400">#{luckyDraw.lastWinningNumber}</strong>)
              </span>
            )}
          </div>

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
              🥇 1st Prize (${luckyDraw?.prizeAmount ?? 250})
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
              🥈 2nd Prize (${luckyDraw?.secondPrizeAmount ?? 50})
            </button>
            <button
              type="button"
              onClick={() => setWinnerTierFilter('3rd')}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                winnerTierFilter === '3rd'
                  ? 'bg-emerald-500/30 border-emerald-400 text-emerald-200 shadow-[0_0_10px_rgba(16,185,129,0.3)]'
                  : 'bg-[#050a14] border-slate-800 text-emerald-400/80 hover:text-emerald-300'
              }`}
            >
              🥉 3rd Prize (${luckyDraw?.thirdPrizeAmount ?? 10})
            </button>
          </div>
        </div>

        {(() => {
          const past = luckyDraw?.pastWinners || [];
          const filtered = past.filter((win) => {
            if (winnerTierFilter === '1st') {
              return win.prizeTier?.toLowerCase().includes('1st') || win.matchedDigits === 6;
            }
            if (winnerTierFilter === '2nd') {
              return win.prizeTier?.toLowerCase().includes('2nd') || win.matchedDigits === 5;
            }
            if (winnerTierFilter === '3rd') {
              return win.prizeTier?.toLowerCase().includes('3rd') || win.matchedDigits === 4;
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
                const is1st = win.prizeTier?.toLowerCase().includes('1st') || win.matchedDigits === 6;
                const is2nd = win.prizeTier?.toLowerCase().includes('2nd') || win.matchedDigits === 5;

                const cardStyle = is1st
                  ? 'border-amber-500/50 shadow-[0_0_15px_rgba(245,158,11,0.2)]'
                  : is2nd
                  ? 'border-purple-500/50 shadow-[0_0_15px_rgba(168,85,247,0.2)]'
                  : 'border-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,0.2)]';

                const badgeStyle = is1st
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                  : is2nd
                  ? 'bg-purple-500/20 text-purple-300 border-purple-500/40'
                  : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';

                const amountColor = is1st
                  ? 'text-amber-400'
                  : is2nd
                  ? 'text-purple-300'
                  : 'text-emerald-400';

                return (
                  <div
                    key={win.id}
                    className={`bg-[#050a14] border rounded-2xl p-4 flex items-center justify-between gap-3 ${cardStyle}`}
                  >
                    <div className="space-y-1">
                      <div className="text-xs font-bold text-white flex items-center gap-1.5">
                        <Crown className={`w-3.5 h-3.5 ${is1st ? 'text-amber-400' : is2nd ? 'text-purple-300' : 'text-emerald-400'}`} />
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
                      <div className={`text-sm font-black ${amountColor}`}>+${win.prizeAmount} USDT</div>
                      <div className="text-[9px] text-slate-500">
                        {new Date(win.wonAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })()}
      </div>

      {/* 5. ADMIN CONTROLLER PANEL (Riggable / Select Winner & Trigger) */}
      {(currentUser.isAdmin || currentUser.nodeId === 'NX-ROOT01') && (
        <div className="bg-[#0d0a18] border-2 border-rose-500/60 rounded-3xl p-5 sm:p-6 shadow-[0_0_30px_rgba(244,63,94,0.2)] space-y-5">
          <div className="flex items-center justify-between border-b border-rose-500/30 pb-3">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-rose-400" />
              <span className="text-sm font-bold text-rose-300 uppercase tracking-wider">
                Admin Lucky Draw Control Panel
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
              {/* Select / Rig Winner */}
              <div className="bg-[#05050f] border border-rose-500/30 rounded-2xl p-4 space-y-3">
                <div className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                  <UserCheck className="w-4 h-4 text-amber-400" />
                  <span>Choose / Select Next Draw Winner (Rigged Mode)</span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Select any user from the list below or specify exact winning coupon number. When you click "Trigger Draw", the electric roller stops on this coupon and evaluates 1st, 2nd, and 3rd prizes!
                </p>

                <div className="space-y-2">
                  <div className="relative">
                    <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      placeholder="Search user by name or Node ID..."
                      value={adminSearchUser}
                      onChange={(e) => setAdminSearchUser(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 bg-[#0a0a18] border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500"
                    />
                  </div>

                  <select
                    value={forcedUserId}
                    onChange={(e) => setForcedUserId(e.target.value)}
                    className="w-full p-2.5 bg-[#0a0a18] border border-slate-700 rounded-xl text-xs text-amber-300 font-bold focus:outline-none focus:border-rose-500"
                  >
                    <option value="">-- No Forced Winner (Random Pick) --</option>
                    {filteredAdminUsers.map((u) => (
                      <option key={u.id} value={u.id}>
                        #{u.nodeId} - {u.name} ({u.email})
                      </option>
                    ))}
                  </select>

                  {selectedWinnerUser && (
                    <div className="p-2.5 bg-amber-500/10 border border-amber-500/30 rounded-xl text-xs text-amber-300 flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
                      <span>
                        Selected Winner: <strong className="text-white">{selectedWinnerUser.name}</strong> (#{selectedWinnerUser.nodeId})
                      </span>
                    </div>
                  )}

                  <div className="pt-1">
                    <label className="text-[11px] text-slate-400">Or specify exact winning Coupon Number (6 Digits):</label>
                    <input
                      type="text"
                      maxLength={6}
                      placeholder="e.g. 839210"
                      value={forcedTicketNum}
                      onChange={(e) => setForcedTicketNum(e.target.value)}
                      className="w-full mt-1 p-2 bg-[#0a0a18] border border-slate-800 rounded-xl text-xs text-white placeholder-slate-600 focus:outline-none focus:border-rose-500 font-mono tracking-widest"
                    />
                  </div>
                </div>
              </div>

              {/* Configure Prize Pools & Countdown */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <div>
                  <label className="text-[11px] text-slate-400 font-bold">Ticket Price ($ USDT):</label>
                  <input
                    type="number"
                    value={adminTicketPrice}
                    onChange={(e) => setAdminTicketPrice(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full mt-1 p-2 bg-[#05050f] border border-slate-700 rounded-xl text-xs text-white font-bold"
                  />
                </div>

                <div>
                  <label className="text-[11px] text-amber-400 font-bold">🥇 1st Prize Pool ($ USDT):</label>
                  <input
                    type="number"
                    value={adminPrizeAmount}
                    onChange={(e) => setAdminPrizeAmount(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full mt-1 p-2 bg-[#05050f] border border-amber-500/50 rounded-xl text-xs text-amber-400 font-bold"
                  />
                </div>

                <div>
                  <label className="text-[11px] text-purple-400 font-bold">🥈 2nd Prize Pool ($ USDT):</label>
                  <input
                    type="number"
                    value={adminSecondPrize}
                    onChange={(e) => setAdminSecondPrize(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full mt-1 p-2 bg-[#05050f] border border-purple-500/50 rounded-xl text-xs text-purple-300 font-bold"
                  />
                </div>

                <div>
                  <label className="text-[11px] text-emerald-400 font-bold">🥉 3rd Prize Pool ($ USDT):</label>
                  <input
                    type="number"
                    value={adminThirdPrize}
                    onChange={(e) => setAdminThirdPrize(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full mt-1 p-2 bg-[#05050f] border border-emerald-500/50 rounded-xl text-xs text-emerald-300 font-bold"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleAdminSaveConfig}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs border border-slate-700 transition"
                >
                  Save Tiered Settings
                </button>

                <button
                  type="button"
                  onClick={handleAdminTriggerDraw}
                  disabled={isRolling}
                  className="w-full sm:w-1/2 px-6 py-3 rounded-xl bg-gradient-to-r from-rose-500 via-amber-500 to-amber-400 hover:from-rose-400 hover:to-amber-300 text-black font-black text-sm shadow-[0_0_25px_rgba(244,63,94,0.4)] transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <Play className="w-4 h-4 fill-black" />
                  <span>⚡ START ELECTRIC DRAW ROLL NOW</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
