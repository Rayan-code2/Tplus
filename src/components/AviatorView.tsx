import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Plane, Zap, Award, ArrowUpRight, Shield, AlertTriangle, Play, RefreshCw, History, CheckCircle2, DollarSign, Sparkles } from 'lucide-react';
import { User, AviatorState, AviatorBet } from '../types';

interface AviatorViewProps {
  user: User;
  onRefreshUser: () => void;
  showToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
  onOpenDeposit?: () => void;
  onOpenWithdraw?: () => void;
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
  const [displayMultiplier, setDisplayMultiplier] = useState<number>(1.00);

  // References for zero-latency 60FPS animation & rendering
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameIdRef = useRef<number | null>(null);
  const gameStateRef = useRef<AviatorState | null>(null);
  const myBetRef = useRef<AviatorBet | null>(null);
  const timeOffsetRef = useRef<number>(0);
  const smoothMultiplierRef = useRef<number>(1.00);
  const particlesRef = useRef<Particle[]>([]);
  const crashSparksRef = useRef<Particle[]>([]);
  const radarAngleRef = useRef<number>(0);

  // Sync state refs whenever React state changes
  useEffect(() => {
    gameStateRef.current = gameState;
  }, [gameState]);

  useEffect(() => {
    myBetRef.current = myCurrentBet;
  }, [myCurrentBet]);

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
        gameStateRef.current = data.state;
        setGameState(data.state);

        // Safe synchronization for myBet so optimistic bet is not wiped out
        const localBet = myBetRef.current;
        if (data.myBet) {
          myBetRef.current = data.myBet;
          setMyCurrentBet(data.myBet);
        } else if (localBet) {
          // If a new round has started on server, reset the bet for the new round
          if (data.state && localBet.roundId && localBet.roundId !== data.state.currentRoundId) {
            myBetRef.current = null;
            setMyCurrentBet(null);
          } else if (data.state && data.state.status === 'crashed' && !localBet.cashedOut) {
            const crashedBet: AviatorBet = { ...localBet, status: 'crashed' as const };
            myBetRef.current = crashedBet;
            setMyCurrentBet(crashedBet);
          }
        } else {
          myBetRef.current = null;
          setMyCurrentBet(null);
        }
      }
    } catch (err) {
      console.error('Error fetching aviator state:', err);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchAviatorState();
    // 700ms polling keeps network fast without freezing client UI
    const interval = setInterval(fetchAviatorState, 700);
    return () => clearInterval(interval);
  }, [fetchAviatorState]);

  // Handle Bet Place - Instant Zero-Delay Optimistic Feedback
  const handlePlaceBet = async () => {
    if (betAmount <= 0) {
      showToast('Please enter a valid bet amount', 'error');
      return;
    }
    const totalAvail = (user?.balance || 0) + (user?.winningBalance || 0) + (user?.depositBalance || 0);
    if (totalAvail < betAmount) {
      showToast(`Insufficient wallet balance! Required: $${betAmount.toFixed(2)} (Available: $${totalAvail.toFixed(2)})`, 'error');
      return;
    }

    if (myBetRef.current && !myBetRef.current.cashedOut && myBetRef.current.status === 'pending') {
      return; // Already placed bet for this round
    }

    const state = gameStateRef.current || gameState;
    const currentM = smoothMultiplierRef.current || 1.0;
    if (state?.status === 'flying' && currentM > 1.15) {
      showToast('Flight supersonic! Please wait for the next flight in a few seconds.', 'error');
      return;
    }

    // INSTANT OPTIMISTIC BET: Flip button to Cashout in 0ms!
    const roundId = state?.currentRoundId || `AV-${Date.now()}`;
    const optimisticBet: AviatorBet = {
      id: `opt-${Date.now()}`,
      userId: user?.id || '',
      userName: user?.name || 'You',
      userNodeId: user?.nodeId || '',
      roundId,
      amount: betAmount,
      cashedOut: false,
      cashoutMultiplier: null,
      payout: 0,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };

    // Synchronously set bet so the cash out button appears immediately!
    myBetRef.current = optimisticBet;
    setMyCurrentBet(optimisticBet);
    setLoadingBet(true);

    try {
      const storedId = user?.id || user?.nodeId || localStorage.getItem('tp_user_id') || '';
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
      if (res.ok && data.success && data.bet) {
        // If user already clicked Cash Out while in-flight, keep cashed out state
        if (myBetRef.current?.cashedOut) {
          // Already cashed out
        } else {
          myBetRef.current = data.bet;
          setMyCurrentBet(data.bet);
        }
        showToast(data.message || 'Bet placed successfully!', 'success');
        onRefreshUser();
      } else {
        // Revert optimistic bet if rejected
        myBetRef.current = null;
        setMyCurrentBet(null);
        showToast(data.error || 'Failed to place bet', 'error');
      }
    } catch (err) {
      myBetRef.current = null;
      setMyCurrentBet(null);
      showToast('Network error placing bet', 'error');
    } finally {
      setLoadingBet(false);
    }
  };

  // Handle Cashout - Instant Zero-Delay Stop Action
  const handleCashout = async () => {
    const bet = myBetRef.current || myCurrentBet;
    if (!bet || bet.cashedOut || loadingCashout) return;

    setLoadingCashout(true);
    const currentM = smoothMultiplierRef.current || displayMultiplier || 1.0;
    const estPayout = Number((bet.amount * currentM).toFixed(2));

    // INSTANT OPTIMISTIC CASHOUT: Freeze UI immediately at current multiplier
    const cashedBet: AviatorBet = {
      ...bet,
      cashedOut: true,
      cashoutMultiplier: currentM,
      payout: estPayout,
      status: 'cashed_out',
    };
    myBetRef.current = cashedBet;
    setMyCurrentBet(cashedBet);

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
        const finalBet: AviatorBet = {
          ...cashedBet,
          cashoutMultiplier: data.multiplier,
          payout: data.payout,
        };
        myBetRef.current = finalBet;
        setMyCurrentBet(finalBet);
        onRefreshUser();
      } else {
        showToast(data.error || 'Cashout missed!', 'error');
        fetchAviatorState();
      }
    } catch (err) {
      showToast('Network error during cashout', 'error');
    } finally {
      setLoadingCashout(false);
    }
  };

  // 60 FPS Butter-Smooth Animation Engine
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let lastTime = performance.now();
    let frameCount = 0;

    const renderLoop = (nowTime: number) => {
      try {
        const dt = Math.min(0.1, (nowTime - lastTime) / 1000);
        lastTime = nowTime;
        frameCount++;

        const state = gameStateRef.current;
        const myBet = myBetRef.current;

        // Handle Canvas DPI & Size dynamically with safe minimums
        const rect = canvas.getBoundingClientRect();
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        const targetWidth = Math.max(300, Math.floor((rect.width || 600) * dpr));
        const targetHeight = Math.max(200, Math.floor((rect.height || 360) * dpr));

        if (canvas.width !== targetWidth || canvas.height !== targetHeight) {
          canvas.width = targetWidth;
          canvas.height = targetHeight;
        }

        ctx.save();
        ctx.scale(dpr, dpr);
        const width = rect.width || 600;
        const height = rect.height || 360;

        // Clear Canvas
        ctx.clearRect(0, 0, width, height);

      // 1. Draw Blueprint Runway Grid Background
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 1;
      const gridSize = 45;
      for (let x = 0; x < width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y < height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // X & Y Axis Flight Markers
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(35, 10);
      ctx.lineTo(35, height - 25);
      ctx.lineTo(width - 10, height - 25);
      ctx.stroke();

      // Axis ticks
      ctx.fillStyle = '#475569';
      ctx.font = '9px monospace';
      ctx.fillText('1.0x', 8, height - 28);
      ctx.fillText('2.0x', 8, height * 0.65);
      ctx.fillText('5.0x', 8, height * 0.35);
      ctx.fillText('10x+', 8, 22);

      // Multiplier Interpolation Calculation
      let currentM = smoothMultiplierRef.current;

      if (!state || state.status === 'waiting') {
        currentM = 1.00;
        smoothMultiplierRef.current = 1.00;

        // Waiting Mode Radar Sweep & Runway Lights
        radarAngleRef.current += dt * 1.5;
        const centerX = width * 0.5;
        const centerY = height * 0.5;
        const radarRadius = Math.min(width, height) * 0.35;

        // Radar circle
        ctx.strokeStyle = 'rgba(245, 158, 11, 0.15)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(centerX, centerY, radarRadius, 0, Math.PI * 2);
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(centerX, centerY, radarRadius * 0.5, 0, Math.PI * 2);
        ctx.stroke();

        // Sweeping radar beam
        const sweepX = centerX + Math.cos(radarAngleRef.current) * radarRadius;
        const sweepY = centerY + Math.sin(radarAngleRef.current) * radarRadius;
        const sweepGrad = ctx.createLinearGradient(centerX, centerY, sweepX, sweepY);
        sweepGrad.addColorStop(0, 'rgba(245, 158, 11, 0.4)');
        sweepGrad.addColorStop(1, 'rgba(245, 158, 11, 0)');
        ctx.strokeStyle = sweepGrad;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.lineTo(sweepX, sweepY);
        ctx.stroke();

        // Pulsing Runway take-off lights along bottom line
        const lightCount = 6;
        for (let i = 0; i < lightCount; i++) {
          const lx = 60 + i * ((width - 120) / (lightCount - 1));
          const ly = height - 25;
          const pulseAlpha = 0.3 + 0.7 * Math.abs(Math.sin(nowTime * 0.003 + i * 0.5));
          ctx.fillStyle = `rgba(245, 158, 11, ${pulseAlpha})`;
          ctx.beginPath();
          ctx.arc(lx, ly, 3, 0, Math.PI * 2);
          ctx.fill();
        }

      } else if (state.status === 'flying') {
        // High-precision client interpolation
        const syncedNow = Date.now() + timeOffsetRef.current;
        const elapsedSec = Math.max(0, (syncedNow - state.startTime) / 1000);
        // Exponential flight curve formula matching server
        const theoreticalMultiplier = Number((1.00 + Math.pow(elapsedSec / 2.5, 1.8)).toFixed(3));

        // Smoothly blend toward theoretical multiplier with no jitter
        if (theoreticalMultiplier > currentM) {
          currentM += (theoreticalMultiplier - currentM) * Math.min(1.0, dt * 18);
        } else {
          currentM = theoreticalMultiplier;
        }

        smoothMultiplierRef.current = currentM;

        // Calculate smooth plane position along quadratic bezier curve
        const startX = 35;
        const startY = height - 25;

        // Normalized progress (capped smoothly)
        const progressX = Math.min(0.92, (currentM - 1.0) / 12.0);
        const endX = startX + (width - 90) * Math.min(0.92, Math.pow(progressX, 0.55));
        const endY = Math.max(40, startY - (height - 85) * Math.min(0.92, Math.pow(progressX, 0.75)));

        const controlX = startX + (endX - startX) * 0.35;
        const controlY = startY;

        // Gradient Fill Under Curve
        const grad = ctx.createLinearGradient(startX, startY, endX, endY);
        grad.addColorStop(0, 'rgba(244, 63, 94, 0.02)');
        grad.addColorStop(0.6, 'rgba(244, 63, 94, 0.15)');
        grad.addColorStop(1, 'rgba(244, 63, 94, 0.45)');

        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.quadraticCurveTo(controlX, controlY, endX, endY);
        ctx.lineTo(endX, startY);
        ctx.closePath();
        ctx.fillStyle = grad;
        ctx.fill();

        // Main Flight Trail Glowing Line
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.quadraticCurveTo(controlX, controlY, endX, endY);
        ctx.strokeStyle = '#f43f5e';
        ctx.lineWidth = 3.5;
        ctx.shadowColor = '#f43f5e';
        ctx.shadowBlur = 15;
        ctx.stroke();
        ctx.shadowBlur = 0; // reset shadow

        // Calculate tangent flight angle
        const tangentDx = endX - controlX;
        const tangentDy = endY - controlY;
        const baseAngle = Math.atan2(tangentDy, tangentDx);
        // Slight natural aerodynamic turbulence bobbing
        const wobble = Math.sin(nowTime * 0.007) * 0.04;
        const flightAngle = baseAngle + wobble;

        // Spawn Jet Engine Exhaust Particles
        const engineOffsetX = -18 * Math.cos(flightAngle);
        const engineOffsetY = -18 * Math.sin(flightAngle);
        const nozzleX = endX + engineOffsetX;
        const nozzleY = endY + engineOffsetY;

        for (let p = 0; p < 3; p++) {
          particlesRef.current.push({
            x: nozzleX,
            y: nozzleY,
            vx: -Math.cos(flightAngle) * (60 + Math.random() * 80) + (Math.random() - 0.5) * 20,
            vy: -Math.sin(flightAngle) * (60 + Math.random() * 80) + (Math.random() - 0.5) * 20,
            size: 2.5 + Math.random() * 3,
            alpha: 1.0,
            color: Math.random() > 0.4 ? '#ff6b00' : '#f59e0b',
            life: 0,
            maxLife: 0.35 + Math.random() * 0.25,
          });
        }

        // Render & Update Jet Flame Particles
        for (let i = particlesRef.current.length - 1; i >= 0; i--) {
          const pt = particlesRef.current[i];
          pt.life += dt;
          if (pt.life >= pt.maxLife) {
            particlesRef.current.splice(i, 1);
            continue;
          }
          pt.x += pt.vx * dt;
          pt.y += pt.vy * dt;
          const currentAlpha = Math.max(0, (1 - pt.life / pt.maxLife) * 0.8);

          ctx.fillStyle = pt.color;
          ctx.globalAlpha = currentAlpha;
          ctx.beginPath();
          ctx.arc(pt.x, pt.y, pt.size * (1 - pt.life / pt.maxLife), 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.globalAlpha = 1.0;

        // Draw Sleek Supersonic Jet Plane
        ctx.save();
        ctx.translate(endX, endY);
        ctx.rotate(flightAngle);

        // Plane Shadow Glow
        ctx.shadowColor = '#f43f5e';
        ctx.shadowBlur = 20;

        // Underbody Wings
        ctx.fillStyle = '#9f1239';
        ctx.beginPath();
        ctx.moveTo(-6, -24);
        ctx.lineTo(10, -2);
        ctx.lineTo(-14, -2);
        ctx.closePath();
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(-6, 24);
        ctx.lineTo(10, 2);
        ctx.lineTo(-14, 2);
        ctx.closePath();
        ctx.fill();

        // Tail Wings
        ctx.fillStyle = '#be123c';
        ctx.beginPath();
        ctx.moveTo(-18, -12);
        ctx.lineTo(-10, -2);
        ctx.lineTo(-20, -2);
        ctx.closePath();
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(-18, 12);
        ctx.lineTo(-10, 2);
        ctx.lineTo(-20, 2);
        ctx.closePath();
        ctx.fill();

        // Main Jet Fuselage Body (Metallic Rose to Pearl White Gradient)
        const bodyGrad = ctx.createLinearGradient(-22, 0, 26, 0);
        bodyGrad.addColorStop(0, '#e11d48');
        bodyGrad.addColorStop(0.5, '#fb7185');
        bodyGrad.addColorStop(1, '#ffffff');

        ctx.fillStyle = bodyGrad;
        ctx.beginPath();
        ctx.moveTo(26, 0); // Nose cone
        ctx.quadraticCurveTo(8, -8, -20, -7);
        ctx.lineTo(-22, 7);
        ctx.quadraticCurveTo(8, 8, 26, 0);
        ctx.closePath();
        ctx.fill();

        // Cockpit Cyan Glass Tint
        ctx.fillStyle = '#38bdf8';
        ctx.shadowColor = '#38bdf8';
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.ellipse(11, -1, 6, 3, Math.PI / 8, 0, Math.PI * 2);
        ctx.fill();

        // Racing Stripe Accent
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(-12, 0);
        ctx.lineTo(16, 0);
        ctx.stroke();

        ctx.restore();

      } else if (state.status === 'crashed') {
        currentM = state.currentMultiplier;
        smoothMultiplierRef.current = currentM;

        // Crash Explosion Point
        const startX = 35;
        const startY = height - 25;
        const progressX = Math.min(0.92, (currentM - 1.0) / 12.0);
        const crashX = startX + (width - 90) * Math.min(0.92, Math.pow(progressX, 0.55));
        const crashY = Math.max(40, startY - (height - 85) * Math.min(0.92, Math.pow(progressX, 0.75)));

        // Spawn Crash Sparks once on crash entry
        if (crashSparksRef.current.length === 0) {
          for (let s = 0; s < 40; s++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 40 + Math.random() * 120;
            crashSparksRef.current.push({
              x: crashX,
              y: crashY,
              vx: Math.cos(angle) * speed,
              vy: Math.sin(angle) * speed,
              size: 2 + Math.random() * 4,
              alpha: 1.0,
              color: Math.random() > 0.5 ? '#ef4444' : '#f59e0b',
              life: 0,
              maxLife: 0.8 + Math.random() * 0.6,
            });
          }
        }

        // Draw Explosion Blast Rings
        ctx.save();
        ctx.translate(crashX, crashY);
        ctx.fillStyle = 'rgba(239, 68, 68, 0.8)';
        ctx.shadowColor = '#ef4444';
        ctx.shadowBlur = 30;
        ctx.beginPath();
        ctx.arc(0, 0, 16, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#f59e0b';
        ctx.beginPath();
        ctx.arc(0, 0, 9, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // Render Sparks
        for (let i = crashSparksRef.current.length - 1; i >= 0; i--) {
          const sp = crashSparksRef.current[i];
          sp.life += dt;
          if (sp.life >= sp.maxLife) {
            crashSparksRef.current.splice(i, 1);
            continue;
          }
          sp.x += sp.vx * dt;
          sp.y += sp.vy * dt;
          const alpha = (1 - sp.life / sp.maxLife);

          ctx.fillStyle = sp.color;
          ctx.globalAlpha = alpha;
          ctx.beginPath();
          ctx.arc(sp.x, sp.y, sp.size * alpha, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.globalAlpha = 1.0;
      }

      ctx.restore();

      // Safe state updates for React
      if (state) {
        if (state.status === 'crashed') {
          setDisplayMultiplier(state.currentMultiplier);
        } else if (state.status === 'flying') {
          if (frameCount % 2 === 0) {
            setDisplayMultiplier(Number(currentM.toFixed(2)));
          }
        } else if (state.status === 'waiting') {
          if (displayMultiplier !== 1.00) {
            setDisplayMultiplier(1.00);
          }
        }
      }
    } catch (err) {
      console.error('Aviator renderLoop error:', err);
    } finally {
      animFrameIdRef.current = requestAnimationFrame(renderLoop);
    }
  };

    animFrameIdRef.current = requestAnimationFrame(renderLoop);

    return () => {
      if (animFrameIdRef.current) {
        cancelAnimationFrame(animFrameIdRef.current);
      }
    };
  }, []);

  const currentMult = displayMultiplier;
  const isCrashed = gameState?.status === 'crashed';
  const isWaiting = gameState?.status === 'waiting';
  const isFlying = gameState?.status === 'flying';

  return (
    <div className="space-y-4 pb-8 font-mono">
      {/* Compact Header Bar with Balances & Quick Cashier */}
      <div className="bg-gradient-to-r from-rose-950/50 via-[#0d1627] to-[#070d18] border border-rose-500/30 rounded-2xl p-3 sm:p-4 relative overflow-hidden flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-[0_0_20px_rgba(244,63,94,0.12)]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-500 to-purple-600 flex items-center justify-center text-white shadow-[0_0_15px_rgba(244,63,94,0.4)] shrink-0">
            <Plane className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-black text-white tracking-wider uppercase">AVIATOR CRASH</h1>
              <span className="bg-rose-500/20 text-rose-300 border border-rose-500/40 text-[9px] font-black px-2 py-0.5 rounded-full flex items-center gap-1 shadow-[0_0_8px_rgba(244,63,94,0.25)]">
                <Sparkles className="w-3 h-3 text-amber-300" />
                60 FPS LIVE
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-sans">
              Watch multiplier soar & cash out before the supersonic jet crashes!
            </p>
          </div>
        </div>

        {/* User Balance & Instant Cashier Buttons */}
        <div className="flex items-center gap-3 bg-[#070e1b]/80 border border-cyan-500/30 px-3 py-1.5 rounded-xl self-start sm:self-auto">
          <div className="flex items-center gap-3 text-xs">
            <div>
              <div className="text-[9px] text-cyan-400 uppercase font-bold">Play Balance</div>
              <div className="font-black text-cyan-300">${(user.depositBalance || 0).toFixed(2)}</div>
            </div>
            <div className="h-6 w-[1px] bg-slate-800" />
            <div>
              <div className="text-[9px] text-amber-400 uppercase font-bold">Winnings</div>
              <div className="font-black text-amber-300">${(user.winningBalance || 0).toFixed(2)}</div>
            </div>
          </div>

          <div className="flex items-center gap-1.5 border-l border-slate-800 pl-2.5">
            {onOpenDeposit && (
              <button
                onClick={onOpenDeposit}
                className="px-2.5 py-1 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-[10px] transition shadow-[0_0_8px_rgba(16,185,129,0.3)]"
              >
                + Deposit
              </button>
            )}
            {onOpenWithdraw && (
              <button
                onClick={onOpenWithdraw}
                className="px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 font-black text-[10px] transition"
              >
                Cash Out
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Crash Multipliers History Bar */}
      <div className="bg-[#060b14] border border-slate-800/80 px-3 py-2 rounded-xl flex items-center gap-2 overflow-x-auto no-scrollbar">
        <div className="flex items-center gap-1 text-[11px] text-slate-400 font-bold px-1 shrink-0 border-r border-slate-800 pr-2.5">
          <History className="w-3.5 h-3.5 text-cyan-400" />
          <span>PAST FLIGHTS:</span>
        </div>
        {gameState?.history?.slice(-15).map((h, idx) => (
          <span
            key={idx}
            className={`text-[11px] font-black px-2 py-0.5 rounded-md shrink-0 border transition ${
              h >= 10.0
                ? 'bg-purple-500/20 text-purple-300 border-purple-500/50 shadow-[0_0_8px_rgba(168,85,247,0.3)]'
                : h >= 2.0
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                : 'bg-rose-500/15 text-rose-400 border-rose-500/30'
            }`}
          >
            {h.toFixed(2)}x
          </span>
        ))}
      </div>

      {/* MAIN UNIFIED COCKPIT: FLIGHT CHART + BET CONTROLS IN SAME VIEWPORT */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        
        {/* Left / Top: Main 60FPS Flight Chart Canvas */}
        <div className="lg:col-span-8 flex flex-col space-y-3">
          <div className="bg-[#050811] border border-rose-500/30 rounded-2xl p-4 sm:p-5 relative overflow-hidden h-[300px] sm:h-[360px] md:h-[400px] flex flex-col justify-between shadow-[0_0_30px_rgba(244,63,94,0.18)]">
            {/* Background High-Performance 60FPS Canvas */}
            <canvas
              ref={canvasRef}
              className="absolute inset-0 w-full h-full pointer-events-none opacity-90"
            />

            {/* Top Stage Header Overlay */}
            <div className="relative z-10 flex items-center justify-between text-xs font-mono">
              <span className="flex items-center gap-1.5 text-slate-400 bg-slate-900/80 border border-slate-800 px-2.5 py-1 rounded-lg backdrop-blur-md">
                <Shield className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-[10px] text-emerald-300 font-bold">PROVABLY FAIR SHA-256</span>
              </span>
              <span className="text-cyan-300 bg-cyan-950/60 border border-cyan-500/30 px-2.5 py-1 rounded-lg text-[10px] font-black backdrop-blur-md">
                ROUND #{gameState?.currentRoundId || 'LIVE'}
              </span>
            </div>

            {/* Center Stage Info Overlay */}
            <div className="relative z-10 flex flex-col items-center justify-center my-auto py-2">
              {isWaiting && (
                <div key="state-waiting" className="text-center space-y-2">
                  <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-black animate-pulse shadow-[0_0_12px_rgba(245,158,11,0.25)]">
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    PREPARING FOR TAKE OFF...
                  </div>
                  <div className="text-3xl sm:text-5xl font-black text-amber-400 tracking-tight">
                    PLACE YOUR BETS
                  </div>
                  <p className="text-[11px] text-slate-300 font-sans">Flight takes off in seconds!</p>
                </div>
              )}

              {isFlying && (
                <div key="state-flying" className="text-center space-y-1 select-none">
                  {/* Smooth Multiplier Display */}
                  <div className="text-6xl sm:text-7xl md:text-8xl font-black tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-rose-400 via-pink-300 to-amber-300 drop-shadow-[0_0_35px_rgba(244,63,94,0.7)] font-mono">
                    {currentMult.toFixed(2)}x
                  </div>
                  <div className="text-[11px] text-rose-400 font-black tracking-widest uppercase flex items-center justify-center gap-1.5">
                    <Plane className="w-4 h-4 animate-bounce" />
                    JET IN SUPERSONIC FLIGHT
                  </div>
                </div>
              )}

              {isCrashed && (
                <div key="state-crashed" className="text-center space-y-1.5 animate-bounce select-none">
                  <div className="text-4xl sm:text-6xl md:text-7xl font-black text-red-500 tracking-tight drop-shadow-[0_0_35px_rgba(239,68,68,0.9)]">
                    FLEW AWAY @ {currentMult.toFixed(2)}x
                  </div>
                  <div className="inline-block px-3 py-0.5 bg-red-500/20 border border-red-500/40 rounded-full text-[11px] font-black text-red-300 uppercase">
                    PLANE CRASHED
                  </div>
                </div>
              )}
            </div>

            {/* In-Chart Action Bar (Floating Cashout / Bet Bar on Mobile / Desktop) */}
            <div className="relative z-10 flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-800/80 backdrop-blur-sm">
              <span className="text-[10px] text-slate-400">
                Current Pool: <strong className="text-cyan-300 font-mono">${gameState?.bets?.reduce((acc, b) => acc + b.amount, 0).toFixed(2) || '0.00'}</strong>
              </span>

              {/* Quick Status Pill */}
              {myCurrentBet && !myCurrentBet.cashedOut && myCurrentBet.status === 'pending' && isFlying ? (
                <span className="text-[10px] bg-emerald-500/20 border border-emerald-500/50 text-emerald-300 font-black px-2 py-0.5 rounded-md animate-pulse">
                  ACTIVE BET: ${myCurrentBet.amount} USDT
                </span>
              ) : myCurrentBet && myCurrentBet.cashedOut ? (
                <span className="text-[10px] bg-emerald-500/20 border border-emerald-500/50 text-emerald-300 font-black px-2 py-0.5 rounded-md">
                  WON +${myCurrentBet.payout.toFixed(2)} USDT
                </span>
              ) : (
                <span className="text-[10px] text-slate-500 font-bold">
                  {isFlying ? 'ROUND IN PROGRESS' : 'READY TO BET'}
                </span>
              )}
            </div>
          </div>

          {/* Unified Primary Flight Action Button (Bet & Instant Cashout - Single Central Control) */}
          <div className="w-full">
            {myCurrentBet && !myCurrentBet.cashedOut && myCurrentBet.status === 'pending' && isFlying ? (
              <button
                key="btn-cashout"
                type="button"
                disabled={loadingCashout}
                onClick={handleCashout}
                className="w-full py-4 sm:py-5 rounded-2xl font-black text-lg sm:text-xl bg-gradient-to-r from-amber-400 via-emerald-400 to-green-400 text-slate-950 shadow-[0_0_30px_rgba(16,185,129,0.6)] active:scale-[0.98] transition flex items-center justify-center gap-2.5 animate-pulse cursor-pointer border-2 border-emerald-300"
              >
                <ArrowUpRight className="w-6 h-6 sm:w-7 sm:h-7 stroke-[3]" />
                <span className="font-mono tracking-wide">
                  CASH OUT (${(myCurrentBet.amount * currentMult).toFixed(2)} USDT)
                </span>
              </button>
            ) : myCurrentBet && !myCurrentBet.cashedOut && myCurrentBet.status === 'pending' && !isFlying ? (
              <div key="btn-locked" className="w-full py-4 rounded-2xl font-black text-sm sm:text-base text-center bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(6,182,212,0.2)]">
                <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping" />
                <span>BET LOCKED (${myCurrentBet.amount} USDT) • READY TO CASH OUT AT TAKEOFF</span>
              </div>
            ) : myCurrentBet && myCurrentBet.cashedOut ? (
              <div key="btn-won" className="w-full py-4 rounded-2xl font-black text-center bg-emerald-500/20 border-2 border-emerald-500/50 text-emerald-300 text-sm sm:text-base flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(16,185,129,0.3)]">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                <span>CASHED OUT AT {myCurrentBet.cashoutMultiplier?.toFixed(2)}x (+${myCurrentBet.payout.toFixed(2)} USDT)</span>
              </div>
            ) : (
              <button
                key="btn-bet"
                type="button"
                disabled={loadingBet || (isFlying && !isWaiting && (gameState?.currentMultiplier || 1) > 1.15)}
                onClick={handlePlaceBet}
                className={`w-full py-4 sm:py-4.5 rounded-2xl font-black text-base sm:text-lg transition flex items-center justify-center gap-2.5 shadow-lg ${
                  isFlying && (gameState?.currentMultiplier || 1) > 1.15
                    ? 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
                    : 'bg-gradient-to-r from-rose-500 via-pink-600 to-purple-600 text-white shadow-[0_0_25px_rgba(244,63,94,0.4)] active:scale-[0.98] cursor-pointer hover:brightness-110'
                }`}
              >
                <Plane className="w-5 h-5" />
                <span>
                  {loadingBet
                    ? 'PLACING BET...'
                    : isFlying && (gameState?.currentMultiplier || 1) > 1.15
                    ? 'ROUND IN PROGRESS (WAIT FOR NEXT FLIGHT)'
                    : `BET $${betAmount} USDT`}
                </span>
              </button>
            )}
          </div>
        </div>

        {/* Right / Side-by-Side: Dedicated High-Speed Betting Cockpit */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-[#080d17] border border-cyan-500/30 p-4 sm:p-5 rounded-2xl space-y-3.5 shadow-[0_0_20px_rgba(6,182,212,0.1)]">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
              <div className="font-extrabold text-xs text-cyan-300 flex items-center gap-1.5 uppercase">
                <Zap className="w-4 h-4 text-amber-400" />
                <span>Stake & Settings</span>
              </div>
              <span className="text-[10px] text-slate-400 font-mono">Min $1 - Max $1,000</span>
            </div>

            {/* Stake Input Controls */}
            <div className="space-y-2.5 pt-1">
              <div>
                <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
                  <span>Bet Stake ($ USDT)</span>
                  <span className="text-cyan-400 font-bold">${betAmount} USDT</span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={1}
                    value={betAmount}
                    onChange={(e) => setBetAmount(Math.max(1, Number(e.target.value)))}
                    className="w-full bg-[#0d1626] border border-slate-700 rounded-xl px-3 py-2 text-white font-bold focus:outline-none focus:border-cyan-400 text-sm font-mono"
                    placeholder="1.00"
                  />
                  <button
                    type="button"
                    onClick={() => setBetAmount((prev) => prev * 2)}
                    className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-cyan-300 font-black text-xs rounded-xl border border-slate-700 transition shrink-0"
                  >
                    2X
                  </button>
                  <button
                    type="button"
                    onClick={() => setBetAmount((prev) => Math.max(1, Math.floor(prev / 2)))}
                    className="px-2.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl border border-slate-700 transition shrink-0"
                  >
                    1/2
                  </button>
                </div>
              </div>

              {/* Quick Chip Presets */}
              <div className="grid grid-cols-5 gap-1.5">
                {[1, 5, 10, 50, 100].map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setBetAmount(amt)}
                    className={`py-1 rounded-lg text-[11px] font-black border transition ${
                      betAmount === amt
                        ? 'bg-cyan-500/25 text-cyan-300 border-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.25)]'
                        : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                    }`}
                  >
                    ${amt}
                  </button>
                ))}
              </div>

              {/* Auto Cashout Multiplier Input */}
              <div className="pt-1">
                <label className="text-[11px] text-slate-400 block mb-1">
                  Auto Cashout Target (Optional)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.1"
                    min="1.1"
                    value={autoCashout}
                    onChange={(e) => setAutoCashout(e.target.value)}
                    className="w-full bg-[#0d1626] border border-slate-700 rounded-xl px-3 py-2 text-white font-bold focus:outline-none focus:border-cyan-400 text-xs font-mono"
                    placeholder="e.g. 2.00x (Auto exit)"
                  />
                  <span className="absolute right-3 top-2 text-slate-500 font-bold text-xs">X</span>
                </div>
              </div>
            </div>

            {/* Live Active Bets List in this Box */}
            <div className="pt-2 border-t border-slate-800/80">
              <div className="flex items-center justify-between text-[11px] text-slate-400 font-bold mb-2">
                <span className="flex items-center gap-1 text-slate-300">
                  <Award className="w-3.5 h-3.5 text-cyan-400" />
                  Live Stakes ({gameState?.bets?.length || 0})
                </span>
                <span className="text-cyan-400 font-mono">
                  ${gameState?.bets?.reduce((acc, b) => acc + b.amount, 0).toFixed(2) || '0.00'}
                </span>
              </div>

              <div className="space-y-1.5 max-h-[160px] overflow-y-auto pr-1">
                {gameState?.bets && gameState.bets.length > 0 ? (
                  gameState.bets.map((bet) => (
                    <div
                      key={bet.id}
                      className={`p-1.5 px-2 rounded-lg border flex items-center justify-between text-[11px] transition ${
                        bet.cashedOut
                          ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-200'
                          : bet.status === 'crashed'
                          ? 'bg-red-500/5 border-red-500/20 text-slate-500 line-through'
                          : 'bg-slate-900/60 border-slate-800 text-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-1.5">
                        <span className="text-cyan-400 font-mono font-bold">#{bet.userNodeId.substring(3, 6)}</span>
                        <span className="text-slate-200 truncate max-w-[80px] font-sans">{bet.userName}</span>
                      </div>
                      <div className="text-right font-mono">
                        {bet.cashedOut ? (
                          <span className="text-emerald-400 font-bold">
                            {bet.cashoutMultiplier?.toFixed(2)}x (+${bet.payout.toFixed(2)})
                          </span>
                        ) : bet.status === 'crashed' ? (
                          <span className="text-red-400">CRASH</span>
                        ) : (
                          <span className="text-amber-400 animate-pulse">${bet.amount}</span>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-3 text-[10px] text-slate-500">
                    No active bets yet.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

