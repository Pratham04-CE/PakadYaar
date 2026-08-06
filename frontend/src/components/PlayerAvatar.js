import React from 'react';

export default function PlayerAvatar({ avatar, name = '', className = "w-10 h-10 sm:w-12 sm:h-12", textClassName = "text-sm sm:text-base", isSpeaking = false }) {
  const initial = avatar?.initial || (name ? name[0].toUpperCase() : '👤');
  const bgColor = avatar?.color || '#7c3aed';

  return (
    <div className="relative inline-flex items-center justify-center flex-shrink-0">
      {/* Google Meet Concentric Sound Wave Ripple Rings (Only active when speaking!) */}
      {isSpeaking && (
        <>
          <span className="absolute -inset-2.5 rounded-full bg-emerald-500/25 animate-ping pointer-events-none" style={{ animationDuration: '1.5s' }} />
          <span className="absolute -inset-1.5 rounded-full bg-emerald-400/40 animate-ping pointer-events-none" style={{ animationDuration: '1s', animationDelay: '0.2s' }} />
          <span className="absolute -inset-1 rounded-full ring-4 ring-emerald-400 ring-offset-2 ring-offset-slate-950 pointer-events-none animate-pulse" />
        </>
      )}

      {/* Avatar Container */}
      <div
        className={`${className} rounded-full flex items-center justify-center text-white font-bold flex-shrink-0 shadow-md overflow-hidden relative border border-white/20 z-10 transition-transform duration-300 ${
          isSpeaking ? 'scale-105 ring-2 ring-emerald-300' : ''
        }`}
        style={{ backgroundColor: bgColor }}
      >
        <span className={textClassName}>
          {initial}
        </span>
      </div>

      {/* Google Meet Equalizer Bar Overlay Indicator */}
      {isSpeaking && (
        <div className="absolute -bottom-1 z-20 bg-emerald-950/90 border border-emerald-400/80 px-1.5 py-0.5 rounded-full flex items-center gap-0.5 shadow-lg">
          <span className="w-0.5 h-2.5 bg-emerald-400 rounded-full animate-bounce" style={{ animationDuration: '0.4s' }} />
          <span className="w-0.5 h-3.5 bg-emerald-300 rounded-full animate-bounce" style={{ animationDuration: '0.6s', animationDelay: '0.15s' }} />
          <span className="w-0.5 h-2 bg-emerald-400 rounded-full animate-bounce" style={{ animationDuration: '0.5s', animationDelay: '0.3s' }} />
        </div>
      )}
    </div>
  );
}
