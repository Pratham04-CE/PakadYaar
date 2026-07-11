import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGame } from '../context/GameContext';

export default function WordRevealPage() {
  const { room, myWord, isHost, confirmedCount, hasConfirmedWord, confirmWord, startDiscussion } = useGame();
  const [revealed, setRevealed] = useState(false);

  if (!room || !myWord) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-white/40 animate-pulse">Assigning words…</div>
      </div>
    );
  }

  const totalPlayers = room.players.length;
  const allConfirmed = confirmedCount >= totalPlayers;

  function handleReveal() {
    setRevealed(true);
  }

  function handleConfirm() {
    confirmWord();
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen flex flex-col items-center justify-center px-4 py-8"
    >
      <div className="w-full max-w-md">

        {/* Header */}
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="text-center mb-8"
        >
          <div className="inline-flex items-center gap-2 bg-primary-600/20 border border-primary-500/30 rounded-full px-4 py-1.5 text-primary-300 text-sm mb-4">
            <span className="live-dot" />
            Round {room.currentRound} of {room.totalRounds}
          </div>
          <h1 className="text-3xl font-bold text-white">Your Secret Word</h1>
          <p className="text-white/50 mt-2 text-sm">
            Don't show anyone else — keep your screen private!
          </p>
        </motion.div>

        {/* Word Card */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
          className="relative mb-6"
        >
          <div className={`
            glass-strong p-10 text-center cursor-pointer select-none
            transition-all duration-500
            ${revealed ? 'glow-purple' : 'hover:border-white/20'}
          `}
            onClick={!revealed ? handleReveal : undefined}
          >
            {!revealed ? (
              <motion.div
                initial={{ opacity: 1 }}
                className="flex flex-col items-center gap-4"
              >
                <div className="w-20 h-20 rounded-full bg-primary-600/30 border-2 border-primary-500/40 flex items-center justify-center text-4xl">
                  🔒
                </div>
                <p className="text-white/50 text-sm">Tap to reveal your word</p>
                <motion.div
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ repeat: Infinity, duration: 2 }}
                  className="text-white font-semibold text-lg"
                >
                  Tap Here
                </motion.div>
              </motion.div>
            ) : (
              <motion.div
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 300 }}
                className="flex flex-col items-center gap-4"
              >
                <div className="text-6xl font-black text-white tracking-tight">
                  {myWord.word}
                </div>
                <div className="h-px w-3/4 bg-white/10" />
                <p className="text-white/40 text-xs uppercase tracking-widest">Your Secret Word</p>
              </motion.div>
            )}
          </div>
        </motion.div>

        {/* Confirm button */}
        <AnimatePresence>
          {revealed && !hasConfirmedWord && (
            <motion.button
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              onClick={handleConfirm}
              id="confirm-word-btn"
              className="btn-primary w-full py-4 text-base mb-4"
            >
              ✅ I've Seen My Word
            </motion.button>
          )}
        </AnimatePresence>

        {hasConfirmedWord && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="glass p-4 text-center mb-4"
          >
            <p className="text-green-400 font-semibold">
              ✅ Word confirmed!
            </p>
          </motion.div>
        )}

        {/* Progress */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="glass p-5 text-center mb-4"
        >
          <p className="text-white/50 text-sm mb-3">
            Players ready
          </p>
          <div className="flex justify-center gap-2 mb-3">
            {room.players.map((p, i) => (
              <motion.div
                key={p.id}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: i * 0.05 }}
                className={`
                  w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2
                  ${i < confirmedCount
                    ? 'border-green-500 bg-green-500/20 text-green-400'
                    : 'border-white/20 bg-white/5 text-white/30'
                  }
                `}
                title={p.name}
              >
                {i < confirmedCount ? '✓' : p.name[0]}
              </motion.div>
            ))}
          </div>
          <p className="text-white font-semibold">
            {confirmedCount} / {totalPlayers} ready
          </p>
        </motion.div>

        {/* Host start discussion */}
        {isHost && allConfirmed && (
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            onClick={startDiscussion}
            id="start-discussion-btn"
            className="btn-accent w-full py-4 text-base"
          >
            🗣️ Start Discussion
          </motion.button>
        )}

        {isHost && !allConfirmed && (
          <p className="text-center text-white/30 text-sm">
            Waiting for all players to confirm…
          </p>
        )}

        {!isHost && allConfirmed && (
          <p className="text-center text-accent-400 text-sm animate-pulse">
            Waiting for host to start discussion…
          </p>
        )}
      </div>
    </motion.div>
  );
}
