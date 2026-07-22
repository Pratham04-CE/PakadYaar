import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGame } from '../context/GameContext';
import sound from '../utils/sound';

const CATEGORIES = [
  { id: 'food',        name: 'Food',             emoji: '🍕' },
  { id: 'animals',     name: 'Animals',           emoji: '🐶' },
  { id: 'movies',      name: 'Movies',            emoji: '🎬' },
  { id: 'sports',      name: 'Sports',            emoji: '⚽' },
  { id: 'countries',   name: 'Countries',         emoji: '🌍' },
  { id: 'technology',  name: 'Tech',              emoji: '📱' },
  { id: 'music',       name: 'Music',             emoji: '🎵' },
  { id: 'games',       name: 'Games',             emoji: '🎮' },
  { id: 'general',     name: 'General',           emoji: '📚' },
  { id: 'mixed',       name: 'Mixed',             emoji: '🎭' },
];

const DIFFICULTIES = [
  { id: 'all',    name: 'All',    emoji: '🎲' },
  { id: 'easy',   name: 'Easy',   emoji: '🟢' },
  { id: 'medium', name: 'Medium', emoji: '🟡' },
  { id: 'hard',   name: 'Hard',   emoji: '🔴' },
];

const LANGUAGES = [
  { id: 'en', name: 'English',  flag: '🇬🇧' },
  { id: 'hi', name: 'Hindi',    flag: '🇮🇳' },
  { id: 'gu', name: 'Gujarati', flag: '🇮🇳' },
];

export default function WaitingRoomPage() {
  const { room, myId, isHost, updateConfig, startGame, leaveRoom, kickPlayer, error, isMicOn, peerMutedMap } = useGame();
  const [copied, setCopied] = useState(false);
  const [showConfig, setShowConfig] = useState(false);

  if (!room) return null;

  function copyCode() {
    navigator.clipboard.writeText(room.code).then(() => {
      setCopied(true);
      sound.click();
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
      className="min-h-screen"
      style={{ paddingTop: '64px', paddingBottom: '24px' }}
    >
      <div className="max-w-2xl mx-auto px-3 sm:px-4">

        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={leaveRoom}
            className="btn-ghost text-xs px-3 py-2"
            style={{ touchAction: 'manipulation' }}
          >
            ← Quit
          </button>
          <h1 className="text-lg font-black text-gradient">Game Lobby</h1>
          <div className="w-16" />
        </div>

        {/* Room Code */}
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="glass-strong p-4 mb-4 text-center glow-purple"
        >
          <p className="text-white/50 text-xs mb-1">Share this code with friends</p>
          <div className="flex items-center justify-center gap-3">
            <span className="text-3xl sm:text-4xl font-black tracking-[0.25em] text-white">
              {room.code}
            </span>
            <button
              onClick={copyCode}
              className="w-9 h-9 rounded-xl glass flex items-center justify-center text-lg border border-white/20 active:scale-95 transition-all"
              style={{ touchAction: 'manipulation', flexShrink: 0 }}
            >
              {copied ? '✅' : '📋'}
            </button>
          </div>
          {copied && <p className="text-accent-400 text-xs mt-1 animate-pulse">Copied!</p>}
        </motion.div>

        {/* Players List */}
        <motion.div
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="glass p-4 mb-4"
        >
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold text-white text-sm flex items-center gap-2">
              Players
              <span className="text-white/40 font-normal">({room.players.length}/10)</span>
            </h2>
            <div className="flex items-center gap-1.5 text-xs text-green-400">
              <span className="live-dot" />
              Live
            </div>
          </div>

          <div className="space-y-2">
            <AnimatePresence>
              {room.players.map((player, i) => (
                <motion.div
                  key={player.id}
                  initial={{ opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 16 }}
                  transition={{ delay: i * 0.04 }}
                  className={`
                    flex items-center gap-2.5 p-2.5 rounded-xl border transition-all
                    ${player.id === myId ? 'border-primary-500/40 bg-primary-500/10' : 'border-white/5 bg-white/3'}
                  `}
                >
                  {/* Avatar */}
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
                    style={{ backgroundColor: player.avatar?.color || '#7c3aed' }}
                  >
                    {player.avatar?.initial || player.name[0].toUpperCase()}
                  </div>

                  {/* Name + badges */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-semibold text-white text-sm truncate max-w-[120px]">
                        {player.name}
                      </span>
                      {player.id === myId && (
                        <span className="badge bg-primary-500/20 text-primary-400">You</span>
                      )}
                      {player.isHost && (
                        <span className="badge bg-accent-500/20 text-accent-400">👑</span>
                      )}
                    </div>
                  </div>

                  {/* Mic status */}
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full flex-shrink-0 ${
                    (player.id === myId ? isMicOn : peerMutedMap[player.id] === false)
                      ? 'bg-green-500/20 text-green-400'
                      : 'bg-white/5 text-white/30'
                  }`}>
                    {(player.id === myId ? isMicOn : peerMutedMap[player.id] === false) ? '🎤' : '🔇'}
                  </span>

                  {/* Kick button (host only, not self) */}
                  {isHost && player.id !== myId && (
                    <button
                      onClick={() => {
                        sound.click();
                        kickPlayer(player.id);
                      }}
                      className="w-7 h-7 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center justify-center hover:bg-rose-500/20 transition-all active:scale-95 flex-shrink-0"
                      title={`Kick ${player.name}`}
                      style={{ touchAction: 'manipulation' }}
                    >
                      ✕
                    </button>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>

            {room.players.length < 3 && (
              <p className="text-center text-white/30 text-xs pt-2">
                Need {3 - room.players.length} more player{3 - room.players.length !== 1 ? 's' : ''} to start
              </p>
            )}
          </div>
        </motion.div>

        {/* Config Panel — collapsible */}
        <motion.div
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="glass p-4 mb-4"
        >
          <button
            onClick={() => setShowConfig(v => !v)}
            className="w-full flex items-center justify-between"
            style={{ touchAction: 'manipulation' }}
          >
            <h2 className="font-bold text-white text-sm">
              ⚙️ Game Settings
              {!isHost && <span className="text-white/30 font-normal text-xs ml-2">(Host only)</span>}
            </h2>
            <span className="text-white/40 text-xs">{showConfig ? '▲ Hide' : '▼ Show'}</span>
          </button>

          <AnimatePresence>
            {showConfig && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="space-y-4 mt-4 pt-4 border-t border-white/10">
                  {/* Category */}
                  <div>
                    <label className="block text-xs text-white/60 mb-2 font-medium">Category</label>
                    <div className="grid grid-cols-2 gap-1.5">
                      {CATEGORIES.map(cat => (
                        <button
                          key={cat.id}
                          disabled={!isHost}
                          onClick={() => handleConfigChange('category', cat.id)}
                          style={{ touchAction: 'manipulation' }}
                          className={`
                            flex items-center gap-1.5 p-2 rounded-xl border text-xs font-medium text-left
                            transition-all duration-150 active:scale-95
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
                    <label className="block text-xs text-white/60 mb-2 font-medium">Difficulty</label>
                    <div className="grid grid-cols-4 gap-1.5">
                      {DIFFICULTIES.map(d => (
                        <button
                          key={d.id}
                          disabled={!isHost}
                          onClick={() => handleConfigChange('difficulty', d.id)}
                          style={{ touchAction: 'manipulation' }}
                          className={`
                            flex flex-col items-center justify-center gap-0.5 p-2 rounded-xl border text-[10px] font-semibold
                            transition-all duration-150 active:scale-95
                            ${(cfg.difficulty || 'all') === d.id
                              ? 'bg-accent-600/30 border-accent-500/60 text-white'
                              : 'border-white/10 text-white/50 hover:border-white/20 hover:text-white/80'
                            }
                            ${!isHost ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                          `}
                        >
                          <span className="text-base">{d.emoji}</span>
                          <span>{d.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Language */}
                  <div>
                    <label className="block text-xs text-white/60 mb-2 font-medium">Language</label>
                    <div className="grid grid-cols-3 gap-1.5">
                      {LANGUAGES.map(lang => (
                        <button
                          key={lang.id}
                          disabled={!isHost}
                          onClick={() => handleConfigChange('language', lang.id)}
                          style={{ touchAction: 'manipulation' }}
                          className={`
                            flex items-center justify-center gap-1.5 p-2 rounded-xl border text-xs font-semibold
                            transition-all duration-150 active:scale-95
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
            )}
          </AnimatePresence>
        </motion.div>

        {/* Error */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mb-4 bg-rose-500/20 border border-rose-500/40 rounded-xl px-4 py-3 text-rose-300 text-sm text-center"
            >
              ⚠️ {error}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Start Button / Waiting message */}
        {isHost ? (
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <button
              id="start-game-btn"
              onClick={startGame}
              disabled={room.players.length < 3}
              className="btn-primary w-full py-4 text-base flex items-center justify-center gap-2"
              style={{ touchAction: 'manipulation' }}
            >
              🚀 Start Game
              {room.players.length < 3 && (
                <span className="text-sm text-primary-300 font-normal">
                  (Need {3 - room.players.length} more)
                </span>
              )}
            </button>
          </motion.div>
        ) : (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center text-white/30 text-sm"
          >
            Waiting for the host to start…
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
        <label className="text-xs text-white/60">{label}</label>
        <span className="text-xs font-bold text-accent-400">{display(value)}</span>
      </div>
      <input
        type="range"
        min={min} max={max} step={step}
        value={value}
        disabled={disabled}
        onChange={e => onChange(Number(e.target.value))}
        className="w-full h-2 rounded-full appearance-none cursor-pointer
                   bg-white/10 accent-purple-500 disabled:opacity-40 disabled:cursor-not-allowed"
        style={{ touchAction: 'none' }}
      />
    </div>
  );
}
