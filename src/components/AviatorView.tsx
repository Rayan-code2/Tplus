import React, { useState, useEffect, useRef } from 'react';
import { Plane, Zap, Award, ArrowUpRight, Shield, AlertTriangle, Play, RefreshCw, History, CheckCircle2, DollarSign } from 'lucide-react';
import { User, AviatorState, AviatorBet } from '../types';

interface AviatorViewProps {
  user: User;
  onRefreshUser: () => void;
  showToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
  onOpenDeposit?: () => void;
  onOpenWithdraw?: () => void;
}

export const AviatorView: React.FC<AviatorViewProps> = ({
  user,
  onRefreshUser,
  showToast,
  onOpenDeposit,
  onOpenWithdraw,
}) => {
  const [gameState, setGameState] = useState<AviatorState | null>(null);
  const [betAmount, setBetAmount] = useState<number>(1);
  const [autoCashout, setAutoCashout] = useState<string>('');
  const [loadingBet, setLoadingBet] = useState<boolean>(false);
  const [loadingCashout, setLoadingCashout] = useState<boolean>(false);
  const [myCurrentBet, setMyCurrentBet] = useState<AviatorBet | null>(null);

  // Canvas plane animation ref
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Fetch Game State loop
  const fetchAviatorState = async () => {
    try {
      const storedId = user?.id || localStorage.getItem('tp_user_id') || '';
      const res = await fetch('/api/aviator', {
        headers: {
          'x-user-id': storedId,
        },
      });
      if (res.ok) {
        const data = await res.json();
        setGameState(data.state);
        setMyCurrentBet(data.myBet || null);
      }
    } catch (err) {
      console.error('Error fetching aviator state:', err);
    }
  };

  useEffect(() => {
    fetchAviatorState();
    const interval = setInterval(fetchAviatorState, 500); // 500ms fast polling for smooth multiplier updates
    return () => clearInterval(interval);
  }, [user?.id]);

  // Handle Bet Place
  const handlePlaceBet = async () => {
    if (betAmount <= 0) {
      showToast('Please enter a valid bet amount', 'error');
      return;
    }
    if (user.balance < betAmount) {
      showToast('Insufficient wallet balance!', 'error');
      return;
    }

    setLoadingBet(true);
    try {
      const storedId = user?.id || localStorage.getItem('tp_user_id') || '';
      const res = await fetch('/api/aviator/bet', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': storedId,
        },
        body: JSON.stringify({
          amount: betAmount,
          autoCashout: autoCashout ? parseFloat(autoCashout) : null,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast(data.message || 'Bet placed successfully!', 'success');
        onRefreshUser();
        fetchAviatorState();
      } else {
        showToast(data.error || 'Failed to place bet', 'error');
      }
    } catch (err) {
      showToast('Network error placing bet', 'error');
    } finally {
      setLoadingBet(false);
    }
  };

  // Handle Cashout
  const handleCashout = async () => {
    if (!myCurrentBet || myCurrentBet.cashedOut) return;

    setLoadingCashout(true);
    try {
      const storedId = user?.id || localStorage.getItem('tp_user_id') || '';
      const res = await fetch('/api/aviator/cashout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': storedId,
        },
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast(`CASHED OUT! Won $${data.payout.toFixed(2)} USDT (${data.multiplier}x)`, 'success');
        onRefreshUser();
        fetchAviatorState();
      } else {
        showToast(data.error || 'Cashout failed!', 'error');
      }
    } catch (err) {
      showToast('Network error during cashout', 'error');
    } finally {
      setLoadingCashout(false);
    }
  };

  // Render Canvas Trail Animation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !gameState) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    ctx.clearRect(0, 0, width, height);

    // Draw Grid background lines
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 1;
    for (let x = 0; x < width; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = 0; y < height; y += 40) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    if (gameState.status === 'flying' || gameState.status === 'crashed') {
      const mult = gameState.currentMultiplier;
      // Calculate curve trajectory progress based on multiplier
      const maxM = Math.max(2.0, gameState.targetCrashMultiplier || 2.0);
      const progress = Math.min(1.0, (mult - 1.0) / (maxM * 1.2));

      const startX = 30;
      const startY = height - 30;
      const endX = startX + (width - 80) * progress;
      const endY = startY - (height - 80) * Math.min(1.0, Math.pow(progress, 0.8));

      // Draw Gradient fill area under curve
      const gradient = ctx.createLinearGradient(startX, startY, endX, endY);
      if (gameState.status === 'crashed') {
        gradient.addColorStop(0, 'rgba(239, 68, 68, 0.05)');
        gradient.addColorStop(1, 'rgba(239, 68, 68, 0.35)');
      } else {
        gradient.addColorStop(0, 'rgba(236, 72, 153, 0.05)');
        gradient.addColorStop(1, 'rgba(236, 72, 153, 0.4)');
      }

      ctx.beginPath();
      ctx.moveTo(startX, startY);
      ctx.quadraticCurveTo(startX + (endX - startX) * 0.5, startY, endX, endY);
      ctx.lineTo(endX, startY);
      ctx.closePath();
      ctx.fillStyle = gradient;
      ctx.fill();

      // Draw Main Flight Line Curve
      ctx.beginPath();
      ctx.moveTo(startX, startY);
      ctx.quadraticCurveTo(startX + (endX - startX) * 0.5, startY, endX, endY);
      ctx.strokeStyle = gameState.status === 'crashed' ? '#ef4444' : '#ec4899';
      ctx.lineWidth = 4;
      ctx.stroke();

      // Calculate flight tangent angle for plane rotation
      const controlX = startX + (endX - startX) * 0.5;
      const controlY = startY;
      // Tangent vector from quadratic curve at t = 1
      const dx = endX - controlX;
      const dy = endY - controlY;
      const flightAngle = Math.atan2(dy, dx);

      // Draw Big Aeroplane Icon at tip of flight curve
      if (gameState.status === 'flying') {
        ctx.save();
        ctx.translate(endX, endY);
        ctx.rotate(flightAngle);

        // Jet Engine Exhaust Flame Trail
        ctx.save();
        ctx.shadowColor = '#ff6b00';
        ctx.shadowBlur = 25;
        const flameGradient = ctx.createLinearGradient(-25, 0, -45, 0);
        flameGradient.addColorStop(0, 'rgba(255, 200, 0, 0.9)');
        flameGradient.addColorStop(0.5, 'rgba(244, 63, 94, 0.8)');
        flameGradient.addColorStop(1, 'rgba(239, 68, 68, 0)');
        ctx.fillStyle = flameGradient;
        ctx.beginPath();
        ctx.moveTo(-18, -4);
        ctx.lineTo(-38 - Math.random() * 8, 0);
        ctx.lineTo(-18, 4);
        ctx.closePath();
        ctx.fill();
        ctx.restore();

        // Main Aeroplane Body (Sleek Red/Pink Metallic Jet)
        ctx.shadowColor = '#f43f5e';
        ctx.shadowBlur = 20;

        // Wings
        ctx.fillStyle = '#be123c'; // Darker rose for wing underside
        ctx.beginPath();
        ctx.moveTo(-4, -22);
        ctx.lineTo(8, -2);
        ctx.lineTo(-12, -2);
        ctx.closePath();
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(-4, 22);
        ctx.lineTo(8, 2);
        ctx.lineTo(-12, 2);
        ctx.closePath();
        ctx.fill();

        // Tail Wings
        ctx.fillStyle = '#e11d48';
        ctx.beginPath();
        ctx.moveTo(-16, -11);
        ctx.lineTo(-8, -2);
        ctx.lineTo(-18, -2);
        ctx.closePath();
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(-16, 11);
        ctx.lineTo(-8, 2);
        ctx.lineTo(-18, 2);
        ctx.closePath();
        ctx.fill();

        // Fuselage Main Body
        const bodyGradient = ctx.createLinearGradient(-20, 0, 22, 0);
        bodyGradient.addColorStop(0, '#e11d48');
        bodyGradient.addColorStop(0.6, '#fb7185');
        bodyGradient.addColorStop(1, '#ffffff');

        ctx.fillStyle = bodyGradient;
        ctx.beginPath();
        ctx.moveTo(22, 0); // Nose tip
        ctx.quadraticCurveTo(8, -7, -18, -6); // Top fuselage curve
        ctx.lineTo(-20, 6); // Tail end
        ctx.quadraticCurveTo(8, 7, 22, 0); // Bottom fuselage curve
        ctx.closePath();
        ctx.fill();

        // Cockpit Glass Windshield
        ctx.fillStyle = '#38bdf8';
        ctx.shadowColor = '#38bdf8';
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.ellipse(10, -1, 5, 2.5, Math.PI / 8, 0, Math.PI * 2);
        ctx.fill();

        // White Stripe Accent Line
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(-10, 0);
        ctx.lineTo(14, 0);
        ctx.stroke();

        ctx.restore();
      } else if (gameState.status === 'crashed') {
        // Draw Explosion / Crashed Marker
        ctx.save();
        ctx.translate(endX, endY);
        ctx.fillStyle = '#ef4444';
        ctx.shadowColor = '#ef4444';
        ctx.shadowBlur = 30;
        ctx.beginPath();
        ctx.arc(0, 0, 14, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#f59e0b';
        ctx.beginPath();
        ctx.arc(0, 0, 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    }
  }, [gameState?.currentMultiplier, gameState?.status]);

  const currentMult = gameState?.currentMultiplier || 1.0;
  const isCrashed = gameState?.status === 'crashed';
  const isWaiting = gameState?.status === 'waiting';
  const isFlying = gameState?.status === 'flying';

  return (
    <div className="space-y-6 pb-12 font-mono">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-rose-900/40 via-purple-900/30 to-[#080d14] border border-rose-500/30 rounded-2xl p-5 relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-rose-500 to-purple-600 flex items-center justify-center text-white shadow-[0_0_20px_rgba(244,63,94,0.4)] shrink-0">
            <Plane className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black text-white tracking-wider uppercase">AVIATOR CRASH GAME</h1>
              <span className="bg-rose-500/20 text-rose-300 border border-rose-500/40 text-[10px] font-extrabold px-2 py-0.5 rounded-full">
                LIVE MULTIPLIER 100x+
              </span>
            </div>
            <p className="text-xs text-slate-400 font-sans mt-0.5">
              Watch the multiplier soar! Cash out before the plane flies away to win huge USDT payouts.
            </p>
          </div>
        </div>

        {/* User Balance Display */}
        <div className="bg-[#0b1320] border border-cyan-500/30 p-3 px-4 rounded-2xl flex flex-col sm:flex-row items-center gap-4 shrink-0 shadow-lg">
          <div className="flex items-center gap-4">
            <div>
              <div className="text-[10px] text-cyan-400 uppercase tracking-widest font-extrabold flex items-center gap-1">
                <span>💳 Deposit Wallet</span>
              </div>
              <div className="text-base font-black text-cyan-300">${(user.depositBalance || 0).toFixed(2)} USDT</div>
            </div>
            <div className="h-8 w-[1px] bg-slate-800" />
            <div>
              <div className="text-[10px] text-amber-400 uppercase tracking-widest font-extrabold flex items-center gap-1">
                <span>🎮 Winning Wallet</span>
              </div>
              <div className="text-base font-black text-amber-300">${(user.winningBalance || 0).toFixed(2)} USDT</div>
            </div>
          </div>

          <div className="flex items-center gap-2 border-t sm:border-t-0 sm:border-l border-slate-800 pt-2 sm:pt-0 sm:pl-3 w-full sm:w-auto justify-end">
            {onOpenDeposit && (
              <button
                onClick={onOpenDeposit}
                className="px-3 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/50 text-xs font-black transition shadow-[0_0_10px_rgba(16,185,129,0.2)]"
              >
                + Deposit
              </button>
            )}
            {onOpenWithdraw && (
              <button
                onClick={onOpenWithdraw}
                className="px-3 py-1.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/50 text-xs font-black transition shadow-[0_0_10px_rgba(244,63,94,0.2)]"
              >
                Withdraw
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Crash Multipliers History Bar */}
      <div className="bg-[#080d14] border border-slate-800 p-3 rounded-2xl flex items-center gap-2 overflow-x-auto no-scrollbar">
        <div className="flex items-center gap-1.5 text-xs text-slate-400 font-bold px-2 shrink-0 border-r border-slate-800 pr-3">
          <History className="w-3.5 h-3.5 text-cyan-400" />
          <span>HISTORY:</span>
        </div>
        {gameState?.history?.map((h, idx) => (
          <span
            key={idx}
            className={`text-xs font-black px-2.5 py-1 rounded-lg shrink-0 border ${
              h >= 10.0
                ? 'bg-purple-500/20 text-purple-300 border-purple-500/40 shadow-[0_0_10px_rgba(168,85,247,0.3)]'
                : h >= 2.0
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                : 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20'
            }`}
          >
            {h.toFixed(2)}x
          </span>
        ))}
      </div>

      {/* Main Aviator Stage Display */}
      <div className="bg-[#060a12] border border-rose-500/30 rounded-3xl p-6 relative overflow-hidden min-h-[320px] flex flex-col justify-between shadow-[0_0_30px_rgba(244,63,94,0.15)]">
        {/* Background Grid Canvas */}
        <canvas
          ref={canvasRef}
          width={800}
          height={280}
          className="absolute inset-0 w-full h-full object-cover pointer-events-none opacity-80"
        />

        {/* Center Stage Info Overlay */}
        <div className="relative z-10 flex flex-col items-center justify-center my-auto py-8">
          {isWaiting && (
            <div className="text-center space-y-2">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-bold animate-pulse">
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                NEXT ROUND STARTING SOON...
              </div>
              <div className="text-4xl md:text-5xl font-black text-amber-400 tracking-tight">
                WAITING FOR BETS
              </div>
              <p className="text-xs text-slate-400 font-sans">Place your bet now before the plane takes off!</p>
            </div>
          )}

          {isFlying && (
            <div className="text-center space-y-1">
              <div className="text-6xl md:text-7xl font-black tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-rose-400 via-pink-300 to-amber-300 drop-shadow-[0_0_25px_rgba(244,63,94,0.6)]">
                {currentMult.toFixed(2)}x
              </div>
              <div className="text-xs text-rose-400 font-bold tracking-widest uppercase flex items-center justify-center gap-1.5">
                <Plane className="w-4 h-4 animate-bounce" />
                PLANE IN FLIGHT
              </div>
            </div>
          )}

          {isCrashed && (
            <div className="text-center space-y-2 animate-bounce">
              <div className="text-5xl md:text-6xl font-black text-red-500 tracking-tight drop-shadow-[0_0_30px_rgba(239,68,68,0.8)]">
                FLEW AWAY @ {currentMult.toFixed(2)}x
              </div>
              <div className="inline-block px-3 py-1 bg-red-500/20 border border-red-500/40 rounded-full text-xs font-bold text-red-300 uppercase">
                PLANE CRASHED
              </div>
            </div>
          )}
        </div>

        {/* Bottom Stage Footer */}
        <div className="relative z-10 flex items-center justify-between text-xs text-slate-500 pt-4 border-t border-slate-800/80">
          <span className="flex items-center gap-1">
            <Shield className="w-3.5 h-3.5 text-emerald-400" />
            Provably Fair SHA-256 Engine
          </span>
          <span className="text-cyan-400 font-bold">Round #{gameState?.currentRoundId || 'LIVE'}</span>
        </div>
      </div>

      {/* Betting & Control Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Bet Box */}
        <div className="lg:col-span-6 bg-[#080d14] border border-cyan-500/30 p-5 rounded-2xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="font-bold text-sm text-cyan-300 flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-400" />
              PLACE BET & AUTO CASHOUT
            </div>
            <div className="text-xs text-slate-400">Min $1 - Max $1,000</div>
          </div>

          {/* Amount Inputs */}
          <div className="space-y-3">
            <div>
              <label className="text-xs text-slate-400 block mb-1">Bet Amount ($ USDT)</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={1}
                  value={betAmount}
                  onChange={(e) => setBetAmount(Math.max(1, Number(e.target.value)))}
                  className="w-full bg-[#0d1626] border border-slate-700 rounded-xl px-4 py-2.5 text-white font-bold focus:outline-none focus:border-cyan-400 text-sm"
                  placeholder="1.00"
                />
                <button
                  type="button"
                  onClick={() => setBetAmount((prev) => prev * 2)}
                  className="px-3 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl border border-slate-700"
                >
                  2X
                </button>
              </div>
            </div>

            {/* Quick Amount Presets */}
            <div className="flex items-center gap-2">
              {[1, 5, 10, 50, 100].map((amt) => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => setBetAmount(amt)}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-bold border transition ${
                    betAmount === amt
                      ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500'
                      : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
                  }`}
                >
                  ${amt}
                </button>
              ))}
            </div>

            {/* Auto Cashout Input */}
            <div>
              <label className="text-xs text-slate-400 block mb-1">Auto Cashout Multiplier (Optional)</label>
              <input
                type="number"
                step="0.1"
                min="1.1"
                value={autoCashout}
                onChange={(e) => setAutoCashout(e.target.value)}
                className="w-full bg-[#0d1626] border border-slate-700 rounded-xl px-4 py-2 text-white font-bold focus:outline-none focus:border-cyan-400 text-sm"
                placeholder="e.g. 2.0 (Auto Cashout at 2x)"
              />
            </div>
          </div>

          {/* Main Action Button */}
          {myCurrentBet && !myCurrentBet.cashedOut && myCurrentBet.status === 'pending' && isFlying ? (
            /* Cash Out Button during flight */
            <button
              type="button"
              disabled={loadingCashout}
              onClick={handleCashout}
              className="w-full py-4 rounded-xl font-black text-lg bg-gradient-to-r from-amber-500 via-emerald-500 to-green-500 text-black shadow-[0_0_25px_rgba(16,185,129,0.5)] hover:scale-[1.02] active:scale-[0.98] transition flex items-center justify-center gap-2 animate-pulse"
            >
              <ArrowUpRight className="w-6 h-6 stroke-[3]" />
              CASH OUT (${(myCurrentBet.amount * currentMult).toFixed(2)} USDT)
            </button>
          ) : myCurrentBet && myCurrentBet.cashedOut ? (
            /* Already Cashed out status */
            <div className="w-full py-3.5 rounded-xl font-bold text-center bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-sm flex items-center justify-center gap-2">
              <CheckCircle2 className="w-5 h-5" />
              CASHED OUT AT {myCurrentBet.cashoutMultiplier?.toFixed(2)}x (+${myCurrentBet.payout.toFixed(2)} USDT)
            </div>
          ) : (
            /* Place Bet Button */
            <button
              type="button"
              disabled={loadingBet || (isFlying && !isWaiting)}
              onClick={handlePlaceBet}
              className={`w-full py-4 rounded-xl font-black text-base transition flex items-center justify-center gap-2 ${
                isFlying
                  ? 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
                  : 'bg-gradient-to-r from-rose-500 via-pink-600 to-purple-600 text-white shadow-[0_0_20px_rgba(244,63,94,0.4)] hover:opacity-95'
              }`}
            >
              <Plane className="w-5 h-5" />
              {loadingBet ? 'PLACING BET...' : isFlying ? 'WAIT FOR NEXT ROUND' : `BET $${betAmount} USDT`}
            </button>
          )}
        </div>

        {/* Live Bets Table */}
        <div className="lg:col-span-6 bg-[#080d14] border border-slate-800 p-5 rounded-2xl space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="font-bold text-sm text-slate-200 flex items-center gap-2">
              <Award className="w-4 h-4 text-cyan-400" />
              LIVE ROUND STAKES ({gameState?.bets?.length || 0})
            </div>
            <div className="text-xs text-slate-400">
              Total Pool: <span className="text-cyan-300 font-bold">${gameState?.bets?.reduce((acc, b) => acc + b.amount, 0).toFixed(2) || '0.00'}</span>
            </div>
          </div>

          <div className="space-y-2 max-h-[260px] overflow-y-auto pr-1">
            {gameState?.bets && gameState.bets.length > 0 ? (
              gameState.bets.map((bet) => (
                <div
                  key={bet.id}
                  className={`p-2.5 rounded-xl border flex items-center justify-between text-xs transition ${
                    bet.cashedOut
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-200'
                      : bet.status === 'crashed'
                      ? 'bg-red-500/5 border-red-500/20 text-slate-500 line-through'
                      : 'bg-slate-900/60 border-slate-800 text-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-slate-800 flex items-center justify-center font-bold text-[10px] text-cyan-400 border border-slate-700">
                      #{bet.userNodeId.substring(3, 6)}
                    </div>
                    <div>
                      <div className="font-bold text-white truncate max-w-[110px]">{bet.userName}</div>
                      <div className="text-[10px] text-slate-500">${bet.amount.toFixed(2)} USDT</div>
                    </div>
                  </div>

                  <div className="text-right">
                    {bet.cashedOut ? (
                      <div>
                        <div className="font-bold text-emerald-400">{bet.cashoutMultiplier?.toFixed(2)}x</div>
                        <div className="text-[10px] text-emerald-300">+${bet.payout.toFixed(2)} USDT</div>
                      </div>
                    ) : bet.status === 'crashed' ? (
                      <span className="text-red-400 font-bold text-[11px]">CRASHED</span>
                    ) : (
                      <span className="text-amber-400 font-bold text-[11px] animate-pulse">IN FLIGHT...</span>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-xs text-slate-500">
                No active bets placed in this round yet.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
