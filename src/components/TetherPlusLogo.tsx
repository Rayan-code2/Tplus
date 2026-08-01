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
  // Size mapping
  const sizeConfig = {
    sm: {
      emblem: 'w-7 h-7',
      tetherText: 'text-sm font-extrabold',
      plusText: 'text-sm font-extrabold',
      tagline: 'text-[7px] tracking-[0.2em]',
      gap: 'gap-2',
    },
    md: {
      emblem: 'w-10 h-10',
      tetherText: 'text-lg font-black',
      plusText: 'text-lg font-black',
      tagline: 'text-[9px] tracking-[0.22em]',
      gap: 'gap-2.5',
    },
    lg: {
      emblem: 'w-14 h-14',
      tetherText: 'text-2xl font-black',
      plusText: 'text-2xl font-black',
      tagline: 'text-[11px] tracking-[0.25em]',
      gap: 'gap-3.5',
    },
    xl: {
      emblem: 'w-20 h-20',
      tetherText: 'text-4xl font-black',
      plusText: 'text-4xl font-black',
      tagline: 'text-xs sm:text-sm tracking-[0.28em]',
      gap: 'gap-4',
    },
    icon: {
      emblem: 'w-10 h-10',
      tetherText: '',
      plusText: '',
      tagline: '',
      gap: '',
    },
  };

  const currentSize = sizeConfig[size] || sizeConfig.md;

  // Render Golden T+ Emblem SVG
  const renderEmblem = () => (
    <div className={`relative flex items-center justify-center shrink-0 ${currentSize.emblem}`}>
      {/* Soft Theme Ambient Glow */}
      <div className="absolute inset-0 rounded-full bg-cyan-500/10 blur-sm pointer-events-none" />
      
      <svg
        viewBox="0 0 100 100"
        className="w-full h-full drop-shadow-[0_2px_6px_rgba(0,0,0,0.4)]"
      >
        <defs>
          <linearGradient id="goldGradient1" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fef08a" />
            <stop offset="35%" stopColor="#f59e0b" />
            <stop offset="70%" stopColor="#d97706" />
            <stop offset="100%" stopColor="#78350f" />
          </linearGradient>
          <linearGradient id="goldGradient2" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="40%" stopColor="#fbbf24" />
            <stop offset="100%" stopColor="#b45309" />
          </linearGradient>
          <linearGradient id="plusGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fef08a" />
            <stop offset="50%" stopColor="#f59e0b" />
            <stop offset="100%" stopColor="#b45309" />
          </linearGradient>
        </defs>

        {/* Seamless Transparent Background (blends with header background) */}
        <circle cx="50" cy="50" r="48" fill="none" />

        {/* Golden Outer Ring */}
        <circle
          cx="50"
          cy="50"
          r="44"
          fill="none"
          stroke="url(#goldGradient1)"
          strokeWidth="6"
        />

        {/* Inner Golden Crescent Ring Swoosh */}
        <path
          d="M 22,65 A 38,38 0 1,1 82,35"
          fill="none"
          stroke="url(#goldGradient2)"
          strokeWidth="3.5"
          strokeLinecap="round"
          opacity="0.85"
        />

        {/* White T Letter */}
        <path
          d="M 22 28 L 52 28 L 52 36 L 41 36 L 41 74 L 32 74 L 32 36 L 22 36 Z"
          fill="#ffffff"
        />

        {/* Golden + Sign */}
        <path
          d="M 64 36 L 72 36 L 72 45 L 81 45 L 81 53 L 72 53 L 72 62 L 64 62 L 64 53 L 55 53 L 55 45 L 64 45 Z"
          fill="url(#plusGradient)"
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
        <div className="flex items-center tracking-tight leading-none font-sans uppercase">
          <span className={`text-slate-100 font-extrabold ${currentSize.tetherText}`}>
            TETHER
          </span>
          <span
            className={`bg-gradient-to-r from-amber-300 via-amber-400 to-amber-500 bg-clip-text text-transparent font-black ml-0.5 ${currentSize.plusText}`}
          >
            PLUS
          </span>
        </div>

        {showTagline && (
          <div className={`font-mono text-cyan-400/80 font-bold uppercase mt-1 tracking-[0.2em] flex items-center gap-1 ${currentSize.tagline}`}>
            <span>CONNECT</span>
            <span className="text-amber-400/60 font-black">•</span>
            <span>GROW</span>
            <span className="text-amber-400/60 font-black">•</span>
            <span>EARN</span>
          </div>
        )}
      </div>
    </div>
  );
};
