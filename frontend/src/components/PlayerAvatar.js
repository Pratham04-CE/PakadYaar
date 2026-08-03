import React from 'react';

export default function PlayerAvatar({ avatar, name = '', className = "w-9 h-9", textClassName = "text-sm", isSpeaking = false }) {
  const initial = avatar?.initial || (name ? name[0].toUpperCase() : '👤');
  const bgColor = avatar?.color || '#7c3aed';

  return (
    <div className="relative inline-flex items-center justify-center flex-shrink-0">
      {/* Google Meet-style Active Speaking Pulse Effect */}
      {isSpeaking && (
        <>
          <span className="absolute -inset-1.5 rounded-full bg-emerald-400/40 animate-ping pointer-events-none" />
          <span className="absolute -inset-1 rounded-full ring-4 ring-emerald-400/90 ring-offset-2 ring-offset-slate-950 animate-pulse pointer-events-none" />
        </>
      )}

      <div
        className={`${className} rounded-full flex items-center justify-center text-white font-bold flex-shrink-0 shadow-md overflow-hidden relative border border-white/20 z-10 transition-all ${isSpeaking ? 'scale-105 ring-2 ring-emerald-300' : ''}`}
        style={{ backgroundColor: bgColor }}
      >
        <span className={textClassName}>
          {initial}
        </span>
      </div>
    </div>
  );
}
