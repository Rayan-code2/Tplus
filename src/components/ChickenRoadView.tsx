import React, { useEffect, useRef, useState } from 'react';
import { User } from '../types';

interface ChickenRoadViewProps {
  user: User;
  onRefreshUser?: () => void;
  showToast?: (message: string, type?: 'success' | 'error' | 'info') => void;
  onOpenDeposit?: () => void;
  onBack?: () => void;
}

export const ChickenRoadView: React.FC<ChickenRoadViewProps> = ({
  user,
  onRefreshUser,
  showToast,
  onOpenDeposit,
  onBack,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const cvRef = useRef<HTMLCanvasElement>(null);

  // Real unified Main Wallet balance & reactive UI state
  const totalBalance = (user.depositBalance || 0) + (user.winningBalance || 0) + (user.balance || 0);

  // Game UI reactive state
  const [bet, setBet] = useState<number>(100);
  const [diff, setDiff] = useState<number>(1); // 0: Easy, 1: Medium, 2: Hard
  const [step, setStep] = useState<number>(0);
  const [mult, setMult] = useState<number>(1.0);
  const [best, setBest] = useState<number>(0);
  const [gameStatus, setGameStatus] = useState<'idle' | 'play' | 'wait' | 'hop' | 'hit' | 'win'>('idle');
  const [mute, setMute] = useState<boolean>(false);
  const [livePayout, setLivePayout] = useState<number>(0);

  // References to communicate with game loop
  const gameRef = useRef<{
    st: 'idle' | 'play' | 'wait' | 'hop' | 'hit' | 'win';
    bal: number;
    bet: number;
    diff: number;
    step: number;
    mult: number;
    best: number;
    mute: boolean;
    pick: (i: number) => void;
    startHop: () => void;
    hitNow: () => void;
    setup: () => void;
  }>({
    st: 'idle',
    bal: totalBalance,
    bet: 100,
    diff: 1,
    step: 0,
    mult: 1.0,
    best: 0,
    mute: false,
    pick: () => {},
    startHop: () => {},
    hitNow: () => {},
    setup: () => {},
  });

  // Keep gameRef in sync with props/state
  useEffect(() => {
    gameRef.current.diff = diff;
    gameRef.current.bet = bet;
    gameRef.current.mute = mute;
  }, [diff, bet, mute]);

  useEffect(() => {
    gameRef.current.bal = totalBalance;
  }, [totalBalance]);

  // Main Canvas Game Loop (Direct integration of user's chicken-road.html code)
  useEffect(() => {
    const cv = cvRef.current;
    if (!cv) return;
    const cx = cv.getContext('2d');
    if (!cx) return;

    const LX = [0.3, 0.5, 0.7];
    const BY = 0.84;
    const G = 0.29;
    const MAXS = 8;
    const T = 0.17;
    const MINB = 10;
    const MAXB = 10000;
    const VALS = [0.1, 0.2, 0.3, 0.5, 0.7, 1.2, 1.3, 1.5, 1.6, 2.4, 2.5, 2.7, 3.1, 3.2, 3.5];
    const CARS = ['#f5c518', '#d9342b', '#2e9d62', '#d5d9df', '#3b6fd4', '#e07a1f'];
    const DF = [
      { c: 0.05, i: 0.015, g: 5 },
      { c: 0.1, i: 0.02, g: 10 },
      { c: 0.16, i: 0.03, g: 20 },
    ];

    let AC: AudioContext | null = null;
    let ps: any[] = [];
    let shake = 0;
    let W = 0;
    let H = 0;
    let lane = 1;
    let cwx = 0.5;
    let cwy = 0;
    let camY = 0;
    let rows: any[] = [];
    let cars: any[] = [];
    let fx: any[] = [];
    let hop: any = null;
    let pend = -1;
    let wt = 0;
    let ht = 0;
    let hv: any = null;
    let wint = 0;
    let payout = 0;
    let spawnT = 1;
    let tm = 0;
    let tint = 0;
    let walk = 0;
    let animId = 0;
    let isMounted = true;

    const rnd = (a: any[]) => a[Math.floor(Math.random() * a.length)];
    const hash = (n: number) => {
      const s = Math.sin(n * 127.1 + 311.7) * 43758.5453;
      return s - Math.floor(s);
    };
    const sy = (wy: number) => (BY + wy - camY) * H;
    const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
    const ease = (p: number) => (p < 0.5 ? 2 * p * p : 1 - 2 * (1 - p) * (1 - p));

    // Safe rounded rectangle for cross-browser safety
    function rr(x: number, y: number, w: number, h: number, r: number) {
      if (typeof cx!.roundRect === 'function') {
        cx!.beginPath();
        cx!.roundRect(x, y, w, h, r);
        cx!.fill();
      } else {
        const rad = Math.min(r, w / 2, h / 2);
        cx!.beginPath();
        cx!.moveTo(x + rad, y);
        cx!.lineTo(x + w - rad, y);
        cx!.quadraticCurveTo(x + w, y, x + w, y + rad);
        cx!.lineTo(x + w, y + h - rad);
        cx!.quadraticCurveTo(x + w, y + h, x + w - rad, y + h);
        cx!.lineTo(x + rad, y + h);
        cx!.quadraticCurveTo(x, y + h, x, y + h - rad);
        cx!.lineTo(x, y + rad);
        cx!.quadraticCurveTo(x, y, x + rad, y);
        cx!.closePath();
        cx!.fill();
      }
    }

    function fit() {
      if (!cv || !cv.parentElement) return;
      const r = cv.parentElement.getBoundingClientRect();
      const d = Math.min(2, window.devicePixelRatio || 1);
      if (r.width < 2 || r.height < 2) return;
      W = r.width;
      H = r.height;
      cv.width = Math.round(W * d);
      cv.height = Math.round(H * d);
      cx!.setTransform(d, 0, 0, d, 0, 0);
    }

    function genRows() {
      rows = [null];
      for (let k = 1; k <= MAXS; k++) {
        const ng = Math.random() < 0.5 ? 1 : 2;
        const r: number[] = [];
        for (let i = 0; i < 3; i++) {
          r.push(i < ng ? rnd(VALS.filter((v) => v >= 1)) : rnd(VALS.filter((v) => v < 1)));
        }
        r.sort(() => Math.random() - 0.5);
        rows.push(r);
      }
      rows.push([DF[gameRef.current.diff].g]);
    }

    function syncReactUI() {
      const g = gameRef.current;
      setStep(g.step);
      setMult(g.mult);
      setGameStatus(g.st);
      setBest(g.best);
      if (g.st !== 'idle' && g.step > 0) {
        setLivePayout(g.bet * g.mult);
      } else {
        setLivePayout(0);
      }
    }

    function setup() {
      const g = gameRef.current;
      g.step = 0;
      g.mult = 1;
      g.st = 'idle';
      lane = 1;
      cwx = 0.5;
      cwy = 0;
      camY = 0;
      hop = null;
      pend = -1;
      cars = [];
      hv = null;
      genRows();
      syncReactUI();
    }

    function tone(f1: number, f2: number, d: number, ty?: OscillatorType, v?: number, dl?: number) {
      if (gameRef.current.mute) return;
      try {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioCtx) return;
        AC = AC || new AudioCtx();
        if (AC.state === 'suspended') AC.resume();
        const o = AC.createOscillator();
        const g = AC.createGain();
        const t = AC.currentTime + (dl || 0);
        o.type = ty || 'sine';
        o.frequency.setValueAtTime(f1, t);
        o.frequency.exponentialRampToValueAtTime(Math.max(30, f2), t + d);
        g.gain.setValueAtTime(v || 0.15, t);
        g.gain.exponentialRampToValueAtTime(0.001, t + d);
        o.connect(g);
        g.connect(AC.destination);
        o.start(t);
        o.stop(t + d);
      } catch (e) {}
    }

    function noise(d: number, v?: number) {
      if (gameRef.current.mute || !AC) return;
      try {
        const n = Math.floor(AC.sampleRate * d);
        const b = AC.createBuffer(1, n, AC.sampleRate);
        const a = b.getChannelData(0);
        for (let i = 0; i < n; i++) a[i] = (Math.random() * 2 - 1) * (1 - i / n);
        const s = AC.createBufferSource();
        const g = AC.createGain();
        s.buffer = b;
        g.gain.value = v || 0.3;
        s.connect(g);
        g.connect(AC.destination);
        s.start();
      } catch (e) {}
    }

    function vib(p: number | number[]) {
      try {
        if (navigator.vibrate) navigator.vibrate(p);
      } catch (e) {}
    }

    function sfx(k: string) {
      if (k === 'hop') tone(280, 620, 0.14, 'square', 0.06);
      if (k === 'good') {
        tone(660, 660, 0.1, 'triangle', 0.18);
        tone(990, 990, 0.18, 'triangle', 0.18, 0.09);
      }
      if (k === 'bad') tone(330, 150, 0.25, 'sawtooth', 0.1);
      if (k === 'crash') {
        noise(0.5, 0.5);
        tone(180, 40, 0.5, 'sawtooth', 0.2);
        vib(200);
      }
      if (k === 'cash') {
        tone(988, 988, 0.08, 'square', 0.1);
        tone(1319, 1319, 0.25, 'square', 0.1, 0.08);
      }
      if (k === 'win') {
        [523, 659, 784, 1047, 1319].forEach((f, i) => tone(f, f, 0.25, 'triangle', 0.2, i * 0.1));
        vib([80, 40, 80, 40, 160]);
      }
      if (k === 'click') tone(500, 500, 0.05, 'square', 0.05);
    }

    function float(x: number, y: number, t: string, c: string) {
      fx.push({ x, y, t, c, l: 1.4 });
    }

    function burst(x: number, y: number, n: number, cols: string[], sp: number, o?: any) {
      o = o || {};
      for (let i = 0; i < n; i++) {
        const a = Math.random() * 6.28;
        const s = sp * (0.4 + Math.random());
        ps.push({
          x,
          y,
          vx: Math.cos(a) * s,
          vy: Math.sin(a) * s - (o.up || 0),
          g: o.g !== undefined ? o.g : 600,
          l: o.l || 0.8,
          m: o.l || 0.8,
          c: rnd(cols),
          s: (o.s || 5) * (0.6 + Math.random() * 0.8),
          r: Math.random() * 6,
          vr: (Math.random() - 0.5) * 12,
          sh: o.sh || 0,
        });
      }
    }

    function bills(x: number, y: number) {
      for (let i = 0; i < 9; i++) {
        ps.push({
          x,
          y,
          vx: (Math.random() - 0.3) * 260,
          vy: -300 - Math.random() * 300,
          g: 500,
          l: 1.6,
          m: 1.6,
          c: '',
          s: 1,
          r: Math.random() * 2 - 1,
          vr: (Math.random() - 0.5) * 6,
          sh: 2,
        });
      }
    }

    function pick(i: number) {
      pend = i;
      gameRef.current.st = 'wait';
      wt = 0;
      syncReactUI();
    }

    function clearLane(i: number) {
      const tx = LX[i];
      const ty = -(gameRef.current.step + 1) * G;
      return !cars.some((c) => Math.abs(c.x - tx) < 0.11 && c.wy > ty - 0.5 && c.wy < cwy + 0.14);
    }

    function startHop() {
      const g = gameRef.current;
      const i = pend;
      const k = g.step + 1;
      const gold = k === MAXS + 1;
      const ty = -k * G;
      const crash = !gold && Math.random() < DF[g.diff].c + DF[g.diff].i * g.step;
      const dur = 0.5;

      hop = { x0: cwx, y0: cwy, x1: LX[i], y1: ty, t: 0, dur, i, crash, k };
      g.st = 'hop';
      sfx('hop');
      burst(cwx * W, sy(cwy) + 0.03 * W, 8, ['#d9d9de', '#b9b9c0'], 90, { g: -20, l: 0.5, s: 4 });

      if (crash) {
        const dist = 0.6;
        cars.push({ x: LX[i], wy: ty - dist, v: dist / (dur * 0.88), col: rnd(CARS), len: 1, hit: true });
      }
      syncReactUI();
    }

    function hitNow() {
      const g = gameRef.current;
      if (g.st === 'hit') return;
      g.st = 'hit';
      ht = 0;
      sfx('crash');
      shake = 1;
      burst(cwx * W, sy(cwy), 26, ['#fff', '#e5e7eb', '#f87171'], 320, { up: 200, l: 1, s: 5 });
      hv = { vx: (Math.random() - 0.5) * 0.6, vy: -0.9, r: 0 };
      tint = 1;
      float(cwx, cwy - 0.05, '-' + Math.round(g.bet).toLocaleString('en-IN'), '#ff6b6b');
      syncReactUI();
      if (onRefreshUser) onRefreshUser();
    }

    // Expose control functions to gameRef
    gameRef.current.pick = pick;
    gameRef.current.startHop = startHop;
    gameRef.current.hitNow = hitNow;
    gameRef.current.setup = setup;

    function update(dt: number) {
      const g = gameRef.current;
      tm += dt;

      if (g.st === 'wait') {
        wt += dt;
        if (clearLane(pend) || wt > 1.6) {
          if (wt > 1.6) cars = cars.filter((c) => Math.abs(c.x - LX[pend]) > 0.11);
          startHop();
        }
      }

      if (g.st === 'hop' && hop) {
        hop.t += dt / hop.dur;
        const p = Math.min(1, hop.t);
        const e = ease(p);
        cwx = lerp(hop.x0, hop.x1, e);
        cwy = lerp(hop.y0, hop.y1, p);
        walk += dt * 14;

        if (p >= 1) {
          if (hop.crash) {
            hitNow();
          } else {
            lane = hop.i;
            g.step = hop.k;
            const currentStepVal = rows[g.step][g.step === MAXS + 1 ? 0 : hop.i];
            g.mult *= currentStepVal;
            float(cwx, cwy - 0.07, currentStepVal + 'x', currentStepVal >= 1 ? '#7bf2a1' : '#ff9a9a');
            sfx(currentStepVal >= 1 ? 'good' : 'bad');
            if (g.mult > g.best) g.best = g.mult;

            burst(
              cwx * W,
              sy(cwy) - 0.05 * H,
              14,
              currentStepVal >= 1 ? ['#4ade80', '#bbf7d0', '#fff'] : ['#f87171', '#fecaca', '#fff'],
              220,
              { up: 150, l: 0.7, s: 5 }
            );

            if (g.step === MAXS + 1) {
              g.st = 'win';
              wint = 0;
              payout = g.bet * g.mult;
              g.bal += payout;
              sfx('win');
              bills(cwx * W, sy(cwy));
              shake = 0.4;

              // Send win API
              fetch('/api/chickenroad/step', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ laneIndex: hop.i }),
              })
                .then((r) => r.json())
                .catch(() => {});
            } else {
              g.st = 'play';
            }

            hop = null;
            syncReactUI();
          }
        }
      }

      if (g.st === 'hit') {
        ht += dt;
        cwx += hv.vx * dt;
        cwy += hv.vy * dt * 0.6;
        hv.r += dt * 9;
        if (ht > 1.5) {
          setup();
        }
      }

      if (g.st === 'win') {
        wint += dt;
        if (Math.random() < 0.6) {
          burst(Math.random() * W, -10, 3, ['#ffd24d', '#ff5d8f', '#4ade80', '#60a5fa', '#fff'], 120, {
            g: 260,
            l: 2.2,
            s: 5,
            sh: 1,
          });
        }
        if (wint > 3.2) {
          setup();
        }
      }

      camY += (cwy - camY) * Math.min(1, dt * 5.5);
      spawnT -= dt;

      if (spawnT < 0 && g.st !== 'hit') {
        spawnT = 0.8 + Math.random() * 1.1;
        const busy = g.st === 'hop' || g.st === 'wait' ? pend : lane;
        const L = rnd([0, 1, 2].filter((l) => l !== lane && l !== busy));
        cars.push({
          x: LX[L],
          wy: camY - BY - 0.3,
          v: 0.38 + Math.random() * 0.3,
          col: rnd(CARS),
          len: Math.random() < 0.2 ? 1.5 : 1,
        });
      }

      cars.forEach((c) => {
        c.wy += c.v * dt;
        if (
          (g.st === 'hop' || g.st === 'wait' || g.st === 'play') &&
          Math.abs(c.x - cwx) < 0.075 &&
          c.wy > cwy - 0.1 &&
          c.wy < cwy + 0.06
        ) {
          hitNow();
        }
      });

      cars = cars.filter((c) => c.wy < camY + 1 - BY + 0.4);
      fx.forEach((f) => (f.l -= dt));
      fx = fx.filter((f) => f.l > 0);
      tint = Math.max(0, tint - dt * 0.7);
      ps.forEach((p) => {
        p.vy += p.g * dt;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.r += p.vr * dt;
        p.l -= dt;
      });
      ps = ps.filter((p) => p.l > 0);
      shake = Math.max(0, shake - dt * 2.2);
    }

    function scene() {
      cx!.fillStyle = '#5fa84a';
      cx!.fillRect(0, 0, W, H);
      cx!.fillStyle = '#bdbdc2';
      cx!.fillRect(0.13 * W, 0, 0.74 * W, H);
      cx!.fillStyle = '#e4e4e8';
      cx!.fillRect(0.188 * W, 0, 0.012 * W, H);
      cx!.fillRect(0.8 * W, 0, 0.012 * W, H);
      cx!.fillStyle = '#46474e';
      cx!.fillRect(0.2 * W, 0, 0.6 * W, H);

      const rg = cx!.createLinearGradient(0.2 * W, 0, 0.8 * W, 0);
      rg.addColorStop(0, '#00000038');
      rg.addColorStop(0.12, '#00000000');
      rg.addColorStop(0.88, '#00000000');
      rg.addColorStop(1, '#00000038');
      cx!.fillStyle = rg;
      cx!.fillRect(0.2 * W, 0, 0.6 * W, H);

      const n0 = Math.floor((camY - BY - 0.25) / T);
      const n1 = Math.ceil((camY + 1 - BY + 0.25) / T);
      for (let n = n0; n <= n1; n++) {
        const y = sy(n * T);
        const h = hash(n);
        for (let sd = 0; sd < 2; sd++) {
          const bw = 0.07 * W;
          const bx = sd ? W - bw : 0;
          const cxm = sd ? 0.9 * W : 0.1 * W;
          if (((n % 4) + 4) % 4 === 0) {
            cx!.fillStyle = h > 0.5 ? '#8d8f98' : '#a3a5ad';
            cx!.fillRect(bx, y - T * H * 0.2, bw, T * H * 3.6);
            cx!.fillStyle = '#c9dff0';
            for (let a = 0; a < 6; a++) {
              for (let b = 0; b < 2; b++) {
                cx!.fillRect(bx + (b ? 0.04 : 0.01) * W, y + a * T * H * 0.58, 0.02 * W, T * H * 0.25);
              }
            }
          }
          if (n % 2 === 0) {
            cx!.fillStyle = '#4f9a3c';
            rr(cxm - 0.04 * W + (sd ? 0 : 0.02 * W), y + T * H * 0.2, 0.075 * W, 0.075 * W, 6);
            cx!.fillStyle = '#86d062';
            rr(cxm - 0.04 * W + (sd ? 0 : 0.02 * W), y + T * H * 0.2, 0.075 * W, 0.05 * W, 6);
          } else if (h > 0.25) {
            const tx = sd ? 0.87 * W : 0.13 * W;
            const ty = y + T * H * 0.4;
            const r = 0.055 * W;
            cx!.fillStyle = '#0003';
            cx!.beginPath();
            cx!.arc(tx + 4, ty + 6, r, 0, 7);
            cx!.fill();
            cx!.fillStyle = '#3f8a35';
            cx!.beginPath();
            cx!.arc(tx, ty, r, 0, 7);
            cx!.fill();
            cx!.fillStyle = '#62b04a';
            cx!.beginPath();
            cx!.arc(tx - r * 0.2, ty - r * 0.25, r * 0.7, 0, 7);
            cx!.fill();
          }
          if (((n % 3) + 3) % 3 === 1) {
            const px = sd ? 0.81 * W : 0.19 * W;
            const ty = y + T * H * 0.6;
            cx!.fillStyle = '#6a6c75';
            cx!.fillRect(px + (sd ? 0 : -0.005 * W), ty, 0.03 * W * (sd ? 1 : -1) + 0.005 * W, 3);
            cx!.beginPath();
            cx!.arc(px, ty + 1, 5, 0, 7);
            cx!.fill();
          }
        }
      }

      const P = 0.1;
      const m0 = Math.floor((camY - BY - 0.1) / P);
      const m1 = Math.ceil((camY + 1 - BY + 0.1) / P);
      cx!.fillStyle = '#e6e6e6';
      for (let n = m0; n <= m1; n++) {
        const y = sy(n * P);
        cx!.fillRect(0.4 * W - 1.5, y, 3, 0.05 * H);
        cx!.fillRect(0.6 * W - 1.5, y, 3, 0.05 * H);
      }
    }

    function egg(x: number, y: number, v: number, a: number, gold: boolean, sc: number, hl: boolean) {
      const w = (gold ? 0.15 : 0.105) * W * sc;
      const h = (gold ? 0.2 : 0.15) * W * sc;
      cx!.save();
      cx!.globalAlpha = a;
      cx!.fillStyle = '#0004';
      cx!.beginPath();
      cx!.ellipse(x + w * 0.15, y + h * 0.42, w * 0.5, h * 0.14, 0, 0, 7);
      cx!.fill();

      if (hl) {
        cx!.strokeStyle = 'rgba(255,255,255,' + (0.35 + 0.35 * Math.sin(tm * 6)) + ')';
        cx!.lineWidth = 3;
        cx!.beginPath();
        cx!.ellipse(x, y, w * 0.64, h * 0.62, 0, 0, 7);
        cx!.stroke();
      }

      const g = cx!.createRadialGradient(x - w * 0.2, y - h * 0.2, w * 0.1, x, y, h * 0.6);
      const good = v >= 1;
      if (gold) {
        g.addColorStop(0, '#fff0a0');
        g.addColorStop(1, '#d39200');
        cx!.shadowColor = '#ffd24d';
        cx!.shadowBlur = 24;
      } else {
        g.addColorStop(0, good ? '#8cf5ae' : '#ff9d9d');
        g.addColorStop(1, good ? '#12873f' : '#b81818');
      }

      cx!.fillStyle = g;
      cx!.beginPath();
      cx!.ellipse(x, y, w / 2, h / 2, 0, 0, 7);
      cx!.fill();
      cx!.shadowBlur = 0;

      cx!.strokeStyle = '#ffffff55';
      cx!.lineWidth = 2;
      cx!.stroke();

      cx!.fillStyle = '#ffffff66';
      cx!.beginPath();
      cx!.ellipse(x - w * 0.18, y - h * 0.25, w * 0.1, h * 0.12, -0.4, 0, 7);
      cx!.fill();

      cx!.font = '800 ' + Math.round(w * (gold ? 0.34 : 0.3)) + 'px system-ui';
      cx!.textAlign = 'center';
      cx!.textBaseline = 'middle';
      cx!.lineWidth = 4;
      cx!.strokeStyle = '#000a';
      const lb = gold ? v + 'X' : v + 'x';
      cx!.strokeText(lb, x, y + h * 0.05);
      cx!.fillStyle = '#fff';
      cx!.fillText(lb, x, y + h * 0.05);
      cx!.restore();
    }

    function eggs() {
      const g = gameRef.current;
      for (let k = MAXS + 1; k > g.step; k--) {
        const y = sy(-k * G);
        if (y < -0.2 * H || y > 1.1 * H) continue;
        if (k === MAXS + 1) {
          const fy = y - 0.1 * H;
          cx!.fillStyle = '#e6e6e6';
          for (let i = 0; i < 14; i++) {
            cx!.fillStyle = i % 2 ? '#fff' : '#222';
            cx!.fillRect(0.2 * W + (i * 0.6 * W) / 14, fy, (0.6 * W) / 14, 8);
          }
          cx!.fillStyle = '#b91c1c';
          cx!.fillRect(0.2 * W, fy - 26, 0.6 * W, 22);
          cx!.fillStyle = '#fff';
          cx!.font = '800 14px system-ui';
          cx!.textAlign = 'center';
          cx!.textBaseline = 'middle';
          cx!.fillText('FINISH', 0.5 * W, fy - 15);
          const pk = hop && hop.k === k ? 1 - Math.min(1, hop.t) : 1;
          egg(0.5 * W, y, rows[k][0], pk, true, 1 + Math.sin(tm * 4) * 0.04, g.st === 'play' && k === g.step + 1);
          continue;
        }

        if (rows[k]) {
          rows[k].forEach((v: number, i: number) => {
            const pk = hop && hop.k === k && hop.i === i ? 1 - Math.min(1, hop.t) : 1;
            egg(LX[i] * W, y, v, (g.st === 'idle' ? 0.8 : 1) * pk, false, 1, g.st === 'play' && k === g.step + 1);
          });
        }
      }
    }

    function drawCar(c: any) {
      const x = c.x * W;
      const y = sy(c.wy);
      const w = 0.115 * W;
      const h = 0.21 * W * c.len;
      cx!.save();
      cx!.translate(x, y);
      cx!.fillStyle = 'rgba(255,248,192,.16)';
      cx!.beginPath();
      cx!.moveTo(-w * 0.35, h / 2);
      cx!.lineTo(-w * 0.65, h / 2 + h * 0.75);
      cx!.lineTo(w * 0.65, h / 2 + h * 0.75);
      cx!.lineTo(w * 0.35, h / 2);
      cx!.fill();

      cx!.fillStyle = '#0005';
      rr(-w / 2 + 4, -h / 2 + 6, w, h, 10);
      cx!.fillStyle = '#111';
      rr(-w / 2 - 3, -h * 0.32, 5, h * 0.2, 2);
      rr(w / 2 - 2, -h * 0.32, 5, h * 0.2, 2);
      rr(-w / 2 - 3, h * 0.16, 5, h * 0.2, 2);
      rr(w / 2 - 2, h * 0.16, 5, h * 0.2, 2);
      cx!.fillStyle = c.col;
      rr(-w / 2, -h / 2, w, h, 12);
      cx!.fillStyle = '#ffffff30';
      rr(-w / 2 + 3, -h / 2 + 3, w - 6, h * 0.12, 6);
      cx!.fillStyle = '#1d2733';
      rr(-w * 0.4, h * 0.08, w * 0.8, h * 0.16, 5);
      rr(-w * 0.36, -h * 0.36, w * 0.72, h * 0.1, 4);
      cx!.fillStyle = '#00000028';
      rr(-w * 0.38, -h * 0.2, w * 0.76, h * 0.28, 6);
      cx!.fillStyle = '#fff8c0';
      cx!.fillRect(-w * 0.4, h / 2 - 5, w * 0.2, 4);
      cx!.fillRect(w * 0.2, h / 2 - 5, w * 0.2, 4);
      cx!.restore();
    }

    function chicken() {
      const g = gameRef.current;
      const s = 0.25 * W;
      const x = cwx * W;
      const by = sy(cwy);
      let j = 0;
      let rot = 0;

      if (g.st === 'hop') j = Math.sin(Math.min(1, hop.t) * Math.PI) * 0.04 * H;
      else if (g.st === 'play' || g.st === 'idle' || g.st === 'wait') j = Math.abs(Math.sin(tm * 3)) * 0.005 * H;

      if (g.st === 'hit') {
        rot = hv ? hv.r : 0;
        j = Math.max(0, Math.sin(ht * 3) * 0.06 * H);
      }

      const mv = g.st === 'hop';
      const ph = mv ? Math.sin(walk) : Math.sin(tm * 3) * 0.12;
      const sw = mv ? Math.sin(walk * 0.5) * 0.07 : Math.sin(tm * 1.5) * 0.02;
      const wf = mv ? Math.sin(walk * 1.2) * 0.07 : Math.sin(tm * 3) * 0.012;

      cx!.save();
      cx!.fillStyle = 'rgba(0,0,0,.38)';
      cx!.beginPath();
      cx!.ellipse(x, by + s * 0.36, s * 0.36 * (1 - (j / H) * 3), s * 0.1, 0, 0, 7);
      cx!.fill();
      cx!.translate(x, by - j);
      cx!.rotate(rot + sw);

      const foot = (sx: number, fy: number) => {
        cx!.strokeStyle = '#f28a1a';
        cx!.lineWidth = s * 0.035;
        cx!.lineCap = 'round';
        cx!.beginPath();
        cx!.moveTo(sx, s * 0.18);
        cx!.lineTo(sx, fy);
        cx!.stroke();
        cx!.fillStyle = '#f6961f';
        cx!.beginPath();
        cx!.moveTo(sx - s * 0.09, fy + s * 0.045);
        cx!.quadraticCurveTo(sx, fy - s * 0.05, sx + s * 0.09, fy + s * 0.045);
        cx!.quadraticCurveTo(sx, fy + s * 0.07, sx - s * 0.09, fy + s * 0.045);
        cx!.fill();
        cx!.strokeStyle = '#d96f0a';
        cx!.lineWidth = 1.5;
        cx!.beginPath();
        cx!.moveTo(sx - s * 0.03, fy + s * 0.045);
        cx!.lineTo(sx - s * 0.03, fy);
        cx!.moveTo(sx + s * 0.03, fy + s * 0.045);
        cx!.lineTo(sx + s * 0.03, fy);
        cx!.stroke();
      };

      foot(-s * 0.1, s * 0.33 + ph * s * 0.05);
      foot(s * 0.1, s * 0.33 - ph * s * 0.05);

      const tg = cx!.createLinearGradient(0, s * 0.1, 0, s * 0.3);
      tg.addColorStop(0, '#e6e9ef');
      tg.addColorStop(1, '#c3c8d2');
      cx!.fillStyle = tg;
      cx!.beginPath();
      cx!.ellipse(-s * 0.1, s * 0.24, s * 0.09, s * 0.08, 0.4, 0, 7);
      cx!.ellipse(0, s * 0.27, s * 0.1, s * 0.08, 0, 0, 7);
      cx!.ellipse(s * 0.1, s * 0.24, s * 0.09, s * 0.08, -0.4, 0, 7);
      cx!.fill();

      const bg = cx!.createRadialGradient(-s * 0.09, -s * 0.12, s * 0.03, 0, s * 0.02, s * 0.36);
      bg.addColorStop(0, '#ffffff');
      bg.addColorStop(0.55, '#eef0f5');
      bg.addColorStop(1, '#c8cdd8');
      cx!.fillStyle = bg;
      cx!.beginPath();
      cx!.moveTo(-s * 0.12, -s * 0.27);
      cx!.bezierCurveTo(-s * 0.36, -s * 0.12, -s * 0.34, s * 0.24, -s * 0.1, s * 0.28);
      cx!.lineTo(s * 0.1, s * 0.28);
      cx!.bezierCurveTo(s * 0.34, s * 0.24, s * 0.36, -s * 0.12, s * 0.12, -s * 0.27);
      cx!.closePath();
      cx!.fill();

      cx!.fillStyle = 'rgba(255,240,205,.16)';
      cx!.beginPath();
      cx!.ellipse(0, s * 0.12, s * 0.2, s * 0.15, 0, 0, 7);
      cx!.fill();

      const wing = (sd: number) => {
        const g = cx!.createLinearGradient(sd * s * 0.2, 0, sd * s * 0.46, 0);
        g.addColorStop(0, '#f4f6fa');
        g.addColorStop(1, '#d3d8e2');
        cx!.fillStyle = g;
        cx!.strokeStyle = 'rgba(120,128,145,.35)';
        cx!.lineWidth = 1.2;
        cx!.beginPath();
        cx!.moveTo(sd * s * 0.2, -s * 0.2);
        cx!.quadraticCurveTo(sd * s * 0.42, -s * 0.1, sd * s * 0.5, s * (0.1 + wf));
        cx!.quadraticCurveTo(sd * s * 0.44, s * (0.12 + wf), sd * s * 0.4, s * (0.1 + wf));
        cx!.quadraticCurveTo(sd * s * 0.34, s * (0.14 + wf), sd * s * 0.3, s * (0.1 + wf * 0.8));
        cx!.quadraticCurveTo(sd * s * 0.26, s * 0.12, sd * s * 0.2, s * 0.06);
        cx!.closePath();
        cx!.fill();
        cx!.stroke();
      };
      wing(-1);
      wing(1);

      const hg = cx!.createRadialGradient(-s * 0.04, -s * 0.36, s * 0.02, 0, -s * 0.32, s * 0.17);
      hg.addColorStop(0, '#fff');
      hg.addColorStop(1, '#d4d9e3');
      cx!.fillStyle = hg;
      cx!.beginPath();
      cx!.ellipse(0, -s * 0.31, s * 0.15, s * 0.14, 0, 0, 7);
      cx!.fill();

      cx!.fillStyle = '#e11d2a';
      cx!.beginPath();
      cx!.ellipse(-s * 0.04, -s * 0.43, s * 0.05, s * 0.05, 0, 0, 7);
      cx!.ellipse(s * 0.01, -s * 0.46, s * 0.06, s * 0.06, 0, 0, 7);
      cx!.ellipse(s * 0.06, -s * 0.43, s * 0.05, s * 0.05, 0, 0, 7);
      cx!.fill();

      cx!.fillStyle = 'rgba(255,255,255,.55)';
      cx!.beginPath();
      cx!.ellipse(0, -s * 0.47, s * 0.025, s * 0.015, 0, 0, 7);
      cx!.fill();

      cx!.fillStyle = '#f6c61a';
      cx!.beginPath();
      cx!.ellipse(s * 0.09, -s * 0.44, s * 0.05, s * 0.03, -0.4, 0, 7);
      cx!.fill();

      cx!.fillStyle = 'rgba(255,255,255,.45)';
      cx!.beginPath();
      cx!.ellipse(-s * 0.12, -s * 0.1, s * 0.07, s * 0.1, 0.3, 0, 7);
      cx!.fill();

      cx!.restore();
    }

    function over() {
      const g = gameRef.current;
      const vg = cx!.createRadialGradient(W / 2, H * 0.55, W * 0.35, W / 2, H * 0.55, H * 0.75);
      vg.addColorStop(0, 'rgba(0,0,0,0)');
      vg.addColorStop(1, 'rgba(0,0,0,.35)');
      cx!.fillStyle = vg;
      cx!.fillRect(0, 0, W, H);

      ps.forEach((p) => {
        const a = Math.max(0, Math.min(1, (p.l / p.m) * 1.5));
        cx!.save();
        cx!.globalAlpha = a;
        cx!.translate(p.x, p.y);
        cx!.rotate(p.r);
        if (p.sh === 2) {
          const w = 0.15 * W;
          const h = 0.075 * W;
          cx!.fillStyle = '#7a3fc4';
          rr(-w / 2, -h / 2, w, h, 4);
          cx!.strokeStyle = '#e9d5ff';
          cx!.lineWidth = 2;
          cx!.strokeRect(-w / 2 + 3, -h / 2 + 3, w - 6, h - 6);
          cx!.fillStyle = '#fff';
          cx!.font = '800 ' + Math.round(h * 0.5) + 'px system-ui';
          cx!.textAlign = 'center';
          cx!.textBaseline = 'middle';
          cx!.fillText('500', 0, 0);
        } else {
          cx!.fillStyle = p.c;
          if (p.sh === 1) cx!.fillRect(-p.s, -p.s * 0.5, p.s * 2, p.s);
          else {
            cx!.beginPath();
            cx!.arc(0, 0, p.s, 0, 7);
            cx!.fill();
          }
        }
        cx!.restore();
      });

      if (tint > 0) {
        cx!.fillStyle = 'rgba(200,20,20,' + tint * 0.4 + ')';
        cx!.fillRect(0, 0, W, H);
      }

      fx.forEach((f) => {
        cx!.globalAlpha = Math.min(1, f.l);
        cx!.font = '800 ' + Math.round(0.075 * W) + 'px system-ui';
        cx!.textAlign = 'center';
        cx!.lineWidth = 5;
        cx!.strokeStyle = '#000b';
        const y = sy(f.y) - (1.4 - f.l) * 50;
        cx!.strokeText(f.t, f.x * W, y);
        cx!.fillStyle = f.c;
        cx!.fillText(f.t, f.x * W, y);
        cx!.globalAlpha = 1;
      });

      if (g.st === 'win') {
        const a = Math.min(1, wint * 3) * Math.min(1, (3.2 - wint) * 3);
        cx!.save();
        cx!.globalAlpha = a;
        cx!.fillStyle = '#000c';
        cx!.fillRect(0, 0, W, H);
        cx!.translate(W / 2, H * 0.42);
        cx!.fillStyle = '#f5b80055';
        for (let i = 0; i < 16; i++) {
          cx!.rotate(Math.PI / 8);
          cx!.beginPath();
          cx!.moveTo(0, 0);
          cx!.lineTo(W * 0.9, -W * 0.06);
          cx!.lineTo(W * 0.9, W * 0.06);
          cx!.fill();
        }
        cx!.rotate(0);
        cx!.rotate(-0.07);
        cx!.font = '900 ' + Math.round(W * 0.26) + 'px system-ui';
        cx!.textAlign = 'center';
        cx!.textBaseline = 'middle';
        cx!.lineWidth = 10;
        cx!.strokeStyle = '#5a3a00';
        cx!.shadowColor = '#ffb800';
        cx!.shadowBlur = 30;

        const gGrad = cx!.createLinearGradient(0, -W * 0.25, 0, W * 0.25);
        gGrad.addColorStop(0, '#fff3a8');
        gGrad.addColorStop(1, '#e59a00');
        cx!.fillStyle = gGrad;
        cx!.strokeText('BIG', 0, -W * 0.13);
        cx!.fillText('BIG', 0, -W * 0.13);
        cx!.strokeText('WIN', 0, W * 0.13);
        cx!.fillText('WIN', 0, W * 0.13);
        cx!.shadowBlur = 0;

        cx!.font = '800 ' + Math.round(W * 0.1) + 'px system-ui';
        cx!.fillStyle = '#fff';
        cx!.fillText('+ ' + Math.round(payout).toLocaleString('en-IN'), 0, W * 0.34);
        cx!.restore();
      }
    }

    let last = performance.now();
    function loop(now: number) {
      if (!isMounted) return;
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      update(dt);
      cx!.save();
      if (shake > 0) {
        cx!.translate((Math.random() - 0.5) * shake * 16, (Math.random() - 0.5) * shake * 16);
      }
      scene();
      eggs();
      [...cars].sort((a, b) => a.wy - b.wy).forEach(drawCar);
      chicken();
      cx!.restore();
      over();
      animId = requestAnimationFrame(loop);
    }

    // Pointer event on canvas to pick egg
    const handlePointerDown = (e: PointerEvent) => {
      const g = gameRef.current;
      if (g.st !== 'play') return;
      const r = cv.getBoundingClientRect();
      const x = (e.clientX - r.left) / W;
      const y = (e.clientY - r.top) / H;
      const rowY = BY + -(g.step + 1) * G - camY;

      if (Math.abs(y - rowY) > 0.14) return;
      let b = -1;
      let bd = 9;
      LX.forEach((lx, i) => {
        const d = Math.abs(x - lx);
        if (d < bd) {
          bd = d;
          b = i;
        }
      });
      if (g.step === MAXS) b = 1;
      if (bd < 0.13 || g.step === MAXS) {
        pick(b);
      }
    };

    cv.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('resize', fit);

    fit();
    setup();
    animId = requestAnimationFrame(loop);

    return () => {
      isMounted = false;
      cancelAnimationFrame(animId);
      cv.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('resize', fit);
    };
  }, []);

  // UI action handlers
  const handleGo = async () => {
    const g = gameRef.current;
    if (g.st !== 'idle') return;

    if (totalBalance < bet) {
      if (showToast) showToast(`अपर्याप्त Main Wallet बैलेंस! उपलब्ध: ₹${totalBalance.toFixed(2)} INR`, 'error');
      return;
    }

    try {
      const res = await fetch('/api/chickenroad/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          betAmount: bet,
          difficulty: diff === 0 ? 'easy' : diff === 1 ? 'medium' : 'hard',
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (showToast) showToast(data.error || 'Insufficient Main Wallet balance!', 'error');
        return;
      }

      g.bal = Math.max(0, totalBalance - bet);
      g.st = 'play';
      setGameStatus('play');
      if (onRefreshUser) onRefreshUser();
    } catch {
      if (showToast) showToast('Network error starting round', 'error');
    }
  };

  const handleCashout = async () => {
    const g = gameRef.current;
    if (g.st !== 'play' || g.step < 1) return;

    const w = g.bet * g.mult;

    try {
      const res = await fetch('/api/chickenroad/cashout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ step: g.step, multiplier: g.mult }),
      });
      const data = await res.json();
      if (res.ok) {
        g.bal += data.payout || w;
        if (showToast) {
          showToast(`🎉 Cashed out ₹${Math.round(data.payout || w).toLocaleString('en-IN')} (${g.mult.toFixed(2)}x)!`, 'success');
        }
      }
    } catch {
      // Ignore error and reset round UI safely
    }

    g.setup();
    if (onRefreshUser) onRefreshUser();
  };

  const isPlaying = gameStatus !== 'idle';

  return (
    <div
      ref={containerRef}
      className="relative w-full max-w-[430px] h-full min-h-[100dvh] mx-auto bg-[#14161a] text-white flex flex-col justify-between select-none overflow-hidden font-sans"
    >
      {/* STAGE & CANVAS */}
      <div className="relative flex-1 min-h-0 overflow-hidden touch-manipulation">
        <canvas ref={cvRef} className="absolute left-0 top-0 w-full h-full block" />

        {/* HUD Indicator */}
        <div className="absolute left-2 top-2 bg-black/70 backdrop-blur-sm px-2.5 py-1 rounded-xl text-xs font-bold border border-white/10 z-10 pointer-events-none">
          Step <span className="text-yellow-400">{step}</span>/8 ·{' '}
          <span className="text-emerald-400">{mult.toFixed(2)}x</span> · 🏆
          <span className="text-yellow-300">{best.toFixed(1)}x</span>
        </div>
      </div>

      {/* BOTTOM CONTROLS */}
      <div className="bg-[#1b1d22] p-2.5 pb-3 border-t border-white/10 z-20">
        {/* Difficulty Tabs */}
        <div className="flex gap-1.5 justify-center mb-2">
          {['EASY', 'MEDIUM', 'HARD'].map((label, idx) => (
            <button
              key={label}
              disabled={isPlaying}
              onClick={() => {
                setDiff(idx);
                gameRef.current.diff = idx;
                gameRef.current.setup();
              }}
              className={`flex-1 border-0 rounded-lg font-extrabold text-xs py-2 tracking-wider transition ${
                diff === idx ? 'bg-[#16a34a] text-white shadow' : 'bg-[#2a2d35] text-[#9aa0aa] hover:text-white'
              } disabled:opacity-60`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Bet Controller */}
        <div className="flex items-center justify-center gap-1.5 mb-2">
          <button
            disabled={isPlaying}
            onClick={() => {
              const newBet = 10;
              setBet(newBet);
              gameRef.current.bet = newBet;
            }}
            className="border-0 rounded-lg bg-[#34373f] text-[#9aa0aa] hover:text-white font-extrabold text-xs px-2.5 py-2 disabled:opacity-50 active:scale-95 transition"
          >
            MIN
          </button>

          <button
            disabled={isPlaying || bet <= 10}
            onClick={() => {
              let dec = 100;
              if (bet <= 100) dec = 10;
              else if (bet <= 500) dec = 50;
              else if (bet <= 1000) dec = 100;
              else dec = 500;
              const newBet = Math.max(10, bet - dec);
              setBet(newBet);
              gameRef.current.bet = newBet;
            }}
            className="w-10 h-10 border-0 rounded-lg bg-[#34373f] text-white hover:bg-[#454954] font-black text-xl flex items-center justify-center disabled:opacity-40 active:scale-95 transition shadow"
          >
            −
          </button>

          <div className="min-w-[100px] px-2 py-1 bg-[#0c0d10] border border-white/10 rounded-lg text-center">
            <span className="text-[10px] text-slate-400 block font-semibold leading-tight">BET AMOUNT</span>
            <span className="text-xl font-extrabold text-white tracking-wide">
              ₹{bet.toLocaleString('en-IN')}
            </span>
          </div>

          <button
            disabled={isPlaying || bet >= 10000}
            onClick={() => {
              let inc = 100;
              if (bet < 100) inc = 10;
              else if (bet < 500) inc = 50;
              else if (bet < 1000) inc = 100;
              else inc = 500;
              const newBet = Math.min(10000, bet + inc);
              setBet(newBet);
              gameRef.current.bet = newBet;
            }}
            className="w-10 h-10 border-0 rounded-lg bg-[#34373f] text-white hover:bg-[#454954] font-black text-xl flex items-center justify-center disabled:opacity-40 active:scale-95 transition shadow"
          >
            +
          </button>

          <button
            disabled={isPlaying}
            onClick={() => {
              const maxAllowed = Math.min(10000, Math.max(10, Math.floor(gameRef.current.bal || 5000)));
              setBet(maxAllowed);
              gameRef.current.bet = maxAllowed;
            }}
            className="border-0 rounded-lg bg-[#34373f] text-yellow-400 hover:text-yellow-300 font-extrabold text-xs px-2.5 py-2 disabled:opacity-50 active:scale-95 transition"
          >
            MAX
          </button>
        </div>

        {/* Quick Bet Chip Presets */}
        {!isPlaying && (
          <div className="flex items-center justify-center gap-1.5 mb-2.5">
            {[10, 50, 100, 500, 1000, 2000].map((amt) => (
              <button
                key={amt}
                onClick={() => {
                  setBet(amt);
                  gameRef.current.bet = amt;
                }}
                className={`flex-1 py-1 rounded-md text-[11px] font-black transition border ${
                  bet === amt
                    ? 'bg-yellow-500 text-black border-yellow-400 shadow'
                    : 'bg-[#2a2d35] text-[#9aa0aa] hover:text-white border-transparent'
                }`}
              >
                ₹{amt}
              </button>
            ))}
          </div>
        )}

        {/* Action Buttons: Cash Out & Go */}
        <div className="flex gap-2.5">
          <button
            disabled={!(gameStatus === 'play' && step > 0)}
            onClick={handleCashout}
            className="flex-1 h-14 border-0 rounded-2xl text-lg font-black tracking-wider text-[#2b2000] bg-gradient-to-b from-[#ffd24d] to-[#e0a100] shadow-[0_4px_0_#8a6200] active:translate-y-0.5 active:shadow-[0_2px_0_#8a6200] disabled:opacity-45 transition"
          >
            {step > 0 && gameStatus === 'play'
              ? `CASH OUT ₹${Math.round(bet * mult).toLocaleString('en-IN')}`
              : 'CASH OUT'}
          </button>

          <button
            disabled={isPlaying}
            onClick={handleGo}
            className="flex-1 h-14 border-0 rounded-2xl text-lg font-black tracking-wider text-white bg-gradient-to-b from-[#4ade80] to-[#16a34a] shadow-[0_4px_0_#0d6b30] active:translate-y-0.5 active:shadow-[0_2px_0_#0d6b30] disabled:opacity-45 transition"
          >
            {isPlaying ? 'EGG CHUNO' : 'GO ➜'}
          </button>
        </div>

        <div className="text-center text-[10px] text-[#9aa0aa] pt-2">
          Click on any egg ahead to cross the road · Avoid oncoming cars!
        </div>
      </div>
    </div>
  );
};
