import React, { useState } from 'react';

export type PieceTheme = 'neo' | 'staunton' | 'wood' | 'neon' | 'glass';
export type BoardTheme = 'pink' | 'green' | 'wood' | 'dark';

interface PieceSVGProps {
  type: string; // 'p' | 'n' | 'b' | 'r' | 'q' | 'k'
  color: 'w' | 'b';
  theme?: PieceTheme;
  className?: string;
}

// CDN Image sources for Chess.com piece styles
const PIECE_CDN_MAP: Record<string, string> = {
  cburnett: 'https://lichess1.org/assets/piece/cburnett',
  merida: 'https://lichess1.org/assets/piece/merida',
  alpha: 'https://lichess1.org/assets/piece/alpha',
  staunty: 'https://lichess1.org/assets/piece/staunty',
  wood: 'https://lichess1.org/assets/piece/wood',
};

export const PieceSVG: React.FC<PieceSVGProps> = ({
  type,
  color,
  theme = 'neo',
  className = 'w-full h-full select-none',
}) => {
  const [imgError, setImgError] = useState<boolean>(false);
  const isWhite = color === 'w';
  const pieceType = type.toLowerCase();
  const pieceCode = `${color}${pieceType.toUpperCase()}`; // e.g. wP, bN, wQ

  // Map user theme to CDN style
  const getCdnTheme = (t: PieceTheme | string): string => {
    switch (t) {
      case 'neo':
        return 'cburnett'; // Standard Chess.com Neo style
      case 'staunton':
        return 'staunty';
      case 'wood':
        return 'wood';
      case 'neon':
        return 'alpha';
      case 'glass':
        return 'merida';
      default:
        return 'cburnett';
    }
  };

  const cdnTheme = getCdnTheme(theme);
  const cdnUrl = `${PIECE_CDN_MAP[cdnTheme] || PIECE_CDN_MAP.cburnett}/${pieceCode}.svg`;

  // Render SVG fallback if image fails or for local offline vector rendering
  const renderVectorPiece = () => {
    // Unique Gradient & Filter IDs
    const whiteGradId = `piece-white-grad-${theme}`;
    const blackGradId = `piece-black-grad-${theme}`;
    const shadowFilterId = `piece-shadow-${theme}`;

    const getThemeStyles = () => {
      switch (theme) {
        case 'wood':
          return {
            whiteFill: `url(#${whiteGradId})`,
            blackFill: `url(#${blackGradId})`,
            whiteStroke: '#5C3A21',
            blackStroke: '#1A0C05',
            whiteHighlight: '#FFF8F0',
            strokeWidth: 1.8,
            filter: `url(#${shadowFilterId})`,
          };
        case 'neon':
          return {
            whiteFill: `url(#${whiteGradId})`,
            blackFill: `url(#${blackGradId})`,
            whiteStroke: '#FF007A',
            blackStroke: '#00F0FF',
            whiteHighlight: '#FFE600',
            strokeWidth: 2.2,
            filter: `url(#${shadowFilterId})`,
          };
        case 'glass':
          return {
            whiteFill: `url(#${whiteGradId})`,
            blackFill: `url(#${blackGradId})`,
            whiteStroke: '#0284C7',
            blackStroke: '#9333EA',
            whiteHighlight: '#FFFFFF',
            strokeWidth: 2,
            filter: `url(#${shadowFilterId})`,
          };
        case 'staunton':
          return {
            whiteFill: `url(#${whiteGradId})`,
            blackFill: `url(#${blackGradId})`,
            whiteStroke: '#3A2D32',
            blackStroke: '#120B0E',
            whiteHighlight: '#FFFFFF',
            strokeWidth: 1.8,
            filter: `url(#${shadowFilterId})`,
          };
        case 'neo':
        default:
          return {
            whiteFill: '#FFFFFF',
            blackFill: '#262421',
            whiteStroke: '#262421',
            blackStroke: '#262421',
            whiteHighlight: '#E6E6E6',
            blackHighlight: '#5A5752',
            strokeWidth: 1.8,
            filter: `url(#${shadowFilterId})`,
          };
      }
    };

    const styles = getThemeStyles();
    const fill = isWhite ? styles.whiteFill : styles.blackFill;
    const stroke = isWhite ? styles.whiteStroke : styles.blackStroke;

    const renderDefs = () => (
      <defs>
        <filter id={shadowFilterId} x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0.8" dy="1.5" stdDeviation="1" floodColor="#000000" floodOpacity="0.28" />
        </filter>

        {theme === 'staunton' && (
          <>
            <linearGradient id={whiteGradId} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FFFFFF" />
              <stop offset="100%" stopColor="#FFE0EB" />
            </linearGradient>
            <linearGradient id={blackGradId} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#4A3B45" />
              <stop offset="100%" stopColor="#150D13" />
            </linearGradient>
          </>
        )}

        {theme === 'wood' && (
          <>
            <linearGradient id={whiteGradId} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FFF8EE" />
              <stop offset="100%" stopColor="#E2C9B0" />
            </linearGradient>
            <linearGradient id={blackGradId} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#5E3320" />
              <stop offset="100%" stopColor="#240E05" />
            </linearGradient>
          </>
        )}

        {theme === 'neon' && (
          <>
            <linearGradient id={whiteGradId} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FFF0F5" />
              <stop offset="100%" stopColor="#FFCCE1" />
            </linearGradient>
            <linearGradient id={blackGradId} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#1E1B4B" />
              <stop offset="100%" stopColor="#0F172A" />
            </linearGradient>
          </>
        )}

        {theme === 'glass' && (
          <>
            <linearGradient id={whiteGradId} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#F0F9FF" stopOpacity="0.95" />
              <stop offset="100%" stopColor="#BAE6FD" stopOpacity="0.8" />
            </linearGradient>
            <linearGradient id={blackGradId} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#312E81" stopOpacity="0.95" />
              <stop offset="100%" stopColor="#1E1B4B" stopOpacity="0.85" />
            </linearGradient>
          </>
        )}
      </defs>
    );

    // Chess.com Neo & Vector Artwork Renderers
    switch (pieceType) {
      case 'p':
        return (
          <svg viewBox="0 0 45 45" className={className} filter={styles.filter}>
            {renderDefs()}
            <g fill={fill} stroke={stroke} strokeWidth={styles.strokeWidth} strokeLinecap="round" strokeLinejoin="round">
              <path d="M 22.5 9 C 19.8 9 17.5 11.2 17.5 14 C 17.5 15.6 18.2 17 19.3 18 C 17.2 20.3 15.5 23 15 27 L 30 27 C 29.5 23 27.8 20.3 25.7 18 C 26.8 17 27.5 15.6 27.5 14 C 27.5 11.2 25.2 9 22.5 9 Z" />
              <path d="M 14 27 L 31 27 L 31 31 L 14 31 Z" />
              <path d="M 12 31 C 12 31 11 36 12 38 L 33 38 C 34 36 33 31 33 31 Z" />
            </g>
            {!isWhite && <circle cx="22.5" cy="13.5" r="2.2" fill="#5A5752" opacity="0.6" />}
          </svg>
        );

      case 'n':
        return (
          <svg viewBox="0 0 45 45" className={className} filter={styles.filter}>
            {renderDefs()}
            <g fill={fill} stroke={stroke} strokeWidth={styles.strokeWidth} strokeLinecap="round" strokeLinejoin="round">
              <path d="M 22 10 C 22 10 20 7 15 9 C 10 11 11 18 12 21 C 12.5 22.5 11 23 10 24 C 9 25 8 28 12 29 C 13 29.5 15 28.5 15 28.5 C 15 28.5 16 30.5 13 32.5 C 11 34 11 35 13 35.5 C 15 36 26 36 29 34 C 31 32.5 31 29.5 30 27 C 29 24.5 28 21 28 21 C 28 21 28.5 18 26.5 15 C 24.5 12 22 10 22 10 Z" />
            </g>
            <circle cx="16.5" cy="14" r="1.6" fill={isWhite ? '#262421' : '#FFFFFF'} />
            <path d="M 23 13 C 25 15.5 25.5 18 25.5 20" stroke={isWhite ? '#262421' : '#FFFFFF'} strokeWidth="1.3" fill="none" />
          </svg>
        );

      case 'b':
        return (
          <svg viewBox="0 0 45 45" className={className} filter={styles.filter}>
            {renderDefs()}
            <g fill={fill} stroke={stroke} strokeWidth={styles.strokeWidth} strokeLinecap="round" strokeLinejoin="round">
              <path d="M 22.5 8 C 21.1 8 20 9.1 20 10.5 C 20 11.2 20.3 11.8 20.8 12.3 C 17.5 15.5 15.5 20.2 15.5 25.5 C 15.5 28.8 17.8 31 22.5 31 C 27.2 31 29.5 28.8 29.5 25.5 C 29.5 20.2 27.5 15.5 24.2 12.3 C 24.7 11.8 25 11.2 25 10.5 C 25 9.1 23.9 8 22.5 8 Z" />
              <path d="M 14 31 L 31 31 L 31 35 L 14 35 Z" />
              <path d="M 12 35 C 12 35 11 38 12 40 L 33 40 C 34 38 33 35 33 35 Z" />
            </g>
            <path d="M 20 18 L 25 22" stroke={isWhite ? '#262421' : '#FFFFFF'} strokeWidth="1.8" strokeLinecap="round" />
          </svg>
        );

      case 'r':
        return (
          <svg viewBox="0 0 45 45" className={className} filter={styles.filter}>
            {renderDefs()}
            <g fill={fill} stroke={stroke} strokeWidth={styles.strokeWidth} strokeLinecap="round" strokeLinejoin="round">
              <path d="M 12 12 L 12 17 L 15 17 L 15 14 L 20 14 L 20 17 L 25 17 L 25 14 L 30 14 L 30 17 L 33 17 L 33 12 Z" />
              <path d="M 13 17 L 32 17 L 30.5 28 L 14.5 28 Z" />
              <path d="M 12 28 L 33 28 L 34 35 L 11 35 Z" />
              <path d="M 10 35 C 10 35 9 39 10 41 L 35 41 C 36 39 35 35 35 35 Z" />
            </g>
            <line x1="13" y1="21" x2="32" y2="21" stroke={isWhite ? '#262421' : '#FFFFFF'} strokeWidth="1.2" />
          </svg>
        );

      case 'q':
        return (
          <svg viewBox="0 0 45 45" className={className} filter={styles.filter}>
            {renderDefs()}
            <g fill={fill} stroke={stroke} strokeWidth={styles.strokeWidth} strokeLinecap="round" strokeLinejoin="round">
              <path d="M 9 13 A 2 2 0 1 1 9 17 A 2 2 0 1 1 9 13 Z" />
              <path d="M 15.5 10 A 2 2 0 1 1 15.5 14 A 2 2 0 1 1 15.5 10 Z" />
              <path d="M 22.5 8 A 2 2 0 1 1 22.5 12 A 2 2 0 1 1 22.5 8 Z" />
              <path d="M 29.5 10 A 2 2 0 1 1 29.5 14 A 2 2 0 1 1 29.5 10 Z" />
              <path d="M 36 13 A 2 2 0 1 1 36 17 A 2 2 0 1 1 36 13 Z" />
              <path d="M 11 17 C 11 17 14 27 14 29 C 14 30.5 18 31 22.5 31 C 27 31 31 30.5 31 29 C 31 27 34 17 34 17 L 28 21 L 22.5 13 L 17 21 Z" />
              <path d="M 12 31 L 33 31 L 34 36 L 11 36 Z" />
            </g>
            {!isWhite && <path d="M 17 26 C 20 27.5 25 27.5 28 26" stroke="#FFFFFF" strokeWidth="1.2" fill="none" />}
          </svg>
        );

      case 'k':
        return (
          <svg viewBox="0 0 45 45" className={className} filter={styles.filter}>
            {renderDefs()}
            <g fill={fill} stroke={stroke} strokeWidth={styles.strokeWidth} strokeLinecap="round" strokeLinejoin="round">
              <path d="M 22.5 6 L 22.5 12 M 19.5 9 L 25.5 9" strokeWidth={styles.strokeWidth + 0.4} />
              <path d="M 22.5 12 C 18 15 15 20 15 26 C 15 28.5 18 30 22.5 30 C 27 30 30 28.5 30 26 C 30 20 27 15 22.5 12 Z" />
              <path d="M 12 30 L 33 30 L 34 35 L 11 35 Z" />
              <path d="M 10 35 C 10 35 9 39 10 41 L 35 41 C 36 39 35 35 35 35 Z" />
            </g>
            <circle cx="22.5" cy="21" r="2.5" fill={isWhite ? '#262421' : '#FFFFFF'} />
          </svg>
        );

      default:
        return null;
    }
  };

  // If CDN image failed to load, fall back to vector SVG
  if (imgError) {
    return renderVectorPiece();
  }

  return (
    <img
      src={cdnUrl}
      alt={`${color === 'w' ? 'White' : 'Black'} ${type}`}
      className={`${className} object-contain filter drop-shadow-sm select-none pointer-events-none transition-transform duration-100`}
      onError={() => setImgError(true)}
      loading="eager"
      draggable={false}
    />
  );
};
