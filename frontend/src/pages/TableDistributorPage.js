import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGame } from '../context/GameContext';
import { REGIONAL_THEMES } from '../data/themes';
import TablePerimeterLayout from '../components/TablePerimeterLayout';
import sound from '../utils/sound';

export default function TableDistributorPage() {
  const {
    room, myWord, isHost, confirmWord, hasConfirmedWord, confirmedCount, startDiscussion,
    myId, isMicOn, peerMutedMap, lobbyMessages, typingUsers, sendLobbyMessage, setTypingStatus, turnOrder
  } = useGame();

  const [isCardFlipped, setIsCardFlipped] = useState(false);
  const [animatingDeal, setAnimatingDeal] = useState(true);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const lastRoundRef = useRef(null);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const speakDealer = (text, themeKey) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      if (themeKey === 'gujarat') utterance.lang = 'gu-IN';
      else if (themeKey === 'maharashtra') utterance.lang = 'mr-IN';
      else if (themeKey === 'kerala') utterance.lang = 'ml-IN';
      else if (themeKey === 'assam') utterance.lang = 'as-IN';
      else utterance.lang = 'hi-IN';
      utterance.rate = 1.0;
      window.speechSynthesis.speak(utterance);
    }
  };

  useEffect(() => {
    if (!room) return;
    if (lastRoundRef.current !== room.currentRound) {
      lastRoundRef.current = room.currentRound;
      setAnimatingDeal(true);
      setIsCardFlipped(false);
      sound.cardFlip();
      const cfg = room.config || {};
      const currentThemeKey = cfg.theme || 'gujarat';
      const currentTheme = REGIONAL_THEMES[currentThemeKey] || REGIONAL_THEMES.gujarat;
      if (currentTheme?.dealer?.quote) {
        speakDealer(currentTheme.dealer.quote, currentThemeKey);
      }
    }
  }, [room, room?.currentRound, room?.config]);

  if (!room) return null;

  const cfg = room.config || {};
  const currentThemeKey = cfg.theme || 'gujarat';
  const currentTheme = REGIONAL_THEMES[currentThemeKey] || REGIONAL_THEMES.gujarat;
  
  const dealer = currentTheme.dealer || { name: "Host", icon: "🤖", quote: "Here is your card!" };
  const bgImage = isMobile ? currentTheme.background?.mobile : currentTheme.background?.desktop;
  const cardBackImage = currentTheme.cardSkin?.backImage;

  const totalPlayers = room.players?.length || 1;
  const readyCount = confirmedCount || room.confirmedCount || 0;
  const allReady = readyCount >= Math.max(1, totalPlayers);

  function handleFlip() {
    sound.cardFlip();
    setIsCardFlipped(v => !v);
  }

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
      tableTitle={`${currentTheme.name} Word Reveal Table (Round ${room.currentRound}/${room.totalRounds})`}
    >
      <AnimatePresence>
        {animatingDeal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setAnimatingDeal(false)}
            className="fixed inset-0 z-50 bg-black/90 flex flex-col items-center justify-center p-6 text-center cursor-pointer"
          >
            <motion.div
              initial={{ scale: 0.5, y: -40 }}
              animate={{ scale: 1, y: 0 }}
              className="w-44 h-44 sm:w-56 sm:h-56 mb-4 rounded-3xl overflow-hidden border-4 border-amber-400 shadow-2xl bg-black/50 p-2 flex items-center justify-center"
            >
              {typeof dealer.icon === 'string' && dealer.icon.length > 2 ? (
                <img src={dealer.icon} alt="Dealer" className="w-full h-full object-contain filter drop-shadow-2xl scale-110" />
              ) : (
                <span className="text-9xl">{dealer.icon || '🤖'}</span>
              )}
            </motion.div>
            
            <h2 className="text-amber-300 font-black text-2xl uppercase tracking-wider">{dealer.name} is dealing your card...</h2>
            <p className="text-white italic text-base mt-2 max-w-md">"{dealer.quote}"</p>
            
            <motion.div
              animate={{ y: [0, 15, 0] }}
              transition={{ repeat: Infinity, duration: 1.2 }}
              className="mt-6 w-28 h-44 rounded-2xl shadow-2xl flex items-center justify-center text-3xl border-2 border-amber-300"
              style={{ backgroundImage: cardBackImage ? `url(${cardBackImage})` : 'none', backgroundSize: 'cover' }}
            >
              ✨🎴✨
            </motion.div>
            
            <p className="text-amber-400 text-xs mt-6 animate-pulse font-bold">👆 Tap anywhere to start playing</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Center Screen: Dealer Badge + Player Card ONLY */}
      <div className="w-full max-w-sm flex flex-col items-center justify-center space-y-3">
        {/* Dealer Mini Avatar Badge */}
        <div className="flex items-center gap-2.5 bg-black/80 border border-amber-400/50 px-3.5 py-1.5 rounded-2xl shadow-xl backdrop-blur-md">
          <div className="w-9 h-9 rounded-full overflow-hidden border border-amber-400 flex items-center justify-center bg-black/40 flex-shrink-0">
            {typeof dealer.icon === 'string' && dealer.icon.length > 2 ? (
              <img src={dealer.icon} alt="Dealer" className="w-full h-full object-contain" />
            ) : (
              <span className="text-lg">{dealer.icon || '🤖'}</span>
            )}
          </div>
          <div className="text-left">
            <span className="text-[10px] text-amber-400 font-black uppercase tracking-wider block">{dealer.name}</span>
            <p className="text-[11px] text-white/90 italic truncate max-w-[200px]">"{dealer.quote}"</p>
          </div>
        </div>

        {/* User's Card Flip Box (Centered & Prominent) */}
        <motion.div
          whileTap={{ scale: 0.97 }}
          onClick={handleFlip}
          className={`
            relative w-full max-w-[260px] sm:max-w-[280px] min-h-[260px] sm:min-h-[280px] rounded-3xl border-2 cursor-pointer overflow-hidden
            transition-all duration-400 shadow-2xl p-5 flex flex-col items-center justify-center text-center backdrop-blur-md
            ${isCardFlipped ? 'border-amber-400 bg-slate-900 shadow-amber-500/40' : 'border-amber-400 shadow-black/90'}
          `}
          style={{ 
            touchAction: 'manipulation',
            backgroundImage: !isCardFlipped && cardBackImage ? `url(${cardBackImage})` : 'linear-gradient(to bottom right, #1e1b4b, #0f172a)',
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          }}
        >
          <AnimatePresence mode="wait">
            {isCardFlipped ? (
              <motion.div key="flipped" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="py-4 bg-slate-950/95 rounded-2xl p-4 border border-white/20 w-full">
                <p className="text-xs text-amber-300 uppercase font-bold tracking-wider mb-2">Your Secret Word</p>
                <p className="text-3xl font-black text-white tracking-wide my-2">{myWord?.word || 'Sample Word'}</p>
                {myWord?.isImposter ? (
                  <span className="inline-block mt-3 text-xs bg-rose-600 text-white px-3.5 py-1 rounded-full font-bold shadow-lg">😈 You are the Imposter!</span>
                ) : (
                  <span className="inline-block mt-3 text-xs bg-emerald-600 text-white px-3.5 py-1 rounded-full font-bold shadow-lg">🧑‍🤝‍🧑 Crew Member</span>
                )}
              </motion.div>
            ) : (
              <motion.div key="hidden" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="py-12 flex flex-col items-center justify-center">
                <div className="text-5xl mb-2">🎴</div>
                <p className="text-white font-bold text-sm">Tap Card to Reveal Word</p>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        <p className="text-[11px] text-amber-300 uppercase tracking-widest font-extrabold drop-shadow-md">
          {isCardFlipped ? '🔓 Card Revealed' : '👇 Tap Card Above to Flip'}
        </p>

        {/* Action Controls */}
        <div className="w-full max-w-xs space-y-2">
          {!hasConfirmedWord ? (
            <motion.button
              whileTap={{ scale: 0.96 }}
              onClick={() => { sound.click(); confirmWord(); }}
              className="w-full py-2.5 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-2xl shadow-xl text-xs transition-all cursor-pointer"
            >
              ✅ I Have Seen My Card (Ready)
            </motion.button>
          ) : (
            <div className="bg-green-500/25 border border-green-500/50 py-2 px-3 rounded-2xl text-center backdrop-blur-sm">
              <p className="text-green-300 text-xs font-bold">✅ Ready! Waiting for others...</p>
            </div>
          )}

          {isHost && (
            <motion.button
              whileTap={{ scale: 0.96 }}
              onClick={() => { sound.click(); startDiscussion(); }}
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-2xl text-xs shadow-xl transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <span>🚀 Start Discussion</span>
              {!allReady && <span className="text-[10px] bg-black/30 px-1.5 py-0.5 rounded">({readyCount}/{totalPlayers} Ready)</span>}
            </motion.button>
          )}
        </div>
      </div>
    </TablePerimeterLayout>
  );
}