import React, { useState, useEffect } from 'react';
import { Trophy, Sparkles, TrendingUp } from 'lucide-react';

interface WinnerFeed {
  id: string;
  userNode: string;
  game: string;
  multiplier?: string;
  amount: number;
  time: string;
}

const CASINO_GAMES: { name: string; icon: string; multipliers: string[] }[] = [
  { name: 'Aviator Crash', icon: '🚀', multipliers: ['3.40x', '7.85x', '18.20x', '45.00x', '92.40x'] },
  { name: 'Win Go 1M', icon: '🎲', multipliers: ['9.00x', '2.00x', '4.50x', '9.00x'] },
  { name: 'Dragon vs Tiger', icon: '🐅', multipliers: ['2.00x', '8.00x', '2.00x'] },
  { name: 'Lucky Draw Jackpot', icon: '🎟️', multipliers: ['Jackpot', 'Series Match'] },
  { name: 'Daily Spin Wheel', icon: '🎡', multipliers: ['Top Prize', 'Bonus Win'] },
];

export const LiveWinnerTicker: React.FC = () => {
  const [winners, setWinners] = useState<WinnerFeed[]>([]);

  useEffect(() => {
    // Initial realistic casino feeds
    const initialFeeds: WinnerFeed[] = [
      { id: '1', userNode: 'NX-8204', game: 'Aviator Crash 🚀', multiplier: '18.40x', amount: 368.0, time: 'Just now' },
      { id: '2', userNode: 'NX-1092', game: 'Win Go 1M 🎲', multiplier: '9.00x', amount: 450.0, time: '1s ago' },
      { id: '3', userNode: 'NX-3041', game: 'Dragon vs Tiger 🐅', multiplier: '2.00x', amount: 160.0, time: '3s ago' },
      { id: '4', userNode: 'NX-7718', game: 'Lucky Draw 🎟️', multiplier: 'Jackpot', amount: 250.0, time: '5s ago' },
      { id: '5', userNode: 'NX-0051', game: 'Aviator Crash 🚀', multiplier: '42.10x', amount: 421.0, time: '7s ago' },
      { id: '6', userNode: 'NX-4412', game: 'Dragon vs Tiger 🐅', multiplier: '8.00x Tie', amount: 320.0, time: '9s ago' },
    ];
    setWinners(initialFeeds);

    // Periodically push new winner to simulate real-time live activity
    const interval = setInterval(() => {
      const randomNode = `NX-${Math.floor(1000 + Math.random() * 9000)}`;
      const selectedGame = CASINO_GAMES[Math.floor(Math.random() * CASINO_GAMES.length)];
      const randomMultiplier = selectedGame.multipliers[Math.floor(Math.random() * selectedGame.multipliers.length)];
      const randomAmount = Math.floor(15 + Math.random() * 485);

      const newWinner: WinnerFeed = {
        id: Date.now().toString(),
        userNode: randomNode,
        game: `${selectedGame.name} ${selectedGame.icon}`,
        multiplier: randomMultiplier,
        amount: randomAmount,
        time: 'Just now',
      };

      setWinners((prev) => [newWinner, ...prev.slice(0, 8)]);
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-[#040811] border-y border-amber-500/20 py-2 px-3 overflow-hidden text-xs font-mono">
      <div className="max-w-7xl mx-auto flex items-center gap-3">
        {/* Live Indicator Badge */}
        <div className="shrink-0 px-2.5 py-1 rounded-lg bg-gradient-to-r from-amber-500/20 via-rose-500/20 to-cyan-500/20 border border-amber-500/40 text-amber-300 font-black text-[10px] uppercase flex items-center gap-1.5 shadow-[0_0_12px_rgba(245,158,11,0.25)]">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          <Trophy className="w-3.5 h-3.5 text-amber-400" />
          <span className="tracking-wider">CASINO LIVE WINS</span>
        </div>

        {/* Marquee Feed */}
        <div className="overflow-hidden relative w-full flex items-center">
          <div className="flex items-center gap-6 animate-marquee whitespace-nowrap">
            {winners.map((w) => (
              <div key={w.id} className="flex items-center gap-2 text-slate-300 text-xs">
                <span className="text-cyan-400 font-bold">#{w.userNode}</span>
                <span className="text-slate-500">won</span>
                <span className="text-emerald-400 font-extrabold bg-emerald-500/15 border border-emerald-500/40 px-2 py-0.5 rounded shadow-[0_0_8px_rgba(16,185,129,0.2)]">
                  +${w.amount.toFixed(2)} USDT
                </span>
                {w.multiplier && (
                  <span className="text-amber-400 font-bold text-[10px] bg-amber-500/15 border border-amber-500/30 px-1.5 py-0.2 rounded">
                    {w.multiplier}
                  </span>
                )}
                <span className="text-slate-300 font-semibold text-[11px]">{w.game}</span>
                <span className="text-slate-500 text-[10px]">({w.time})</span>
                <span className="text-slate-800 font-bold">●</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
