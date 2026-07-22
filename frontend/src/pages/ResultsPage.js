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
      className="min-h-screen"
      style={{ paddingTop: '64px', paddingBottom: '32px' }}
    >
      <div className="max-w-2xl mx-auto px-3 sm:px-4">

        {/* Round badge */}
        <div className="text-center mb-4">
          <span className="text-xs text-white/40">Round {currentRound} of {totalRounds}</span>
        </div>

        {/* Winner Banner */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 180, delay: 0.1 }}
          className={`
            glass-strong p-5 text-center mb-4 rounded-2xl
            ${playersWin ? 'glow-teal border-accent-500/30' : 'glow-rose border-rose-500/30'}
          `}
        >
          <motion.div
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ repeat: 3, duration: 0.5 }}
            className="text-5xl sm:text-6xl mb-3"
          >
            {playersWin ? '🏆' : '😈'}
          </motion.div>
          <h1 className={`text-2xl sm:text-3xl font-black mb-1 ${playersWin ? 'text-accent-300' : 'text-rose-300'}`}>
            {playersWin ? 'Players Win!' : 'Imposter Wins!'}
          </h1>
          <p className="text-white/60 text-sm">
            {eliminatedName} was {eliminatedIsImposter ? 'the' : 'NOT the'} imposter.
          </p>
        </motion.div>

        {/* Eliminated Player */}
        <motion.div
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="glass p-4 mb-4 flex items-center gap-3 rounded-2xl"
        >
          <div className="text-2xl flex-shrink-0">{eliminatedIsImposter ? '🎭' : '😇'}</div>
          <div className="flex-1 min-w-0">
            <p className="text-white/50 text-xs">Most votes received</p>
            <p className="text-lg font-bold text-white truncate">{eliminatedName}</p>
            <p className={`text-xs font-semibold mt-0.5 ${eliminatedIsImposter ? 'text-rose-400' : 'text-green-400'}`}>
              {eliminatedIsImposter ? '👺 Was the Imposter!' : '😇 Was Innocent!'}
            </p>
          </div>
          <div className="text-center flex-shrink-0">
            <div className="text-2xl font-black text-rose-400">{voteCounts[eliminatedId] || 0}</div>
            <div className="text-[10px] text-white/30">votes</div>
          </div>
        </motion.div>

        {/* Word Reveal */}
        <motion.div
          initial={{ y: 16, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="glass p-4 mb-4 rounded-2xl"
        >
          <h2 className="font-bold text-white text-sm mb-3">🔓 Word Reveal</h2>
          <div className="space-y-2">
            {scores.map((player, i) => {
              const assignment = words[player.id];
              const isImposter = assignment?.isImposter;
              return (
                <motion.div
                  key={player.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 + i * 0.04 }}
                  className={`
                    flex items-center gap-3 p-3 rounded-xl border
                    ${isImposter ? 'border-rose-500/40 bg-rose-500/10' : 'border-white/5 bg-white/3'}
                  `}
                >
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-xs flex-shrink-0"
                    style={{ backgroundColor: player.avatar?.color || '#7c3aed' }}
                  >
                    {player.avatar?.initial || player.name[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-semibold text-white text-sm truncate max-w-[110px]">{player.name}</span>
                      {player.id === myId && <span className="badge bg-primary-500/20 text-primary-400">You</span>}
                      {isImposter && <span className="badge bg-rose-500/20 text-rose-400">😈 Imposter</span>}
                    </div>
                    <div className={`text-xs font-bold mt-0.5 ${isImposter ? 'text-rose-300' : 'text-accent-300'}`}>
                      {assignment?.word || '?'}
                      {assignment?.translationText && assignment.translationText !== assignment.word && (
                        <span className="text-white/50 ml-1">({assignment.translationText})</span>
                      )}
                    </div>
                  </div>
                  <div className="text-xs text-white/30 flex-shrink-0">{voteCounts[player.id] || 0} votes</div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        {/* Scoreboard */}
        <motion.div
          initial={{ y: 16, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.55 }}
          className="glass p-4 mb-5 rounded-2xl"
        >
          <h2 className="font-bold text-white text-sm mb-3">🏅 Scores</h2>
          <div className="space-y-2">
            {[...scores].sort((a, b) => (b.score || 0) - (a.score || 0)).map((player, i) => (
              <motion.div
                key={player.id}
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.65 + i * 0.04 }}
                className={`
                  flex items-center gap-3 p-2.5 rounded-xl
                  ${player.id === myId ? 'bg-primary-500/10 border border-primary-500/30' : 'bg-white/3'}
                `}
              >
                <span className="text-lg w-7 text-center flex-shrink-0">
                  {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}.`}
                </span>
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-xs flex-shrink-0"
                  style={{ backgroundColor: player.avatar?.color || '#7c3aed' }}
                >
                  {player.avatar?.initial || player.name[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <span className="font-semibold text-white text-sm truncate block">{player.name}</span>
                  {player.id === myId && <span className="text-[10px] text-primary-400">You</span>}
                </div>
                <div className="text-right flex-shrink-0">
                  <span className="text-base font-black text-accent-400">{player.score || 0}</span>
                  <span className="text-white/30 text-xs ml-0.5">pts</span>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Actions */}
        {isHost ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }}>
            <button
              id="next-round-btn"
              onClick={nextRound}
              className={`${isLastRound ? 'btn-danger' : 'btn-primary'} w-full py-4 text-base`}
              style={{ touchAction: 'manipulation' }}
            >
              {isLastRound ? '🏁 See Final Results' : '▶️ Next Round'}
            </button>
          </motion.div>
        ) : (
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
