import React from 'react';
import { motion } from 'framer-motion';
import { useGame } from '../context/GameContext';

const CONFETTI_COLORS = ['#7c3aed', '#06b6d4', '#f59e0b', '#10b981', '#ef4444', '#ec4899'];

export default function GameOverPage() {
  const { myId, finalResults, isHost, playAgain, leaveRoom } = useGame();

  if (!finalResults) return null;

  const { scores, winner, totalRounds } = finalResults;
  const sorted = [...scores].sort((a, b) => (b.score || 0) - (a.score || 0));
  const myPosition = sorted.findIndex(p => p.id === myId) + 1;
  const amIWinner = winner?.id === myId;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen flex flex-col items-center justify-start"
      style={{ paddingTop: '40px', paddingBottom: '40px' }}
    >
      {/* Confetti */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        {Array.from({ length: 25 }).map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 rounded-full"
            style={{
              backgroundColor: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
              left: `${Math.random() * 100}%`,
              top: -20,
            }}
            animate={{ y: '110vh', x: `${(Math.random() - 0.5) * 150}px`, rotate: 360 * (Math.random() > 0.5 ? 1 : -1) }}
            transition={{ duration: 3 + Math.random() * 3, delay: i * 0.12, ease: 'easeIn' }}
          />
        ))}
      </div>

      <div className="w-full max-w-sm px-4 relative">

        {/* Trophy + Title */}
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 180 }}
          className="text-center mb-5"
        >
          <div className="text-6xl sm:text-7xl mb-3">🏆</div>
          <h1 className="text-3xl sm:text-4xl font-black text-gradient mb-1">Game Over!</h1>
          <p className="text-white/50 text-sm">After {totalRounds} round{totalRounds !== 1 ? 's' : ''}</p>
        </motion.div>

        {/* Winner Card */}
        <motion.div
          initial={{ y: 24, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="glass-strong p-5 text-center glow-purple mb-4 rounded-2xl"
        >
          <p className="text-white/50 text-xs mb-2">🥇 Winner</p>
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center text-white font-black text-2xl mx-auto mb-2 border-4 border-primary-500"
            style={{ backgroundColor: winner?.avatar?.color || '#7c3aed' }}
          >
            {winner?.avatar?.initial || winner?.name?.[0]}
          </div>
          <p className="text-2xl font-black text-white truncate">{winner?.name}</p>
          <p className="text-accent-400 font-bold text-lg mt-0.5">{winner?.score || 0} pts</p>
          {amIWinner ? (
            <motion.p
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ repeat: Infinity, duration: 1.5 }}
              className="text-yellow-400 font-semibold mt-2 text-sm"
            >
              🎉 That's you!
            </motion.p>
          ) : (
            <p className="text-white/30 text-xs mt-2">You finished #{myPosition}</p>
          )}
        </motion.div>

        {/* Leaderboard */}
        <motion.div
          initial={{ y: 24, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.45 }}
          className="glass p-4 mb-5 rounded-2xl"
        >
          <h2 className="font-bold text-white text-sm mb-3 text-center">Final Leaderboard</h2>
          <div className="space-y-2">
            {sorted.map((player, i) => (
              <motion.div
                key={player.id}
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.55 + i * 0.06 }}
                className={`
                  flex items-center gap-2.5 p-2.5 rounded-xl
                  ${player.id === myId ? 'bg-primary-500/15 border border-primary-500/30' : 'bg-white/3'}
                  ${i === 0 ? 'ring-1 ring-yellow-500/30' : ''}
                `}
              >
                <span className="text-lg w-7 text-center flex-shrink-0">
                  {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}.`}
                </span>
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
                  style={{ backgroundColor: player.avatar?.color || '#7c3aed' }}
                >
                  {player.avatar?.initial || player.name[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <span className="font-semibold text-white text-sm block truncate">{player.name}</span>
                  {player.id === myId && <span className="text-[10px] text-primary-400">You</span>}
                </div>
                <div className="flex-shrink-0 text-right">
                  <span className="text-base font-black text-accent-400">{player.score || 0}</span>
                  <span className="text-white/30 text-xs ml-0.5">pts</span>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Actions */}
        <div className="space-y-3">
          {isHost && (
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.9 }}
              onClick={playAgain}
              id="play-again-btn"
              className="btn-primary w-full py-4 text-base"
              style={{ touchAction: 'manipulation' }}
            >
              🔄 Play Again
            </motion.button>
          )}
          {!isHost && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center text-white/30 text-sm"
            >
              Waiting for host to start a new game…
            </motion.p>
          )}
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
            onClick={leaveRoom}
            className="btn-ghost w-full py-3 text-sm"
            style={{ touchAction: 'manipulation' }}
          >
            🏠 Back to Home
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}
