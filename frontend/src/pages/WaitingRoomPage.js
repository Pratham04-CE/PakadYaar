import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGame } from '../context/GameContext';
import sound from '../utils/sound';

const CATEGORIES = [
  { id: 'food',       name: 'Food',             emoji: '🍕' },
  { id: 'animals',   name: 'Animals',           emoji: '🐶' },
  { id: 'movies',    name: 'Movies',            emoji: '🎬' },
  { id: 'sports',    name: 'Sports',            emoji: '⚽' },
  { id: 'countries', name: 'Countries',         emoji: '🌍' },
  { id: 'technology',name: 'Technology',        emoji: '📱' },
  { id: 'music',     name: 'Music',             emoji: '🎵' },
  { id: 'games',     name: 'Games',             emoji: '🎮' },
  { id: 'general',   name: 'General Knowledge', emoji: '📚' },
  { id: 'mixed',     name: 'Mixed',             emoji: '🎭' },
];

const DIFFICULTIES = [
  { id: 'all',    name: 'All Levels', emoji: '🎲' },
  { id: 'easy',   name: 'Easy',       emoji: '🟢' },
  { id: 'medium', name: 'Medium',     emoji: '🟡' },
  { id: 'hard',   name: 'Hard',       emoji: '🔴' },
];

const LANGUAGES = [
  { id: 'en', name: 'English', flag: '🇬🇧' },
  { id: 'hi', name: 'Hindi (हिंदी)', flag: '🇮🇳' },
  { id: 'gu', name: 'Gujarati (ગુજરાતી)', flag: '🇮🇳' },
];

export default function WaitingRoomPage() {
  const { room, myId, isHost, updateConfig, startGame, leaveRoom, error } = useGame();
  const [copied, setCopied] = useState(false);

  if (!room) return null;

  function copyCode() {
    navigator.clipboard.writeText(room.code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  function handleConfigChange(key, value) {
    sound.cardSelect();
    updateConfig({ [key]: value });
  }

  const cfg = room.config;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen px-4 py-8"
    >
      <div className="max-w-5xl mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <button onClick={leaveRoom} className="btn-ghost text-sm px-4 py-2">
            ← Leave Room
          </button>
          <h1 className="text-2xl font-bold text-gradient">Game Lobby</h1>
          <div className="w-24" />
        </div>

        {/* Room Code */}
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="glass-strong p-6 mb-6 text-center glow-purple"
        >
          <p className="text-white/50 text-sm mb-2">Room Code — Share with friends</p>
          <div className="flex items-center justify-center gap-4">
            <span className="text-5xl font-black tracking-[0.3em] text-white">
              {room.code}
            </span>
            <button
              onClick={copyCode}
              className="btn-ghost text-sm px-3 py-2"
              title="Copy code"
            >
              {copied ? '✅' : '📋'}
            </button>
          </div>
          {copied && <p className="text-accent-400 text-xs mt-2 animate-pulse">Copied!</p>}
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Players List */}
          <motion.div
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="glass p-6"
          >
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-bold text-white">
                Players <span className="text-white/40">({room.players.length}/10)</span>
              </h2>
              <div className="flex items-center gap-2 text-xs text-green-400">
                <span className="live-dot" />
                Live
              </div>
            </div>

            <div className="space-y-3">
              <AnimatePresence>
                {room.players.map((player, i) => (
                  <motion.div
                    key={player.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ delay: i * 0.05 }}
                    className={`
                      flex items-center gap-3 p-3 rounded-xl border transition-all
                      ${player.id === myId ? 'border-primary-500/40 bg-primary-500/10' : 'border-white/5 bg-white/3'}
                    `}
                  >
                    {/* Avatar */}
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
                      style={{ backgroundColor: player.avatar?.color || '#7c3aed' }}
                    >
                      {player.avatar?.initial || player.name[0].toUpperCase()}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-white truncate">{player.name}</span>
                        {player.id === myId && (
                          <span className="text-xs text-primary-400 bg-primary-500/20 px-2 py-0.5 rounded-full">You</span>
                        )}
                        {player.isHost && (
                          <span className="text-xs text-accent-400 bg-accent-500/20 px-2 py-0.5 rounded-full">👑 Host</span>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>

              {room.players.length < 3 && (
                <p className="text-center text-white/30 text-sm pt-2">
                  Waiting for {3 - room.players.length} more player{3 - room.players.length !== 1 ? 's' : ''}…
                </p>
              )}
            </div>
          </motion.div>

          {/* Config Panel */}
          <motion.div
            initial={{ x: 20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="glass p-6"
          >
            <h2 className="font-bold text-white mb-5">
              Game Settings {!isHost && <span className="text-white/30 font-normal text-sm">(Host only)</span>}
            </h2>

            <div className="space-y-5">
              {/* Category */}
              <div>
                <label className="block text-sm text-white/60 mb-2">Category</label>
                <div className="grid grid-cols-2 gap-2">
                  {CATEGORIES.map(cat => (
                    <button
                      key={cat.id}
                      disabled={!isHost}
                      onClick={() => handleConfigChange('category', cat.id)}
                      className={`
                        flex items-center gap-2 p-2.5 rounded-xl border text-sm font-medium text-left
                        transition-all duration-200
                        ${cfg.category === cat.id
                          ? 'bg-primary-600/30 border-primary-500/60 text-white'
                          : 'border-white/10 text-white/50 hover:border-white/20 hover:text-white/80'
                        }
                        ${!isHost ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                      `}
                    >
                      <span>{cat.emoji}</span>
                      <span className="truncate">{cat.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Difficulty */}
              <div>
                <label className="block text-sm text-white/60 mb-2">Difficulty</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {DIFFICULTIES.map(d => (
                    <button
                      key={d.id}
                      disabled={!isHost}
                      onClick={() => handleConfigChange('difficulty', d.id)}
                      className={`
                        flex items-center justify-center gap-1.5 p-2 rounded-xl border text-xs font-semibold
                        transition-all duration-200
                        ${(cfg.difficulty || 'all') === d.id
                          ? 'bg-accent-600/30 border-accent-500/60 text-white'
                          : 'border-white/10 text-white/50 hover:border-white/20 hover:text-white/80'
                        }
                        ${!isHost ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                      `}
                    >
                      <span>{d.emoji}</span>
                      <span>{d.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Language */}
              <div>
                <label className="block text-sm text-white/60 mb-2">Game Language</label>
                <div className="grid grid-cols-3 gap-2">
                  {LANGUAGES.map(lang => (
                    <button
                      key={lang.id}
                      disabled={!isHost}
                      onClick={() => handleConfigChange('language', lang.id)}
                      className={`
                        flex items-center justify-center gap-2 p-2.5 rounded-xl border text-xs font-semibold
                        transition-all duration-200
                        ${(cfg.language || 'en') === lang.id
                          ? 'bg-primary-600/30 border-primary-500/60 text-white'
                          : 'border-white/10 text-white/50 hover:border-white/20 hover:text-white/80'
                        }
                        ${!isHost ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                      `}
                    >
                      <span>{lang.flag}</span>
                      <span className="truncate">{lang.name}</span>
                    </button>
                  ))}
                </div>
              </div>


              {/* Rounds */}
              <ConfigSlider
                label="Rounds"
                value={cfg.rounds}
                min={1} max={10}
                disabled={!isHost}
                onChange={v => handleConfigChange('rounds', v)}
                display={v => `${v} round${v !== 1 ? 's' : ''}`}
              />

              {/* Imposters */}
              <ConfigSlider
                label="Imposters"
                value={cfg.imposters}
                min={1} max={3}
                disabled={!isHost}
                onChange={v => handleConfigChange('imposters', v)}
                display={v => `${v} imposter${v !== 1 ? 's' : ''}`}
              />

              {/* Discussion Time */}
              <ConfigSlider
                label="Discussion Time"
                value={cfg.discussionTime}
                min={30} max={300} step={30}
                disabled={!isHost}
                onChange={v => handleConfigChange('discussionTime', v)}
                display={v => `${v}s`}
              />

              {/* Voting Time */}
              <ConfigSlider
                label="Voting Time"
                value={cfg.votingTime}
                min={30} max={120} step={15}
                disabled={!isHost}
                onChange={v => handleConfigChange('votingTime', v)}
                display={v => `${v}s`}
              />
            </div>
          </motion.div>
        </div>

        {/* Error */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mt-4 bg-rose-500/20 border border-rose-500/40 rounded-xl px-4 py-3 text-rose-300 text-sm text-center"
            >
              ⚠️ {error}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Start Button */}
        {isHost && (
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="mt-6"
          >
            <button
              id="start-game-btn"
              onClick={startGame}
              disabled={room.players.length < 3}
              className="btn-primary w-full py-5 text-lg flex items-center justify-center gap-3"
            >
              🚀 Start Game
              {room.players.length < 3 && (
                <span className="text-sm text-primary-300 font-normal">
                  (Need {3 - room.players.length} more)
                </span>
              )}
            </button>
          </motion.div>
        )}

        {!isHost && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center text-white/30 mt-6 text-sm"
          >
            Waiting for the host to start the game…
          </motion.p>
        )}
      </div>
    </motion.div>
  );
}

function ConfigSlider({ label, value, min, max, step = 1, disabled, onChange, display }) {
  return (
    <div>
      <div className="flex justify-between mb-2">
        <label className="text-sm text-white/60">{label}</label>
        <span className="text-sm font-semibold text-accent-400">{display(value)}</span>
      </div>
      <input
        type="range"
        min={min} max={max} step={step}
        value={value}
        disabled={disabled}
        onChange={e => onChange(Number(e.target.value))}
        className="w-full h-2 rounded-full appearance-none cursor-pointer
                   bg-white/10 accent-purple-500 disabled:opacity-40 disabled:cursor-not-allowed"
      />
    </div>
  );
}
