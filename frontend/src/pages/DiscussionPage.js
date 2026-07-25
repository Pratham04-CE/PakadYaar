import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGame } from '../context/GameContext';
import wordsData from '../data/words.json';
import sound from '../utils/sound';

const QUICK_EMOJIS = ['😀', '😂', '🔥', '👍', '😎', '🎉', '😱', '💩'];

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

function ChatMessageBubble({ message, me }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex ${me ? 'justify-end' : 'justify-start'}`}
    >
      <div className={`max-w-[85%] rounded-2xl px-3 py-2 shadow-sm ${me ? 'bg-primary-600/80 text-white' : 'bg-white/10 text-white/90 border border-white/10'}`}>
        {!me && <p className="text-[10px] font-semibold text-primary-300 mb-1">{message.name}</p>}
        <p className="text-xs leading-5 break-words">{message.text}</p>
        <p className={`text-[10px] mt-1 ${me ? 'text-white/70' : 'text-white/35'}`}>{message.time}</p>
      </div>
    </motion.div>
  );
}

export default function DiscussionPage() {
  const {
    room, myWord, timer, myId, drawMessage, isMicOn,
    peerMutedMap, isCardDisabled, lobbyMessages, typingUsers,
    sendLobbyMessage, setTypingStatus, turnOrder
  } = useGame();

  const [showDetails, setShowDetails] = useState(false);
  const [isCardRevealed, setIsCardRevealed] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const chatBottomRef = useRef(null);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [lobbyMessages, typingUsers]);

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

  function handleInputChange(e) {
    const val = e.target.value.slice(0, 240);
    setChatInput(val);
    setTypingStatus(val.trim().length > 0);
  }

  function handleSendChat(e) {
    e.preventDefault();
    const trimmed = chatInput.trim();
    if (!trimmed) return;
    sendLobbyMessage(trimmed);
    setChatInput('');
    setTypingStatus(false);
    sound.click();
  }

  function addEmoji(emoji) {
    setChatInput(prev => `${prev}${emoji}`.slice(0, 240));
    setTypingStatus(true);
    sound.click();
  }

  const typingNames = Object.values(typingUsers || {}).filter(Boolean);

  // Build a fast player lookup map
  const playerMap = Object.fromEntries((room?.players || []).map(p => [p.id, p]));

  // Find my position in the speaking order (1-indexed)
  const myTurnIndex = turnOrder.indexOf(myId);
  const myTurnPosition = myTurnIndex >= 0 ? myTurnIndex + 1 : null;
  const ordinals = ['1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th', '9th', '10th'];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen"
      style={{ paddingTop: '64px', paddingBottom: '24px' }}
    >
      <div className="max-w-2xl mx-auto px-3 sm:px-4">
        {drawMessage && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass border-yellow-500/40 bg-yellow-500/10 p-3 text-center mb-4 rounded-xl"
          >
            <span className="text-yellow-300 font-semibold text-sm">⚖️ {drawMessage}</span>
          </motion.div>
        )}

        <div className="flex items-center justify-between mb-4 gap-3">
          <div className="flex-1 min-w-0">
            <div className="inline-flex items-center gap-1.5 bg-accent-600/20 border border-accent-500/30 rounded-full px-3 py-1 text-accent-300 text-xs">
              <span className="live-dot" />
              <span className="truncate">Round {room.currentRound}/{room.totalRounds} — Discussion</span>
            </div>
            <h1 className="text-lg sm:text-xl font-bold text-white mt-1">Discussion Table 🗣️</h1>
          </div>

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

        {/* Compact Speaking Order Strip */}
        {turnOrder.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4"
          >
            <p className="text-[10px] text-white/35 uppercase tracking-wider mb-1.5 font-semibold flex items-center gap-1">
              <span>🎤</span> Speaking Order
              {myTurnPosition !== null && (
                <span className={`ml-auto font-bold ${
                  myTurnPosition === 1 ? 'text-amber-300' : 'text-primary-300'
                }`}>
                  You #{myTurnPosition}
                </span>
              )}
            </p>
            <div className="flex gap-1.5 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
              {turnOrder.map((playerId, idx) => {
                const player = playerMap[playerId];
                if (!player) return null;
                const isMe = playerId === myId;
                return (
                  <div
                    key={playerId}
                    className={`flex items-center gap-1.5 px-2 py-1 rounded-lg flex-shrink-0 border text-[11px]
                      ${ isMe
                        ? 'bg-primary-500/20 border-primary-400/50 text-primary-200'
                        : 'bg-white/5 border-white/8 text-white/60'
                      }`}
                  >
                    <span className={`text-[9px] font-black w-3.5 text-center ${
                      idx === 0 ? 'text-amber-400'
                        : idx === 1 ? 'text-slate-400'
                        : idx === 2 ? 'text-orange-500'
                        : 'text-white/30'
                    }`}>{idx + 1}</span>
                    <div
                      className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold text-white flex-shrink-0"
                      style={{ backgroundColor: player.avatar?.color || '#7c3aed' }}
                    >
                      {player.avatar?.initial || player.name[0]}
                    </div>
                    <span className="max-w-[60px] truncate font-medium">{isMe ? 'You' : player.name}</span>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}

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
                className={`p-4 rounded-xl cursor-pointer border transition-all duration-300 text-center ${isCardRevealed ? 'bg-primary-600/20 border-primary-500' : 'bg-white/5 border-white/10 hover:bg-white/8'}`}
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
                    <motion.span key="hidden" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-xs text-white/40">Face down on table</motion.span>
                  )}
                </AnimatePresence>
              </motion.div>

              {wordInfo && (
                <div className="mt-3">
                  <button
                    onClick={() => { sound.cardFlip(); setShowDetails(v => !v); }}
                    className="text-xs text-primary-300 hover:text-primary-200 font-semibold w-full text-center py-1 cursor-pointer"
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

        <motion.div
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="glass p-4 mb-4 rounded-2xl flex flex-col min-h-[17rem]"
        >
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-bold text-white text-xs uppercase tracking-wider text-white/60">💬 Discussion Chat</h3>
            <span className="text-[10px] text-white/35">Room-wide discussion</span>
          </div>

          <div className="flex-1 overflow-y-auto space-y-2 pr-1 mb-2 bg-black/20 p-3 rounded-xl border border-white/5 min-h-[8rem]">
            {lobbyMessages.length === 0 ? (
              <p className="text-white/30 text-xs text-center py-6 italic">Discuss with others here...</p>
            ) : (
              <AnimatePresence initial={false}>
                {lobbyMessages.map((msg) => (
                  <ChatMessageBubble key={msg.id || `${msg.name}-${msg.time}-${msg.text}`} message={msg} me={msg.playerId === myId} />
                ))}
              </AnimatePresence>
            )}
            <div ref={chatBottomRef} />
          </div>

          {typingNames.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-[11px] text-amber-300/80 italic mb-2 px-1 flex items-center gap-1.5"
            >
              <span>✍️</span>
              <span>{typingNames.join(', ')} {typingNames.length === 1 ? 'is' : 'are'} typing...</span>
            </motion.div>
          )}

          <div className="flex gap-1 mb-2 overflow-x-auto py-1 no-scrollbar">
            {QUICK_EMOJIS.map((emoji, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => addEmoji(emoji)}
                className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/15 flex items-center justify-center text-sm transition-all active:scale-95 cursor-pointer flex-shrink-0"
                style={{ touchAction: 'manipulation' }}
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
              placeholder="Send text or emoji..."
              className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-white/30 focus:outline-none focus:border-primary-500"
            />
            <button
              type="submit"
              className="px-4 py-2 bg-primary-600 hover:bg-primary-500 text-white rounded-xl text-xs font-bold transition-all cursor-pointer active:scale-95 flex-shrink-0"
              style={{ touchAction: 'manipulation' }}
            >
              Send 🚀
            </button>
          </form>
        </motion.div>

        {/* Players list (compact, no duplication) */}
        <div className="glass p-3 rounded-2xl">
          <h2 className="font-bold text-white text-xs mb-2 flex items-center justify-between">
            <span className="text-white/50 uppercase tracking-wider">Players ({room.players.length})</span>
            <span className="text-[10px] text-green-400 bg-green-500/10 px-2 py-0.5 rounded-full border border-green-500/20">🎤 Live</span>
          </h2>
          <div className="space-y-1.5">
            {room.players.map((player) => {
              const isMe = player.id === myId;
              const playerMicOn = isMe ? isMicOn : peerMutedMap[player.id] === false;
              const turnPos = turnOrder.indexOf(player.id);
              return (
                <div
                  key={player.id}
                  className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg border
                    ${ isMe ? 'border-primary-400/40 bg-primary-500/10' : 'border-white/5 bg-white/3'}`}
                >
                  {/* Turn number */}
                  {turnPos >= 0 && (
                    <span className={`text-[10px] font-black w-4 text-center flex-shrink-0
                      ${ turnPos === 0 ? 'text-amber-400'
                        : turnPos === 1 ? 'text-slate-400'
                        : turnPos === 2 ? 'text-orange-500'
                        : 'text-white/25'
                      }`}>{turnPos + 1}</span>
                  )}
                  {/* Avatar */}
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center text-white font-bold text-xs flex-shrink-0"
                    style={{ backgroundColor: player.avatar?.color || '#7c3aed' }}
                  >
                    {player.avatar?.initial || player.name[0]}
                  </div>
                  {/* Name */}
                  <div className="flex-1 min-w-0 flex items-center gap-1">
                    <span className={`text-xs font-semibold truncate max-w-[100px] ${isMe ? 'text-primary-200' : 'text-white'}`}>
                      {player.name}
                    </span>
                    {isMe && <span className="text-[9px] text-primary-400 font-bold">You</span>}
                    {player.isHost && <span className="text-[10px]">👑</span>}
                  </div>
                  {/* Score + mic */}
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <span className="text-[10px] text-white/30">{player.score || 0}pt</span>
                    {playerMicOn
                      ? <span className="text-[10px] text-green-400">🗣️</span>
                      : <span className="text-[10px] text-white/20">🔇</span>
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