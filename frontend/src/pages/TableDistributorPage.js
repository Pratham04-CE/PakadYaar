import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGame } from '../context/GameContext';
import sound from '../utils/sound';

export default function TableDistributorPage() {
  const { room, myWord, isHost, confirmWord, hasConfirmedWord, confirmedCount, startDiscussion } = useGame();
  const [isCardFlipped, setIsCardFlipped] = useState(false);

  if (!room) return null;

  const totalPlayers = room.players.length;
  const readyCount = confirmedCount || room.confirmedCount || 0;
  const allReady = readyCount >= totalPlayers;

  function handleFlip() {
    sound.cardFlip();
    setIsCardFlipped(v => !v);
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen flex flex-col"
      style={{
        background: 'linear-gradient(160deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%)',
        paddingTop: '64px',
        paddingBottom: '24px',
      }}
    >
      {/* ── Top Badge ── */}
      <div className="text-center px-4 mb-6">
        <div className="inline-flex items-center gap-2 bg-primary-500/20 border border-primary-500/30 rounded-full px-4 py-1.5 text-primary-300 text-xs">
          <span className="live-dot" />
          Round {room.currentRound} of {room.totalRounds}
        </div>
        <h1 className="text-xl sm:text-2xl font-black text-white mt-2">
          🃏 Card Distribution
        </h1>
        <p className="text-white/40 text-xs mt-1">Tap your card to reveal your secret word</p>
      </div>

      {/* ── Dealer + Ready Progress ── */}
      <div className="px-4 mb-6">
        <div className="glass-strong rounded-2xl p-4 flex items-center gap-4">
          {/* Dealer avatar */}
          <motion.div
            animate={{ rotate: [0, -8, 8, -8, 0] }}
            transition={{ repeat: Infinity, duration: 3, repeatDelay: 2 }}
            className="w-14 h-14 rounded-full bg-gradient-to-br from-amber-500 to-yellow-300 border-2 border-yellow-200 flex items-center justify-center text-2xl flex-shrink-0 shadow-lg shadow-amber-500/30"
          >
            🤖
          </motion.div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-amber-300 text-sm">Dealer "PakadYaar"</p>
            <p className="text-white/50 text-xs">Cards distributed! Check yours below.</p>
            {/* Ready progress bar */}
            <div className="mt-2">
              <div className="flex justify-between text-[10px] text-white/40 mb-1">
                <span>Players ready</span>
                <span>{readyCount}/{totalPlayers}</span>
              </div>
              <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                <motion.div
                  className={`h-full rounded-full transition-all duration-500 ${allReady ? 'bg-green-400' : 'bg-primary-400'}`}
                  style={{ width: `${totalPlayers > 0 ? (readyCount / totalPlayers) * 100 : 0}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Players Chips (horizontal scroll) ── */}
      <div className="px-4 mb-6">
        <p className="text-xs text-white/40 uppercase tracking-wider mb-2 font-semibold">Players at the Table</p>
        <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1" style={{ scrollbarWidth: 'none' }}>
          {room.players.map((player, i) => (
            <motion.div
              key={player.id}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.06 }}
              className="flex flex-col items-center flex-shrink-0"
            >
              <div
                className="w-11 h-11 rounded-full flex items-center justify-center font-bold text-sm border-2 border-white/20 shadow-md"
                style={{ backgroundColor: player.avatar?.color || '#7c3aed' }}
              >
                {player.avatar?.initial || player.name[0]}
              </div>
              <span className="text-[10px] text-white/70 mt-1 max-w-[52px] truncate text-center">{player.name}</span>
              <span className="text-[9px] text-emerald-400">🎴 Seated</span>
            </motion.div>
          ))}
        </div>
      </div>

      {/* ── My Secret Card ── */}
      <div className="flex-1 flex flex-col items-center justify-center px-4">
        <p className="text-xs text-white/50 uppercase tracking-widest mb-4 font-semibold">Your Hand — Tap to Flip</p>

        {/* Card */}
        <motion.div
          whileTap={{ scale: 0.96 }}
          onClick={handleFlip}
          className={`
            relative w-full max-w-xs rounded-3xl border-2 cursor-pointer overflow-hidden
            transition-all duration-400 shadow-2xl
            ${isCardFlipped
              ? 'border-primary-400 bg-gradient-to-br from-indigo-900 via-purple-900 to-slate-900 shadow-primary-500/30'
              : 'border-white/20 bg-gradient-to-br from-slate-800 to-slate-900 shadow-black/40'
            }
          `}
          style={{ minHeight: '160px', touchAction: 'manipulation' }}
        >
          {/* Card header */}
          <div className="flex justify-between items-center px-5 pt-4 text-[10px] text-white/30 uppercase tracking-wider">
            <span>Secret Card</span>
            <span>🔒 Private</span>
          </div>

          {/* Card body */}
          <AnimatePresence mode="wait">
            {isCardFlipped ? (
              <motion.div
                key="flipped"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="px-5 py-4 text-center"
              >
                <p className="text-[10px] text-primary-300 uppercase font-bold tracking-wider mb-1">Your Word</p>
                <p className="text-3xl sm:text-4xl font-black text-white leading-tight my-2">
                  {myWord?.word || '...'}
                </p>
                {myWord?.isImposter ? (
                  <span className="inline-block text-xs bg-rose-500/20 text-rose-300 px-3 py-1 rounded-full font-bold border border-rose-500/30">
                    😈 You are the Imposter!
                  </span>
                ) : (
                  <span className="inline-block text-xs bg-green-500/20 text-green-300 px-3 py-1 rounded-full font-bold border border-green-500/30">
                    🧑‍🤝‍🧑 Crew Member
                  </span>
                )}
                <p className="text-[10px] text-white/30 mt-3">
                  {myWord?.isImposter
                    ? 'Blend in! Don\'t get caught.'
                    : 'Describe your word without saying it!'}
                </p>
              </motion.div>
            ) : (
              <motion.div
                key="hidden"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="px-5 py-6 text-center"
              >
                <div className="text-4xl mb-2">🎴</div>
                <p className="text-white/70 font-bold text-sm">Tap to Reveal</p>
                <p className="text-white/30 text-xs mt-1">Keep it secret from others!</p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Card footer */}
          <div className="px-5 pb-4 text-[9px] text-white/20 text-center">
            Distributed by Dealer PakadYaar
          </div>
        </motion.div>

        {/* Ready button */}
        <div className="w-full max-w-xs mt-5 space-y-3">
          {!hasConfirmedWord ? (
            <motion.button
              whileTap={{ scale: 0.96 }}
              onClick={() => { sound.click(); confirmWord(); }}
              className="w-full py-3.5 bg-gradient-to-r from-primary-600 to-accent-600 hover:from-primary-500 hover:to-accent-500
                         text-white font-bold rounded-2xl shadow-lg text-sm transition-all"
              style={{ touchAction: 'manipulation' }}
            >
              ✅ I've Seen My Card ({readyCount}/{totalPlayers})
            </motion.button>
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="glass border border-green-500/30 bg-green-500/10 py-3 px-4 rounded-2xl text-center"
            >
              <p className="text-green-400 text-sm font-bold">
                ✅ Ready! Waiting for others…
              </p>
              <p className="text-green-400/60 text-xs mt-0.5">{readyCount}/{totalPlayers} players ready</p>
            </motion.div>
          )}

          {isHost && (
            <motion.button
              whileTap={{ scale: 0.96 }}
              onClick={() => { sound.click(); startDiscussion(); }}
              className="w-full py-3 glass border border-white/20 hover:bg-white/10 text-white font-bold rounded-2xl text-sm transition-all"
              style={{ touchAction: 'manipulation' }}
            >
              {allReady ? '🚀 All Ready — Start Discussion!' : '⏩ Skip & Start Discussion'}
            </motion.button>
          )}
        </div>
      </div>
    </motion.div>
  );
}