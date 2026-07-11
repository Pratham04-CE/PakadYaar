import React from 'react';
import { motion } from 'framer-motion';
import { useGame } from '../context/GameContext';

export default function DiscussionPage() {
  const { room, myWord, timer, myId, drawMessage } = useGame();

  if (!room) return null;

  const remaining = timer?.remaining ?? 0;
  const total = timer?.total ?? room?.config?.discussionTime ?? 120;
  const progress = remaining / total;
  const isUrgent = remaining <= 15;

  const circumference = 2 * Math.PI * 80;
  const strokeDashoffset = circumference * (1 - progress);

  const formatTime = (s) => {
    const m = Math.floor(s / 60).toString().padStart(2, '0');
    const sec = (s % 60).toString().padStart(2, '0');
    return `${m}:${sec}`;
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen px-4 py-8"
    >
      <div className="max-w-4xl mx-auto">

        {/* Header */}
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="text-center mb-8"
        >
          <div className="inline-flex items-center gap-2 bg-accent-600/20 border border-accent-500/30 rounded-full px-4 py-1.5 text-accent-300 text-sm mb-3">
            <span className="live-dot" />
            Round {room.currentRound} of {room.totalRounds} — Discussion Phase
          </div>
          <h1 className="text-3xl font-bold text-white">Time to Discuss!</h1>
          <p className="text-white/40 mt-2 text-sm">
            Describe your word without saying it. Listen for inconsistencies.
          </p>
        </motion.div>

        {/* Draw message banner */}
        {drawMessage && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass border-yellow-500/40 bg-yellow-500/10 p-4 text-center mb-6 rounded-xl"
          >
            <span className="text-yellow-300 font-semibold">⚖️ {drawMessage}</span>
          </motion.div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Timer — center column on desktop */}
          <div className="lg:col-span-1 flex flex-col items-center">
            <div className="glass-strong p-8 flex flex-col items-center gap-4 w-full">
              {/* Circular timer */}
              <div className="relative w-48 h-48">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 200 200">
                  {/* Background circle */}
                  <circle
                    cx="100" cy="100" r="80"
                    fill="none"
                    stroke="rgba(255,255,255,0.05)"
                    strokeWidth="12"
                  />
                  {/* Progress circle */}
                  <motion.circle
                    cx="100" cy="100" r="80"
                    fill="none"
                    stroke={isUrgent ? '#f43f5e' : '#06b6d4'}
                    strokeWidth="12"
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    style={{ transition: 'stroke-dashoffset 1s linear, stroke 0.5s ease' }}
                  />
                </svg>
                {/* Time text */}
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <motion.span
                    key={remaining}
                    className={`text-4xl font-black tabular-nums ${isUrgent ? 'text-rose-400' : 'text-white'}`}
                    animate={isUrgent ? { scale: [1, 1.05, 1] } : {}}
                    transition={{ repeat: Infinity, duration: 1 }}
                  >
                    {formatTime(remaining)}
                  </motion.span>
                  <span className="text-white/40 text-xs mt-1">remaining</span>
                </div>
              </div>

              <div className="text-center">
                <p className="text-white/60 text-sm">🗣️ Discussion Phase</p>
                {isUrgent && (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-rose-400 text-xs mt-1 animate-pulse"
                  >
                    Voting starts soon!
                  </motion.p>
                )}
              </div>
            </div>

            {/* My word reminder */}
            {myWord && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="mt-4 w-full glass p-4 text-center"
              >
                <p className="text-white/40 text-xs mb-1">Your word</p>
                <p className="text-xl font-bold text-primary-300">{myWord.word}</p>
              </motion.div>
            )}
          </div>

          {/* Players */}
          <div className="lg:col-span-2">
            <div className="glass p-6 h-full">
              <h2 className="font-bold text-white mb-5">
                Players <span className="text-white/40 font-normal text-sm">— {room.players.length} in room</span>
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {room.players.map((player, i) => (
                  <motion.div
                    key={player.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className={`
                      flex items-center gap-3 p-4 rounded-xl border transition-all
                      ${player.id === myId
                        ? 'border-primary-500/40 bg-primary-500/10'
                        : 'border-white/5 bg-white/3'
                      }
                    `}
                  >
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
                      style={{ backgroundColor: player.avatar?.color || '#7c3aed' }}
                    >
                      {player.avatar?.initial || player.name[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-white">{player.name}</span>
                        {player.id === myId && (
                          <span className="text-xs text-primary-400 bg-primary-500/20 px-1.5 py-0.5 rounded-full">You</span>
                        )}
                        {player.isHost && (
                          <span className="text-xs text-accent-400">👑</span>
                        )}
                      </div>
                      <div className="text-xs text-white/30 mt-0.5">
                        Score: {player.score || 0} pts
                      </div>
                    </div>
                    {/* Talking indicator (decorative) */}
                    <div className="flex gap-0.5 items-end h-4">
                      {[1, 2, 3].map(b => (
                        <motion.div
                          key={b}
                          className="w-1 bg-accent-500/50 rounded-full"
                          animate={{ height: [`${b * 4}px`, `${12 - b * 2}px`, `${b * 4}px`] }}
                          transition={{ repeat: Infinity, duration: 0.8 + b * 0.2, ease: 'easeInOut' }}
                        />
                      ))}
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Rules reminder */}
              <div className="mt-6 p-4 bg-white/3 rounded-xl border border-white/5">
                <p className="text-xs text-white/40 font-semibold uppercase tracking-widest mb-2">Rules</p>
                <ul className="text-xs text-white/40 space-y-1">
                  <li>• Never reveal your secret word directly</li>
                  <li>• Describe it without saying the word itself</li>
                  <li>• Listen carefully for inconsistencies</li>
                  <li>• When timer ends, voting begins automatically</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
