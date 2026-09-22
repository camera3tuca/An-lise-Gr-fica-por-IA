import React from 'react';

interface ScienceBitLogoProps {
  className?: string;
  variant?: 'light' | 'dark'; // 'dark' = for dark backgrounds (white text), 'light' = for light backgrounds (black text)
  showSubtitle?: boolean;
}

export const ScienceBitLogo: React.FC<ScienceBitLogoProps> = ({
  className = 'h-8',
  variant = 'dark',
  showSubtitle = true,
}) => {
  const isDark = variant === 'dark';
  const textColor = isDark ? '#FFFFFF' : '#0F172A';
  const subtextColor = isDark ? '#94A3B8' : '#334155';

  return (
    <div className={`inline-flex flex-col items-center select-none ${className}`}>
      <svg
        viewBox="0 0 360 88"
        className="w-full h-full"
        style={{ overflow: 'visible' }}
        preserveAspectRatio="xMidYMid meet"
      >
        <text
          x="180"
          y="46"
          textAnchor="middle"
          fontFamily="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
          fontWeight="800"
          fontSize="48"
          letterSpacing="-0.5px"
        >
          <tspan fill={textColor}>Science</tspan>
          <tspan fill="#0066FF">Bit</tspan>
        </text>

        {showSubtitle && (
          <>
            <line
              x1="36"
              y1="70"
              x2="104"
              y2="70"
              stroke="#0066FF"
              strokeWidth="2.75"
              strokeLinecap="round"
            />
            <text
              x="182"
              y="74"
              textAnchor="middle"
              fontFamily="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
              fontWeight="700"
              fontSize="12.5"
              letterSpacing="0.36em"
              fill={subtextColor}
            >
              COMPUTER
            </text>
            <line
              x1="256"
              y1="70"
              x2="324"
              y2="70"
              stroke="#0066FF"
              strokeWidth="2.75"
              strokeLinecap="round"
            />
          </>
        )}
      </svg>
    </div>
  );
};
