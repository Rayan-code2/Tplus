import React from 'react';

interface TetherPlusLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'icon';
  showTagline?: boolean;
  className?: string;
}

export const TetherPlusLogo: React.FC<TetherPlusLogoProps> = ({
  size = 'md',
  showTagline = true,
  className = '',
}) => {
  const sizeConfig = {
    sm: {
      emblem: 'w-7 h-7',
      sportText: 'text-sm font-extrabold',
      xText: 'text-sm font-black',
      tagline: 'text-[7px] tracking-[0.2em]',
      gap: 'gap-2',
    },
    md: {
      emblem: 'w-10 h-10',
      sportText: 'text-lg font-black',
      xText: 'text-xl font-black',
      tagline: 'text-[9px] tracking-[0.22em]',
      gap: 'gap-2.5',
    },
    lg: {
      emblem: 'w-14 h-14',
      sportText: 'text-2xl font-black',
      xText: 'text-3xl font-black',
      tagline: 'text-[11px] tracking-[0.25em]',
      gap: 'gap-3.5',
    },
    xl: {
      emblem: 'w-20 h-20',
      sportText: 'text-4xl font-black',
      xText: 'text-5xl font-black',
      tagline: 'text-xs sm:text-sm tracking-[0.28em]',
      gap: 'gap-4',
    },
    icon: {
      emblem: 'w-10 h-10',
      sportText: '',
      xText: '',
      tagline: '',
      gap: '',
    },
  };

  const currentSize = sizeConfig[size] || sizeConfig.md;

  // Render SportX Emblem SVG
  const renderEmblem = () => (
    <div className={`relative flex items-center justify-center shrink-0 ${currentSize.emblem}`}>
      <div className="absolute inset-0 rounded-full bg-cyan-500/15 blur-sm pointer-events-none" />

      <svg
        viewBox="0 0 100 100"
        className="w-full h-full drop-shadow-[0_2px_6px_rgba(0,0,0,0.4)]"
      >
        <defs>
          <linearGradient id="sportxRing1" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#67e8f9" />
            <stop offset="45%" stopColor="#06b6d4" />
            <stop offset="100%" stopColor="#0284c7" />
          </linearGradient>
          <linearGradient id="sportxAccent" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fef08a" />
            <stop offset="50%" stopColor="#f59e0b" />
            <stop offset="100%" stopColor="#d97706" />
          </linearGradient>
        </defs>

        <circle cx="50" cy="50" r="48" fill="none" />

        <circle
          cx="50"
          cy="50"
          r="44"
          fill="none"
          stroke="url(#sportxRing1)"
          strokeWidth="6"
        />

        <path
          d="M 22,65 A 38,38 0 1,1 82,35"
          fill="none"
          stroke="url(#sportxAccent)"
          strokeWidth="3.5"
          strokeLinecap="round"
          opacity="0.9"
        />

        {/* Stylized Athletic X */}
        <path
          d="M 27 28 L 41 28 L 50 42 L 59 28 L 73 28 L 57 50 L 74 72 L 60 72 L 50 57 L 40 72 L 26 72 L 43 50 Z"
          fill="#ffffff"
        />
        <path
          d="M 59 28 L 73 28 L 57 50 L 74 72 L 60 72 L 48 53 Z"
          fill="url(#sportxAccent)"
          opacity="0.95"
        />
      </svg>
    </div>
  );

  if (size === 'icon') {
    return <div className={className}>{renderEmblem()}</div>;
  }

  return (
    <div className={`flex items-center ${currentSize.gap} ${className}`}>
      {renderEmblem()}

      <div className="flex flex-col justify-center">
        <div className="flex items-baseline tracking-tight leading-none font-sans uppercase italic">
          <span className={`text-slate-100 font-extrabold ${currentSize.sportText}`}>
            SPORT
          </span>
          <span
            className={`bg-gradient-to-r from-cyan-300 via-sky-400 to-emerald-400 bg-clip-text text-transparent font-black ml-0.5 ${currentSize.xText}`}
          >
            X
          </span>
        </div>

        {showTagline && (
          <div className={`font-mono text-cyan-400/90 font-extrabold uppercase mt-1 tracking-[0.2em] flex items-center gap-1 ${currentSize.tagline}`}>
            <span className="text-cyan-400">PLAY</span>
            <span className="text-amber-400 font-black">•</span>
            <span className="text-amber-300">BET</span>
            <span className="text-amber-400 font-black">•</span>
            <span className="text-emerald-400">WIN</span>
          </div>
        )}
      </div>
    </div>
  );
};
