import React from 'react';
import { motion } from 'framer-motion';
import { useGame } from '../context/GameContext';

export default function ResultsPage() {
  const { room, myId, results, isHost, nextRound } = useGame();

  if (!room || !results) return null;

  const {
    voteCounts,
    eliminatedId,
    eliminatedName,
    eliminatedIsImposter,
    winnerSide,
    words,
    scores,
    currentRound,
    totalRounds,
    isLastRound
  } = results;

  const playersWin = winnerSide === 'players';

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen px-4 py-8"
    >
      <div className="max-w-3xl mx-auto">

        {/* Round Badge */}
        <div className="text-center mb-6">
          <span className="text-sm text-white/40">Round {currentRound} of {totalRounds}</span>
        </div>

        {/* Winner Banner */}
        <motion.div
          initial={{ scale: 0.7, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 200, delay: 0.1 }}
          className={`
            glass-strong p-8 text-center mb-6
            ${playersWin ? 'glow-teal border-accent-500/30' : 'glow-rose border-rose-500/30'}
          `}
        >
          <motion.div
            animate={{ scale: [1, 1.15, 1] }}
            transition={{ repeat: 3, duration: 0.5 }}
            className="text-7xl mb-4"
          >
            {playersWin ? '🏆' : '😈'}
          </motion.div>
          <h1 className={`text-4xl font-black mb-2 ${playersWin ? 'text-accent-300' : 'text-rose-300'}`}>
            {playersWin ? 'Players Win!' : 'Imposter Wins!'}
          </h1>
          <p className="text-white/60">
            {eliminatedName} was {eliminatedIsImposter ? 'the' : 'NOT the'} imposter.
          </p>
        </motion.div>

        {/* Eliminated Player */}
        <motion.div
          initial={{ x: -30, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="glass p-5 mb-4 flex items-center gap-4"
        >
          <div className="text-3xl">{eliminatedIsImposter ? '🎭' : '😇'}</div>
          <div>
            <p className="text-white/50 text-sm">Most votes received</p>
            <p className="text-xl font-bold text-white">{eliminatedName}</p>
            <p className={`text-sm font-semibold mt-0.5 ${eliminatedIsImposter ? 'text-rose-400' : 'text-green-400'}`}>
              {eliminatedIsImposter ? '👺 Was the Imposter!' : '😇 Was Innocent!'}
            </p>
          </div>
          <div className="ml-auto text-center">
            <div className="text-3xl font-black text-rose-400">{voteCounts[eliminatedId] || 0}</div>
            <div className="text-xs text-white/30">votes</div>
          </div>
        </motion.div>

        {/* Word Reveal */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="glass p-6 mb-4"
        >
          <h2 className="font-bold text-white mb-4">Word Reveal 🔓</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {scores.map((player, i) => {
              const assignment = words[player.id];
              const isImposter = assignment?.isImposter;
              return (
                <motion.div
                  key={player.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 + i * 0.05 }}
                  className={`
                    flex items-center justify-between p-3 rounded-xl border
                    ${isImposter
                      ? 'border-rose-500/40 bg-rose-500/10'
                      : 'border-white/5 bg-white/3'
                    }
                  `}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-xs flex-shrink-0"
                      style={{ backgroundColor: player.avatar?.color || '#7c3aed' }}
                    >
                      {player.avatar?.initial || player.name[0]}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-white text-sm">{player.name}</span>
                        {player.id === myId && <span className="text-xs text-primary-400">(You)</span>}
                        {isImposter && <span className="text-rose-400 text-xs">🎭 Imposter</span>}
                      </div>
                      <div className={`text-xs font-bold mt-0.5 ${isImposter ? 'text-rose-300' : 'text-accent-300'}`}>
                        Word: {assignment?.word || '?'}
                      </div>
                    </div>
                  </div>
                  <div className="text-right text-xs text-white/30">
                    {voteCounts[player.id] || 0} votes
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        {/* Scoreboard */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="glass p-6 mb-6"
        >
          <h2 className="font-bold text-white mb-4">Scores 🏅</h2>
          <div className="space-y-2">
            {[...scores].sort((a, b) => (b.score || 0) - (a.score || 0)).map((player, i) => (
              <motion.div
                key={player.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.7 + i * 0.05 }}
                className={`
                  flex items-center gap-3 p-3 rounded-xl
                  ${player.id === myId ? 'bg-primary-500/10 border border-primary-500/30' : 'bg-white/3'}
                `}
              >
                <span className="text-xl w-8 text-center">
                  {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}.`}
                </span>
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-xs"
                  style={{ backgroundColor: player.avatar?.color || '#7c3aed' }}
                >
                  {player.avatar?.initial || player.name[0]}
                </div>
                <span className="flex-1 font-semibold text-white">{player.name}</span>
                <div className="text-right">
                  <span className="text-lg font-black text-accent-400">{player.score || 0}</span>
                  <span className="text-white/30 text-xs ml-1">pts</span>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Actions */}
        {isHost && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
          >
            <button
              id="next-round-btn"
              onClick={nextRound}
              className={`${isLastRound ? 'btn-danger' : 'btn-primary'} w-full py-4 text-lg`}
            >
              {isLastRound ? '🏁 See Final Results' : '▶️ Next Round'}
            </button>
          </motion.div>
        )}

        {!isHost && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center text-white/30 text-sm"
          >
            Waiting for host to continue…
          </motion.p>
        )}
      </div>
    </motion.div>
  );
}
