import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGame } from '../context/GameContext';
import wordsData from '../data/words.json';
import sound from '../utils/sound';

function resolveWordInfo(myWord, roomConfig = {}) {
  if (!myWord) return null;
  const lang = roomConfig?.language || 'en';
  let wordText = myWord.word || '';
  let meaningText = myWord.meaningText || '';
  let translationText = myWord.translationText || '';
  let hints = Array.isArray(myWord.hints) && myWord.hints.length > 0 ? myWord.hints : [];
  let translations = myWord.translations || {};

  if (!meaningText || hints.length === 0) {
    for (const cat in wordsData) {
      for (const pair of wordsData[cat]) {
        const matchWord = pair.word?.text === wordText ? pair.word : pair.imposterWord?.text === wordText ? pair.imposterWord : null;
        if (matchWord) {
          meaningText = meaningText || matchWord.meaning?.[lang] || matchWord.meaning?.en || '';
          hints = hints.length > 0 ? hints : (matchWord.hints || []);
          translations = Object.keys(translations).length > 0 ? translations : (matchWord.translations || {});
          break;
        }
      }
      if (meaningText && hints.length > 0) break;
    }
  }

  if (!translationText && translations) {
    translationText = translations[lang] || translations.hi || translations.gu || '';
  }

  return { word: wordText, meaningText, translationText, translations, hints };
}

export default function DiscussionPage() {
  const { room, myWord, timer, myId, drawMessage, isMicOn, peerMutedMap, isCardDisabled } = useGame();
  const [showDetails, setShowDetails] = useState(false);
  const [isCardRevealed, setIsCardRevealed] = useState(false);

  if (!room) return null;

  const wordInfo = resolveWordInfo(myWord, room.config);
  const remaining = timer?.remaining ?? 0;
  const total = timer?.total ?? room?.config?.discussionTime ?? 120;
  const progress = remaining / total;
  const isUrgent = remaining <= 15;

  const circumference = 2 * Math.PI * 44;
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
      className="min-h-screen"
      style={{ paddingTop: '64px', paddingBottom: '24px' }}
    >
      <div className="max-w-2xl mx-auto px-3 sm:px-4">

        {/* Draw message */}
        {drawMessage && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass border-yellow-500/40 bg-yellow-500/10 p-3 text-center mb-4 rounded-xl"
          >
            <span className="text-yellow-300 font-semibold text-sm">⚖️ {drawMessage}</span>
          </motion.div>
        )}

        {/* ── Header row: badge + timer ── */}
        <div className="flex items-center justify-between mb-4 gap-3">
          <div className="flex-1 min-w-0">
            <div className="inline-flex items-center gap-1.5 bg-accent-600/20 border border-accent-500/30 rounded-full px-3 py-1 text-accent-300 text-xs">
              <span className="live-dot" />
              <span className="truncate">Round {room.currentRound}/{room.totalRounds} — Discussion</span>
            </div>
            <h1 className="text-lg sm:text-xl font-bold text-white mt-1">Discussion Table 🗣️</h1>
          </div>

          {/* Compact circular timer */}
          <div className="relative w-16 h-16 flex-shrink-0">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="44" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="8" />
              <motion.circle
                cx="50" cy="50" r="44" fill="none"
                stroke={isUrgent ? '#f43f5e' : '#06b6d4'}
                strokeWidth="8" strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                style={{ transition: 'stroke-dashoffset 1s linear, stroke 0.5s ease' }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className={`text-sm font-black tabular-nums leading-none ${isUrgent ? 'text-rose-400' : 'text-white'}`}>
                {formatTime(remaining)}
              </span>
            </div>
          </div>
        </div>

        {/* ── My Secret Card ── */}
        <div className="glass p-4 mb-4 rounded-2xl">
          <p className="text-xs uppercase text-white/40 tracking-wider mb-3 font-semibold">🃏 Your Secret Card</p>

          {isCardDisabled ? (
            <div className="p-3 bg-red-500/20 border border-red-500/30 rounded-xl text-red-300 text-sm font-semibold text-center">
              🔒 Card locked during voting
            </div>
          ) : (
            <>
              <motion.div
                onClick={() => { sound.cardFlip(); setIsCardRevealed(v => !v); }}
                className={`p-4 rounded-xl cursor-pointer border transition-all duration-300 text-center ${
                  isCardRevealed
                    ? 'bg-primary-600/20 border-primary-500'
                    : 'bg-white/5 border-white/10 hover:bg-white/8'
                }`}
                style={{ touchAction: 'manipulation' }}
                whileTap={{ scale: 0.97 }}
              >
                <p className="text-xs font-bold text-primary-300 mb-2">
                  {isCardRevealed ? '👁 Tap to Hide' : '🎴 Tap to Reveal Card'}
                </p>
                <AnimatePresence mode="wait">
                  {isCardRevealed && wordInfo ? (
                    <motion.div key="revealed" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                      <div className="text-2xl sm:text-3xl font-black text-white">{wordInfo.word}</div>
                      {myWord?.isImposter && (
                        <span className="text-xs text-rose-400 mt-1 block">😈 Imposter Card</span>
                      )}
                    </motion.div>
                  ) : (
                    <motion.span key="hidden" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                      className="text-xs text-white/40">Face down on table</motion.span>
                  )}
                </AnimatePresence>
              </motion.div>

              {/* Hints accordion */}
              {wordInfo && (
                <div className="mt-3">
                  <button
                    onClick={() => { sound.cardFlip(); setShowDetails(v => !v); }}
                    className="text-xs text-primary-300 hover:text-primary-200 font-semibold w-full text-center py-1"
                    style={{ touchAction: 'manipulation' }}
                  >
                    {showDetails ? 'Hide Meaning ▲' : 'Show Meaning & Hints ▼'}
                  </button>
                  <AnimatePresence>
                    {showDetails && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="mt-2 pt-2 border-t border-white/10">
                          {wordInfo.meaningText && (
                            <p className="text-xs text-white/70 italic">"{wordInfo.meaningText}"</p>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}
            </>
          )}
        </div>

        {/* ── Players list ── */}
        <div className="glass p-4 rounded-2xl">
          <h2 className="font-bold text-white text-sm mb-3 flex items-center justify-between">
            <span>Players ({room.players.length})</span>
            <span className="text-xs text-green-400 bg-green-500/10 px-2 py-0.5 rounded-full border border-green-500/20">
              🎙️ Live
            </span>
          </h2>

          <div className="space-y-2">
            {room.players.map((player) => {
              const playerMicOn = player.id === myId ? isMicOn : peerMutedMap[player.id] === false;
              return (
                <div key={player.id} className="flex items-center gap-2.5 p-2.5 rounded-xl border border-white/5 bg-white/3">
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
                    style={{ backgroundColor: player.avatar?.color || '#7c3aed' }}
                  >
                    {player.avatar?.initial || player.name[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-semibold text-white text-sm truncate max-w-[120px]">{player.name}</span>
                      {player.id === myId && (
                        <span className="badge bg-primary-500/20 text-primary-400">You</span>
                      )}
                      {player.isHost && (
                        <span className="badge bg-amber-500/20 text-amber-400">👑</span>
                      )}
                    </div>
                    <div className="text-xs text-white/30">{player.score || 0} pts</div>
                  </div>
                  <div className="flex-shrink-0">
                    {playerMicOn
                      ? <span className="text-xs text-green-400 bg-green-500/20 px-2 py-0.5 rounded-full">🗣️</span>
                      : <span className="text-xs text-white/25">🔇</span>
                    }
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </motion.div>
  );
}