import React, { useState, useEffect } from 'react';
import { Trophy, Sparkles, TrendingUp } from 'lucide-react';

interface WinnerFeed {
  id: string;
  userNode: string;
  game: string;
  amount: number;
  time: string;
}

const GAMES = [
  'Dragon vs Tiger',
  'Win Go 1Min',
  'Color Prediction',
  'Lucky Draw',
  'Matrix Referral',
];

export const LiveWinnerTicker: React.FC = () => {
  const [winners, setWinners] = useState<WinnerFeed[]>([]);

  useEffect(() => {
    // Generate initial realistic feeds
    const initialFeeds: WinnerFeed[] = [
      { id: '1', userNode: 'NX-8204', game: 'Dragon vs Tiger', amount: 140.0, time: 'Just now' },
      { id: '2', userNode: 'NX-1092', game: 'Win Go 1Min', amount: 450.0, time: '1s ago' },
      { id: '3', userNode: 'NX-3041', game: 'Dragon vs Tiger', amount: 80.0, time: '3s ago' },
      { id: '4', userNode: 'NX-7718', game: 'Lucky Draw', amount: 250.0, time: '5s ago' },
      { id: '5', userNode: 'NX-0051', game: 'Color Prediction', amount: 180.0, time: '8s ago' },
    ];
    setWinners(initialFeeds);

    // Periodically push new winner to simulate real-time live activity
    const interval = setInterval(() => {
      const randomNode = `NX-${Math.floor(1000 + Math.random() * 9000)}`;
      const randomGame = GAMES[Math.floor(Math.random() * GAMES.length)];
      const randomAmount = Math.floor(20 + Math.random() * 480);

      const newWinner: WinnerFeed = {
        id: Date.now().toString(),
        userNode: randomNode,
        game: randomGame,
        amount: randomAmount,
        time: 'Just now',
      };

      setWinners((prev) => [newWinner, ...prev.slice(0, 7)]);
    }, 4500);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-[#050b14] border-y border-amber-500/20 py-2 px-3 overflow-hidden text-xs font-mono">
      <div className="max-w-7xl mx-auto flex items-center gap-3">
        {/* Badge */}
        <div className="shrink-0 px-2.5 py-1 rounded-lg bg-gradient-to-r from-amber-500/20 to-rose-500/20 border border-amber-500/40 text-amber-300 font-extrabold text-[10px] uppercase flex items-center gap-1.5 shadow-[0_0_10px_rgba(245,158,11,0.2)]">
          <Trophy className="w-3.5 h-3.5 text-amber-400 animate-bounce" />
          <span>LIVE WINNERS</span>
        </div>

        {/* Marquee Feed */}
        <div className="overflow-hidden relative w-full flex items-center">
          <div className="flex items-center gap-6 animate-marquee whitespace-nowrap">
            {winners.map((w) => (
              <div key={w.id} className="flex items-center gap-2 text-slate-300 text-xs">
                <span className="text-cyan-400 font-bold">#{w.userNode}</span>
                <span className="text-slate-500">won</span>
                <span className="text-emerald-400 font-extrabold bg-emerald-500/10 border border-emerald-500/30 px-1.5 py-0.5 rounded">
                  +${w.amount.toFixed(2)} USDT
                </span>
                <span className="text-slate-400 text-[11px]">on {w.game}</span>
                <span className="text-amber-400/80 text-[10px] font-sans">({w.time})</span>
                <span className="text-slate-700">|</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
