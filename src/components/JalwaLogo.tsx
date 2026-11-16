import React from 'react';

interface JalwaLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showSubtext?: boolean;
}

export const JalwaLogo: React.FC<JalwaLogoProps> = ({
  className = '',
  size = 'md',
}) => {
  const sizeClasses = {
    sm: 'text-xl',
    md: 'text-2xl sm:text-3xl',
    lg: 'text-4xl sm:text-5xl',
  };

  return (
    <div className={`inline-flex items-baseline font-black italic tracking-tighter select-none ${className}`}>
      <span
        className={`${sizeClasses[size]} text-white drop-shadow-[0_2px_6px_rgba(0,0,0,0.6)]`}
        style={{
          fontFamily: "'Montserrat', -apple-system, BlinkMacSystemFont, sans-serif",
          letterSpacing: '-0.04em',
        }}
      >
        Sport
      </span>
      <span
        className={`${sizeClasses[size]} bg-gradient-to-r from-[#38bdf8] via-[#22d3ee] to-[#34d399] bg-clip-text text-transparent drop-shadow-[0_2px_10px_rgba(34,211,238,0.5)] pr-0.5`}
        style={{
          fontFamily: "'Montserrat', -apple-system, BlinkMacSystemFont, sans-serif",
          letterSpacing: '-0.02em',
        }}
      >
        X
      </span>
    </div>
  );
};
