import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useGame } from '../context/GameContext';
import { REGIONAL_THEMES } from '../data/themes';
import sound from '../utils/sound';

export default function ResultsPage() {
  const { room, results, isHost, nextRound, playAgain, leaveRoom } = useGame();
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (!room) return null;

  const cfg = room.config || {};
  const currentThemeKey = cfg.theme || 'gujarat';
  const currentTheme = REGIONAL_THEMES[currentThemeKey] || REGIONAL_THEMES.gujarat;
  
  const bgImage = isMobile 
    ? currentTheme.background?.mobile 
    : currentTheme.background?.desktop;

  const winnerSide = results?.winnerSide || 'crew';
  const imposterIds = results?.imposterIds || [];
  const secretWord = results?.secretWord || 'N/A';
  const scores = results?.scores || room.players || [];

  const isLastRound = room.currentRound >= room.totalRounds;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen relative overflow-hidden bg-slate-950 flex flex-col items-center justify-center p-4"
      style={{
        backgroundImage: bgImage ? `url(${bgImage})` : 'none',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        paddingTop: '60px',
        paddingBottom: '40px',
      }}
    >
      <div className="absolute inset-0 bg-slate-950/75 backdrop-blur-[1px] pointer-events-none" />

      <div className="max-w-md w-full relative z-10 space-y-4">
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className={`glass-strong p-5 text-center rounded-3xl border-2 ${winnerSide === 'players' ? 'border-emerald-500/50 glow-emerald' : 'border-rose-500/50 glow-rose'}`}
        >
          <span className="text-4xl mb-2 inline-block">
            {winnerSide === 'players' ? '🎉' : '😈'}
          </span>
          <h1 className="text-2xl font-black text-white tracking-wide">
            {winnerSide === 'players' ? 'Crew Wins!' : 'Imposter Wins!'}
          </h1>
          <p className="text-xs text-white/70 mt-1">
            {winnerSide === 'players' ? 'The imposter was successfully caught.' : 'Imposter fooled everyone!'}
          </p>

          <div className="mt-3 pt-3 border-t border-white/10 flex justify-around text-xs">
            <div>
              <span className="text-white/50 block">Secret Word</span>
              <span className="font-bold text-amber-300 uppercase">{secretWord}</span>
            </div>
            <div>
              <span className="text-white/50 block">Round</span>
              <span className="font-bold text-white">{room.currentRound} / {room.totalRounds}</span>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="glass p-4 rounded-2xl shadow-xl"
        >
          <h2 className="font-bold text-white text-xs uppercase tracking-wider mb-3 text-white/80">
            📊 Standings & Roles
          </h2>

          <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
            {scores.map((player) => {
              const isImposter = imposterIds.includes(player.id);
              return (
                <div
                  key={player.id}
                  className="flex items-center gap-3 p-2.5 rounded-xl bg-black/40 border border-white/10"
                >
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs text-white flex-shrink-0 overflow-hidden shadow-md"
                    style={{ backgroundColor: player.avatar?.color || '#7c3aed' }}
                  >
                    {player.avatar?.image ? (
                      <img src={player.avatar.image} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      player.avatar?.initial || player.name[0]
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-white text-xs truncate">{player.name}</span>
                      {isImposter ? (
                        <span className="text-[9px] bg-rose-600 text-white px-2 py-0.5 rounded-full font-bold">Imposter</span>
                      ) : (
                        <span className="text-[9px] bg-emerald-600 text-white px-2 py-0.5 rounded-full font-bold">Crew</span>
                      )}
                    </div>
                  </div>

                  <div className="text-right flex-shrink-0">
                    <span className="text-xs font-black text-amber-400">{player.score || 0} pts</span>
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>

        <div className="space-y-2 pt-2">
          {isHost ? (
            <button
              onClick={() => { sound.click(); nextRound(); }}
              className="w-full py-3.5 bg-primary-600 hover:bg-primary-500 text-white font-bold rounded-2xl text-sm shadow-xl transition-all cursor-pointer active:scale-95"
              style={{ touchAction: 'manipulation' }}
            >
              {isLastRound ? '🏆 View Final Game Over' : '▶️ Next Round'}
            </button>
          ) : (
            <p className="text-center text-white/50 text-xs italic">
              Waiting for host to proceed...
            </p>
          )}

          <div className="flex gap-2">
            <button
              onClick={() => { sound.click(); playAgain(); }}
              className="flex-1 py-3 bg-white/10 hover:bg-white/20 text-white font-bold rounded-xl text-xs border border-white/20 transition-all cursor-pointer active:scale-95"
              style={{ touchAction: 'manipulation' }}
            >
              🔄 Play Again
            </button>
            <button
              onClick={() => { sound.click(); leaveRoom(); }}
              className="flex-1 py-3 bg-rose-600/30 hover:bg-rose-600/50 text-rose-300 font-bold rounded-xl text-xs border border-rose-500/30 transition-all cursor-pointer active:scale-95"
              style={{ touchAction: 'manipulation' }}
            >
              🚪 Leave Room
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}