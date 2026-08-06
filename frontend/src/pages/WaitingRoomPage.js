import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGame } from '../context/GameContext';
import { REGIONAL_THEMES } from '../data/themes';
import PlayerAvatar from '../components/PlayerAvatar';
import sound from '../utils/sound';

const CATEGORIES = [
  { id: 'food', name: 'Food', emoji: '🍕' },
  { id: 'animals', name: 'Animals', emoji: '🐶' },
  { id: 'movies', name: 'Movies', emoji: '🎬' },
  { id: 'sports', name: 'Sports', emoji: '⚽' },
  { id: 'cities', name: 'Cities', emoji: '🏙️' },
  { id: 'technology', name: 'Tech', emoji: '📱' },
  { id: 'music', name: 'Music', emoji: '🎵' },
  { id: 'games', name: 'Games', emoji: '🎮' },
  { id: 'general', name: 'General', emoji: '📚' },
  { id: 'mixed', name: 'Mixed', emoji: '🎭' },
];

const DIFFICULTIES = [
  { id: 'all', name: 'All', emoji: '🎲' },
  { id: 'easy', name: 'Easy', emoji: '🟢' },
  { id: 'medium', name: 'Medium', emoji: '🟡' },
  { id: 'hard', name: 'Hard', emoji: '🔴' },
];

const LANGUAGES = [
  { id: 'en', name: 'English', flag: '🇬🇧' },
  { id: 'hi', name: 'Hindi (हिंदी)', flag: '🇮🇳' },
  { id: 'gu', name: 'Gujarati (ગુજરાતી)', flag: '🇮🇳' },
];

const QUICK_EMOJIS = ['😀', '😂', '🔥', '👍', '😎', '🎉', '😱', '💩'];

export default function WaitingRoomPage() {
  const { 
    room, myId, isHost, updateConfig, startGame, error, 
    lobbyMessages, typingUsers, 
    sendLobbyMessage, setTypingStatus, kickPlayer 
  } = useGame();
  
  const [copied, setCopied] = useState(false);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const chatBottomRef = useRef(null);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [lobbyMessages]);

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

  function handleInputChange(e) {
    const val = e.target.value;
    setChatInput(val);
    setTypingStatus(val.length > 0);
  }

  function handleSendChat(e) {
    e.preventDefault();
    if (!chatInput.trim()) return;
    sendLobbyMessage(chatInput);
    setChatInput('');
    setTypingStatus(false);
    sound.click();
  }

  function addEmoji(emoji) {
    setChatInput(prev => prev + emoji);
    setTypingStatus(true);
    sound.click();
  }

  const cfg = room.config;
  const currentThemeKey = cfg.theme || 'gujarat';
  const currentTheme = REGIONAL_THEMES[currentThemeKey] || REGIONAL_THEMES.gujarat;
  const typingNames = Object.values(typingUsers || {});

  const currentCategoryObj = CATEGORIES.find(c => c.id === cfg.category) || CATEGORIES[0];
  const currentLangObj = LANGUAGES.find(l => l.id === (cfg.language || 'en')) || LANGUAGES[0];
  const currentDiffObj = DIFFICULTIES.find(d => d.id === (cfg.difficulty || 'all')) || DIFFICULTIES[0];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className={`min-h-screen bg-gradient-to-b ${currentTheme.bgStyle} transition-colors duration-500`}
      style={{ paddingTop: '64px', paddingBottom: '32px' }}
    >
      <div className="max-w-2xl mx-auto px-3 sm:px-4">

        {/* Header Title */}
        <div className="text-center mb-4">
          <h1 className="text-xl sm:text-2xl font-black text-gradient">Game Lobby</h1>
          <p className="text-white/60 text-xs mt-0.5">
            📍 Venue: <span className="text-accent-400 font-bold">{currentTheme.name}</span>
            {currentTheme.tagline ? ` (${currentTheme.tagline})` : currentTheme.landmark ? ` (${currentTheme.landmark})` : ''}
          </p>
        </div>

        {/* Room Code */}
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className={`glass-strong p-4 mb-4 text-center rounded-2xl border ${currentTheme.tableBorder}`}
        >
          <p className="text-white/50 text-xs mb-1">Share this code with friends</p>
          <div className="flex items-center justify-center gap-3">
            <span className="text-3xl sm:text-4xl font-black tracking-[0.25em] text-white">
              {room.code}
            </span>
            <button
              onClick={copyCode}
              className="w-9 h-9 rounded-xl glass flex items-center justify-center text-lg border border-white/25 active:scale-95 transition-all cursor-pointer"
              style={{ touchAction: 'manipulation', flexShrink: 0 }}
            >
              {copied ? '✅' : '📋'}
            </button>
          </div>
          {copied && <p className="text-accent-400 text-xs mt-1 animate-pulse">Copied to clipboard!</p>}
        </motion.div>

        {/* Active Game Settings Field Card */}
        <motion.div
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.05 }}
          className="glass p-3.5 mb-4 rounded-2xl border border-white/10 flex flex-col gap-2.5 shadow-lg"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
              <span>🎯</span> Active Game Configuration
            </span>
            {isHost ? (
              <button
                onClick={() => { sound.click(); setShowConfigModal(true); }}
                className="px-3 py-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold transition-all shadow cursor-pointer active:scale-95 flex items-center gap-1"
                style={{ touchAction: 'manipulation' }}
              >
                <span>⚙️</span> Host Settings
              </button>
            ) : (
              <button
                onClick={() => { sound.click(); setShowConfigModal(true); }}
                className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition-all border border-white/10 cursor-pointer active:scale-95 flex items-center gap-1"
                style={{ touchAction: 'manipulation' }}
              >
                <span>👁️</span> View Settings
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
            <div className="p-2 rounded-xl bg-white/5 border border-white/5">
              <span className="text-white/40 block text-[10px]">Venue</span>
              <span className="font-bold text-amber-300 truncate block">{currentTheme.cardSkin?.icon || '🏛️'} {currentTheme.name}</span>
            </div>
            <div className="p-2 rounded-xl bg-white/5 border border-white/5">
              <span className="text-white/40 block text-[10px]">Category</span>
              <span className="font-bold text-white truncate block">{currentCategoryObj.emoji} {currentCategoryObj.name}</span>
            </div>
            <div className="p-2 rounded-xl bg-white/5 border border-white/5">
              <span className="text-white/40 block text-[10px]">Language</span>
              <span className="font-bold text-white truncate block">{currentLangObj.flag} {currentLangObj.name}</span>
            </div>
            <div className="p-2 rounded-xl bg-white/5 border border-white/5">
              <span className="text-white/40 block text-[10px]">Difficulty</span>
              <span className="font-bold text-white truncate block">{currentDiffObj.emoji} {currentDiffObj.name}</span>
            </div>
          </div>
        </motion.div>

        {/* Players List */}
        <motion.div
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="glass p-4 mb-4 rounded-2xl"
        >
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold text-white text-sm flex items-center gap-2">
              Players In Room
              <span className="text-white/40 font-normal">({room.players.length}/10)</span>
            </h2>
            <div className="flex items-center gap-1.5 text-xs text-green-400">
              <span className="live-dot" />
              Live Table
            </div>
          </div>

          <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
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
                  <PlayerAvatar avatar={player.avatar} name={player.name} className="w-9 h-9" />

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-semibold text-white text-sm truncate max-w-[140px]">
                        {player.name}
                      </span>
                      {player.id === myId && (
                        <span className="badge bg-primary-500/20 text-primary-400 text-[10px] px-1.5 py-0.5 rounded">You</span>
                      )}
                      {player.isHost && (
                        <span className="badge bg-accent-500/20 text-accent-400 text-[10px] px-1.5 py-0.5 rounded">👑 Host</span>
                      )}
                    </div>
                  </div>

                  {isHost && player.id !== myId && (
                    <button
                      onClick={() => kickPlayer(player.id)}
                      className="text-xs text-rose-400 hover:text-rose-300 ml-2 cursor-pointer"
                    >
                      ✕
                    </button>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {room.players.length < 3 && (
            <p className="text-center text-amber-300/80 text-xs pt-3 font-medium">
              ⚠️ Need at least {3 - room.players.length} more player{3 - room.players.length !== 1 ? 's' : ''} to start game.
            </p>
          )}
        </motion.div>

        {/* --- Lobby Chat & Emojis Section --- */}
        <motion.div
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.15 }}
          className="glass p-4 mb-4 rounded-2xl flex flex-col h-64"
        >
          <h3 className="font-bold text-white text-xs uppercase tracking-wider mb-2 text-white/60">
            💬 Lobby Chat & Emojis
          </h3>

          <div className="flex-1 overflow-y-auto space-y-2 pr-1 mb-2 bg-black/20 p-3 rounded-xl border border-white/5">
            {lobbyMessages.length === 0 ? (
              <p className="text-white/30 text-xs text-center py-8 italic">No messages yet. Say hello or send an emoji! 👋</p>
            ) : (
              lobbyMessages.map((msg, index) => (
                <div key={index} className="text-xs">
                  <span className="font-bold text-primary-300 mr-1.5">{msg.name}:</span>
                  <span className="text-white/90 break-words">{msg.text}</span>
                  <span className="text-[9px] text-white/30 ml-2 float-right">{msg.time}</span>
                </div>
              ))
            )}
            <div ref={chatBottomRef} />
          </div>

          {typingNames.length > 0 && (
            <div className="text-[11px] text-amber-300/80 italic mb-1 px-1 flex items-center gap-1.5 animate-pulse">
              <span>✍️</span>
              <span>{typingNames.join(', ')} {typingNames.length === 1 ? 'is' : 'are'} typing...</span>
            </div>
          )}

          <div className="flex gap-1 mb-2 overflow-x-auto py-1 no-scrollbar">
            {QUICK_EMOJIS.map((emoji, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => addEmoji(emoji)}
                className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/15 flex items-center justify-center text-sm transition-all active:scale-95 cursor-pointer flex-shrink-0"
              >
                {emoji}
              </button>
            ))}
          </div>

          <form onSubmit={handleSendChat} className="flex gap-2">
            <input
              type="text"
              value={chatInput}
              onChange={handleInputChange}
              onBlur={() => setTypingStatus(false)}
              placeholder="Type message or emoji..."
              className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-white/30 focus:outline-none focus:border-primary-500"
            />
            <button
              type="submit"
              className="px-4 py-2 bg-primary-600 hover:bg-primary-500 text-white rounded-xl text-xs font-bold transition-all cursor-pointer active:scale-95 flex-shrink-0"
            >
              Send 🚀
            </button>
          </form>
        </motion.div>

        {/* Error message */}
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

        {/* Start Game Button */}
        {isHost ? (
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <button
              id="start-game-btn"
              onClick={startGame}
              disabled={room.players.length < 3}
              className="btn-primary w-full py-4 text-base flex items-center justify-center gap-2 cursor-pointer shadow-xl"
              style={{ touchAction: 'manipulation' }}
            >
              🚀 Start Game ({currentTheme.name} Vibe)
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
            className="text-center text-white/40 text-sm font-medium py-3"
          >
            ⏳ Waiting for the host to start the game...
          </motion.p>
        )}

      </div>

      {/* --- Center Popup Box Modal for Game Settings --- */}
      <AnimatePresence>
        {showConfigModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-3 sm:p-4"
            onClick={() => setShowConfigModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.9, y: 20, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="w-full max-w-sm sm:max-w-md bg-slate-900/95 border border-purple-500/40 rounded-2xl p-4 sm:p-5 shadow-2xl relative max-h-[85vh] overflow-y-auto"
              onClick={e => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-white/10">
                <h2 className="font-black text-white text-base flex items-center gap-2">
                  <span>⚙️</span> Game Settings & Filters
                  {!isHost && <span className="text-amber-400 font-normal text-xs">(Read Only)</span>}
                </h2>
                <button
                  onClick={() => { sound.click(); setShowConfigModal(false); }}
                  className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white/70 hover:text-white flex items-center justify-center text-sm font-bold transition-all cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-3.5">
                
                {/* --- Indian Venue Dropdown --- */}
                <div>
                  <label className="block text-xs text-white/60 mb-1.5 font-medium">🇮🇳 Choose Indian Venue & Vibe</label>
                  <select
                    disabled={!isHost}
                    value={currentThemeKey}
                    onChange={e => handleConfigChange('theme', e.target.value)}
                    className="w-full bg-slate-800/90 border border-purple-500/40 rounded-xl px-3 py-2 text-xs font-semibold text-white focus:outline-none focus:border-purple-400 disabled:opacity-50"
                  >
                    {Object.entries(REGIONAL_THEMES).map(([key, theme]) => {
                      const detail = theme.tagline || theme.landmark || theme.festival;
                      const icon = theme.cardSkin?.icon ? `${theme.cardSkin.icon} ` : '';
                      return (
                        <option key={key} value={key} className="bg-slate-900 text-white">
                          {icon}{theme.name}{detail ? ` (${detail})` : ''}
                        </option>
                      );
                    })}
                  </select>
                </div>

                {/* Category Dropdown */}
                <div>
                  <label className="block text-xs text-white/60 mb-1.5 font-medium">Category</label>
                  <select
                    disabled={!isHost}
                    value={cfg.category}
                    onChange={e => handleConfigChange('category', e.target.value)}
                    className="w-full bg-slate-800/90 border border-purple-500/40 rounded-xl px-3 py-2 text-xs font-semibold text-white focus:outline-none focus:border-purple-400 disabled:opacity-50"
                  >
                    {CATEGORIES.map(cat => (
                      <option key={cat.id} value={cat.id} className="bg-slate-900 text-white">
                        {cat.emoji} {cat.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Difficulty Dropdown */}
                <div>
                  <label className="block text-xs text-white/60 mb-1.5 font-medium">Difficulty</label>
                  <select
                    disabled={!isHost}
                    value={cfg.difficulty || 'all'}
                    onChange={e => handleConfigChange('difficulty', e.target.value)}
                    className="w-full bg-slate-800/90 border border-purple-500/40 rounded-xl px-3 py-2 text-xs font-semibold text-white focus:outline-none focus:border-purple-400 disabled:opacity-50"
                  >
                    {DIFFICULTIES.map(d => (
                      <option key={d.id} value={d.id} className="bg-slate-900 text-white">
                        {d.emoji} {d.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Language Dropdown */}
                <div>
                  <label className="block text-xs text-white/60 mb-1.5 font-medium">Language</label>
                  <select
                    disabled={!isHost}
                    value={cfg.language || 'en'}
                    onChange={e => handleConfigChange('language', e.target.value)}
                    className="w-full bg-slate-800/90 border border-purple-500/40 rounded-xl px-3 py-2 text-xs font-semibold text-white focus:outline-none focus:border-purple-400 disabled:opacity-50"
                  >
                    {LANGUAGES.map(lang => (
                      <option key={lang.id} value={lang.id} className="bg-slate-900 text-white">
                        {lang.flag} {lang.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Step Counter Controls (+ / - Buttons) */}
                <StepCounter
                  label="Rounds"
                  value={cfg.rounds}
                  min={1} max={10}
                  disabled={!isHost}
                  onChange={v => handleConfigChange('rounds', v)}
                  display={v => `${v} round${v !== 1 ? 's' : ''}`}
                />

                <StepCounter
                  label="Imposters"
                  value={cfg.imposters}
                  min={1} max={3}
                  disabled={!isHost}
                  onChange={v => handleConfigChange('imposters', v)}
                  display={v => `${v} imposter${v !== 1 ? 's' : ''}`}
                />

                <StepCounter
                  label="Discussion Time"
                  value={cfg.discussionTime}
                  min={30} max={300} step={30}
                  disabled={!isHost}
                  onChange={v => handleConfigChange('discussionTime', v)}
                  display={v => `${v}s`}
                />

                <StepCounter
                  label="Voting Time"
                  value={cfg.votingTime}
                  min={30} max={120} step={15}
                  disabled={!isHost}
                  onChange={v => handleConfigChange('votingTime', v)}
                  display={v => `${v}s`}
                />
              </div>

              {/* Close Button */}
              <button
                onClick={() => { sound.click(); setShowConfigModal(false); }}
                className="btn-primary w-full py-3 mt-4 text-xs font-bold rounded-xl cursor-pointer shadow-lg"
              >
                ✓ Apply & Close
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function StepCounter({ label, value, min, max, step = 1, disabled, onChange, display }) {
  return (
    <div className="flex items-center justify-between p-2.5 bg-black/40 rounded-xl border border-white/10">
      <div>
        <span className="text-xs font-semibold text-white/80 block">{label}</span>
        <span className="text-[10px] text-amber-400 font-bold">{display(value)}</span>
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          disabled={disabled || value <= min}
          onClick={() => { sound.click(); onChange(Math.max(min, value - step)); }}
          className="w-8 h-8 rounded-lg bg-purple-600/40 hover:bg-purple-600 border border-purple-400/40 text-white font-black text-base flex items-center justify-center disabled:opacity-20 disabled:cursor-not-allowed cursor-pointer active:scale-95 shadow"
        >
          -
        </button>
        <span className="text-xs font-black text-white w-8 text-center">{value}</span>
        <button
          type="button"
          disabled={disabled || value >= max}
          onClick={() => { sound.click(); onChange(Math.min(max, value + step)); }}
          className="w-8 h-8 rounded-lg bg-purple-600/40 hover:bg-purple-600 border border-purple-400/40 text-white font-black text-base flex items-center justify-center disabled:opacity-20 disabled:cursor-not-allowed cursor-pointer active:scale-95 shadow"
        >
          +
        </button>
      </div>
    </div>
  );
}