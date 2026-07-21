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

  const circumference = 2 * Math.PI * 80;
  const strokeDashoffset = circumference * (1 - progress);

  const formatTime = (s) => {
    const m = Math.floor(s / 60).toString().padStart(2, '0');
    const sec = (s % 60).toString().padStart(2, '0');
    return `${m}:${sec}`;
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="min-h-screen px-4 py-8">
      <div className="max-w-4xl mx-auto">

        {/* Header */}
        <motion.div initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="text-center mb-8">
          <div className="inline-flex items-center gap-2 bg-accent-600/20 border border-accent-500/30 rounded-full px-4 py-1.5 text-accent-300 text-sm mb-3">
            <span className="live-dot" />
            Round {room.currentRound} of {room.totalRounds} — Discussion & Table Phase
          </div>
          <h1 className="text-3xl font-bold text-white">Discussion Table Active</h1>
          <p className="text-white/40 mt-2 text-sm">
            Talk via Voice/Text, inspect your distributed card, and find the imposter!
          </p>
        </motion.div>

        {drawMessage && (
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="glass border-yellow-500/40 bg-yellow-500/10 p-4 text-center mb-6 rounded-xl">
            <span className="text-yellow-300 font-semibold">⚖️ {drawMessage}</span>
          </motion.div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Left Column: Timer & Card Distributor Box */}
          <div className="lg:col-span-1 flex flex-col items-center">
            <div className="glass-strong p-6 flex flex-col items-center gap-4 w-full rounded-2xl">
              
              {/* Circular Timer */}
              <div className="relative w-36 h-36">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 200 200">
                  <circle cx="100" cy="100" r="80" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="12" />
                  <motion.circle
                    cx="100" cy="100" r="80" fill="none"
                    stroke={isUrgent ? '#f43f5e' : '#06b6d4'}
                    strokeWidth="12" strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    style={{ transition: 'stroke-dashoffset 1s linear, stroke 0.5s ease' }}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className={`text-3xl font-black tabular-nums ${isUrgent ? 'text-rose-400' : 'text-white'}`}>
                    {formatTime(remaining)}
                  </span>
                  <span className="text-white/40 text-xs mt-1">left</span>
                </div>
              </div>

              {/* Distributed Card View Element */}
              <div className="w-full mt-2 text-center">
                <p className="text-xs uppercase text-white/50 tracking-wider mb-2">🃏 Distributed Card Table</p>
                
                {isCardDisabled ? (
                  <div className="p-3 bg-red-500/20 border border-red-500/30 rounded-xl text-red-300 text-xs font-semibold">
                    🔒 Card Disabled
                  </div>
                ) : (
                  <div 
                    onClick={() => {
                      sound.cardFlip();
                      setIsCardRevealed(!isCardRevealed);
                    }}
                    className={`p-4 rounded-xl cursor-pointer border transition-all duration-300 ${
                      isCardRevealed ? 'bg-primary-600/30 border-primary-500' : 'bg-white/5 border-white/10 hover:bg-white/10'
                    }`}
                  >
                    <p className="text-xs font-bold text-primary-300 mb-1">{isCardRevealed ? 'Tap to Hide Card' : 'Tap to View Secret Card'}</p>
                    {isCardRevealed && wordInfo ? (
                      <div className="text-xl font-black text-white mt-1">
                        {wordInfo.word}
                        {myWord?.isImposter && <span className="block text-xs text-rose-400 mt-1">(Imposter Card)</span>}
                      </div>
                    ) : (
                      <span className="text-xs text-white/40">Face Down on Table</span>
                    )}
                  </div>
                )}
              </div>

            </div>

            {/* Details Accordion */}
            {wordInfo && !isCardDisabled && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-4 w-full glass p-4 text-center rounded-2xl">
                <button
                  onClick={() => { sound.cardFlip(); setShowDetails(!showDetails); }}
                  className="text-xs text-primary-300 hover:text-primary-200 font-semibold underline w-full"
                >
                  {showDetails ? 'Hide Hints & Meaning ▲' : 'Show Meaning & Hints ▼'}
                </button>
                <AnimatePresence>
                  {showDetails && (
                    <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} className="mt-3 text-left border-t border-white/10 pt-3 space-y-2">
                      {wordInfo.meaningText && (
                        <p className="text-xs text-white/80 italic">"{wordInfo.meaningText}"</p>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )}
          </div>

          {/* Right Column: Players List & Voice/Text Status */}
          <div className="lg:col-span-2">
            <div className="glass p-6 h-full rounded-2xl">
              <h2 className="font-bold text-white mb-5 flex items-center justify-between">
                <span>Players Table ({room.players.length})</span>
                <span className="text-xs text-green-400 bg-green-500/10 px-3 py-1 rounded-full border border-green-500/20">🎙️ Voice/Text Live</span>
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {room.players.map((player) => {
                  const playerMicOn = player.id === myId ? isMicOn : peerMutedMap[player.id] === false;
                  return (
                    <div key={player.id} className="flex items-center gap-3 p-3 rounded-xl border border-white/5 bg-white/3">
                      <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm" style={{ backgroundColor: player.avatar?.color || '#7c3aed' }}>
                        {player.avatar?.initial || player.name[0]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-white truncate">{player.name}</span>
                          {player.id === myId && <span className="text-[10px] text-primary-400 bg-primary-500/20 px-1.5 py-0.5 rounded">You</span>}
                        </div>
                        <div className="text-xs text-white/40">Score: {player.score || 0} pts</div>
                      </div>
                      <div>
                        {playerMicOn ? <span className="text-xs text-green-400 bg-green-500/20 px-2 py-0.5 rounded-full">🗣️ Active</span> : <span className="text-xs text-white/30">🔇 Muted</span>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

        </div>
      </div>
    </motion.div>
  );
}