import React from 'react';
import { motion } from 'framer-motion';
import { useGame } from '../context/GameContext';

const CONFETTI_COLORS = ['#7c3aed', '#06b6d4', '#f59e0b', '#10b981', '#ef4444', '#ec4899'];

export default function GameOverPage() {
  const { myId, finalResults, isHost, playAgain } = useGame();

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
      className="min-h-screen flex flex-col items-center justify-center px-4 py-12"
    >
      {/* Confetti dots */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        {Array.from({ length: 30 }).map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 rounded-full"
            style={{
              backgroundColor: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
              left: `${Math.random() * 100}%`,
              top: -20,
            }}
            animate={{ y: '110vh', x: `${(Math.random() - 0.5) * 200}px`, rotate: 360 * (Math.random() > 0.5 ? 1 : -1) }}
            transition={{ duration: 3 + Math.random() * 3, delay: i * 0.1, ease: 'easeIn' }}
          />
        ))}
      </div>

      <div className="w-full max-w-md relative">

        {/* Trophy + Title */}
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 200 }}
          className="text-center mb-8"
        >
          <div className="text-8xl mb-4">🏆</div>
          <h1 className="text-5xl font-black text-gradient mb-2">Game Over!</h1>
          <p className="text-white/50">After {totalRounds} round{totalRounds !== 1 ? 's' : ''}</p>
        </motion.div>

        {/* Winner Card */}
        <motion.div
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="glass-strong p-6 text-center glow-purple mb-6"
        >
          <p className="text-white/50 text-sm mb-3">🥇 Winner</p>
          <div
            className="w-20 h-20 rounded-full flex items-center justify-center text-white font-black text-3xl mx-auto mb-3 border-4 border-primary-500"
            style={{ backgroundColor: winner?.avatar?.color || '#7c3aed' }}
          >
            {winner?.avatar?.initial || winner?.name?.[0]}
          </div>
          <p className="text-3xl font-black text-white">{winner?.name}</p>
          <p className="text-accent-400 font-bold text-xl mt-1">{winner?.score || 0} pts</p>
          {amIWinner && (
            <motion.p
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ repeat: Infinity, duration: 1.5 }}
              className="text-yellow-400 font-semibold mt-2"
            >
              🎉 That's you!
            </motion.p>
          )}
          {!amIWinner && (
            <p className="text-white/30 text-sm mt-2">You finished #{myPosition}</p>
          )}
        </motion.div>

        {/* Full Leaderboard */}
        <motion.div
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="glass p-6 mb-6"
        >
          <h2 className="font-bold text-white mb-4 text-center">Final Leaderboard</h2>
          <div className="space-y-2">
            {sorted.map((player, i) => (
              <motion.div
                key={player.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.6 + i * 0.07 }}
                className={`
                  flex items-center gap-3 p-3 rounded-xl
                  ${player.id === myId ? 'bg-primary-500/15 border border-primary-500/30' : 'bg-white/3'}
                  ${i === 0 ? 'ring-1 ring-yellow-500/30' : ''}
                `}
              >
                <span className="text-xl w-8 text-center">
                  {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}.`}
                </span>
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-sm"
                  style={{ backgroundColor: player.avatar?.color || '#7c3aed' }}
                >
                  {player.avatar?.initial || player.name[0]}
                </div>
                <div className="flex-1">
                  <span className="font-semibold text-white">{player.name}</span>
                  {player.id === myId && <span className="ml-2 text-xs text-primary-400">(You)</span>}
                </div>
                <div className="text-right">
                  <span className="text-lg font-black text-accent-400">{player.score || 0}</span>
                  <span className="text-white/30 text-xs ml-1">pts</span>
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
              className="btn-primary w-full py-4 text-lg"
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
            onClick={() => window.location.href = '/'}
            className="btn-ghost w-full py-3 text-sm"
          >
            🏠 Back to Home
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}
