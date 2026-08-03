import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGame } from '../context/GameContext';
import { REGIONAL_THEMES } from '../data/themes';
import TablePerimeterLayout from '../components/TablePerimeterLayout';
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
  const {
    room, myWord, timer, myId, drawMessage, isMicOn,
    peerMutedMap, isCardDisabled, lobbyMessages, typingUsers,
    sendLobbyMessage, setTypingStatus, turnOrder
  } = useGame();

  const [showDetails, setShowDetails] = useState(false);
  const [isCardRevealed, setIsCardRevealed] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (!room) return null;

  const cfg = room.config || {};
  const currentThemeKey = cfg.theme || 'gujarat';
  const currentTheme = REGIONAL_THEMES[currentThemeKey] || REGIONAL_THEMES.gujarat;
  
  const bgImage = isMobile 
    ? currentTheme.background?.mobile 
    : currentTheme.background?.desktop;
  
  const cardBackImage = currentTheme.cardSkin?.backImage;

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
    <TablePerimeterLayout
      players={room.players || []}
      myId={myId}
      turnOrder={turnOrder}
      isMicOn={isMicOn}
      peerMutedMap={peerMutedMap}
      lobbyMessages={lobbyMessages}
      typingUsers={typingUsers}
      sendLobbyMessage={sendLobbyMessage}
      setTypingStatus={setTypingStatus}
      bgImage={bgImage}
      tableTitle={`${currentTheme.name} Discussion Table`}
    >
      {/* Center Screen: User's Card & Discussion Status ONLY */}
      <div className="w-full max-w-sm flex flex-col items-center justify-center space-y-3">
        {drawMessage && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass border-yellow-500/40 bg-yellow-500/10 p-2.5 text-center rounded-xl w-full"
          >
            <span className="text-yellow-300 font-semibold text-xs">⚖️ {drawMessage}</span>
          </motion.div>
        )}

        {/* Discussion Timer Badge */}
        <div className="flex items-center gap-3 bg-black/60 border border-white/20 px-4 py-2 rounded-2xl shadow-xl backdrop-blur-md">
          <div className="relative w-12 h-12 flex-shrink-0">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="44" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="8" />
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
              <span className={`text-xs font-black tabular-nums leading-none ${isUrgent ? 'text-rose-400' : 'text-white'}`}>
                {formatTime(remaining)}
              </span>
            </div>
          </div>
          <div className="text-left">
            <p className="text-xs font-black text-amber-300 uppercase tracking-wider">Discussion Time</p>
            <p className="text-[10px] text-white/60">Round {room.currentRound} of {room.totalRounds}</p>
          </div>
        </div>

        {/* User's Secret Card (Centered & Prominent) */}
        <div className="glass p-5 rounded-3xl shadow-2xl flex flex-col items-center w-full max-w-[280px] sm:max-w-[310px]">
          <p className="text-xs uppercase text-white/80 tracking-wider mb-2 font-extrabold text-center">
            🃏 Your Secret Card
          </p>

          {isCardDisabled ? (
            <div className="p-3 bg-red-500/20 border border-red-500/30 rounded-xl text-red-300 text-sm font-semibold text-center w-full">
              🔒 Card locked during voting
            </div>
          ) : (
            <div className="w-full flex flex-col items-center">
              <motion.div
                onClick={() => { sound.cardFlip(); setIsCardRevealed(v => !v); }}
                className={`w-full min-h-[220px] sm:min-h-[240px] p-5 rounded-3xl cursor-pointer border-2 transition-all duration-300 flex flex-col items-center justify-center text-center shadow-2xl ${
                  isCardRevealed ? 'border-amber-400 bg-slate-900/95' : 'border-amber-400/80'
                }`}
                style={{
                  touchAction: 'manipulation',
                  backgroundImage: !isCardRevealed && cardBackImage ? `url(${cardBackImage})` : 'linear-gradient(to bottom right, #1e1b4b, #0f172a)',
                  backgroundSize: 'cover',
                  backgroundPosition: 'center'
                }}
                whileTap={{ scale: 0.97 }}
              >
                <AnimatePresence mode="wait">
                  {isCardRevealed && wordInfo ? (
                    <motion.div
                      key="revealed"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="py-4 bg-slate-950/95 rounded-2xl p-4 border border-white/20 w-full flex flex-col items-center justify-center"
                    >
                      <div className="text-2xl sm:text-3xl font-black text-white break-words">{wordInfo.word}</div>
                      {myWord?.isImposter ? (
                        <span className="inline-block mt-2 text-xs bg-rose-600 text-white px-3 py-0.5 rounded-full font-bold shadow">
                          😈 Imposter Card
                        </span>
                      ) : (
                        <span className="inline-block mt-2 text-xs bg-emerald-600 text-white px-3 py-0.5 rounded-full font-bold shadow">
                          🧑‍🤝‍🧑 Crew Member
                        </span>
                      )}
                    </motion.div>
                  ) : (
                    <motion.div
                      key="hidden"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="py-8 flex flex-col items-center justify-center"
                    >
                      <div className="text-5xl mb-2">🎴</div>
                      <p className="text-white font-bold text-xs sm:text-sm">Tap to Reveal Word</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>

              <p
                className="text-center text-[11px] text-amber-300 uppercase tracking-wider font-extrabold mt-3 cursor-pointer"
                onClick={() => { sound.cardFlip(); setIsCardRevealed(v => !v); }}
              >
                {isCardRevealed ? '🔓 Tap Card to Hide Word' : '👇 Tap Card to Reveal'}
              </p>

              {wordInfo && (
                <div className="mt-2 text-center w-full">
                  <button
                    onClick={() => { sound.cardFlip(); setShowDetails(v => !v); }}
                    className="text-xs text-amber-300 hover:text-amber-200 font-bold py-1 cursor-pointer"
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
                        <div className="mt-2 pt-2 border-t border-white/10 text-center">
                          {wordInfo.meaningText && (
                            <p className="text-xs text-white/80 italic">"{wordInfo.meaningText}"</p>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </TablePerimeterLayout>
  );
}