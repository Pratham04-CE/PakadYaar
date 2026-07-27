import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGame } from '../context/GameContext';
import { REGIONAL_THEMES } from '../data/themes';
import sound from '../utils/sound';

export default function TableDistributorPage() {
  const { room, myWord, isHost, confirmWord, hasConfirmedWord, confirmedCount, startDiscussion } = useGame();
  const [isCardFlipped, setIsCardFlipped] = useState(false);
  const [animatingDeal, setAnimatingDeal] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (!room) return;
    setAnimatingDeal(true);
    sound.cardFlip();
    const timer = setTimeout(() => {
      setAnimatingDeal(false);
    }, 2000);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [room?.currentRound]);

  if (!room) return null;

  const cfg = room.config || {};
  const currentThemeKey = cfg.theme || 'gujarat';
  const currentTheme = REGIONAL_THEMES[currentThemeKey] || REGIONAL_THEMES.gujarat;
  
  const dealer = currentTheme.dealer || { name: "Host", icon: "🤖", quote: "Here is your card!" };
  
  // Red Marker: Background desktop/mobile check
  const bgImage = isMobile 
    ? currentTheme.background?.mobile 
    : currentTheme.background?.desktop;

  // Yellow & White Marker: Card Back theme image
  const cardBackImage = currentTheme.cardSkin?.backImage;

  const totalPlayers = room.players?.length || 1;
  const readyCount = confirmedCount || room.confirmedCount || 0;
  
  // 1 Player Game Start condition for testing
  const allReady = readyCount >= Math.max(1, totalPlayers);

  function handleFlip() {
    sound.cardFlip();
    setIsCardFlipped(v => !v);
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen flex flex-col relative overflow-hidden bg-slate-950"
      style={{
        backgroundImage: bgImage ? `url(${bgImage})` : 'none',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        paddingTop: '24px',
        paddingBottom: '24px',
      }}
    >
      {/* Dark overlay for contrast */}
      <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-[2px] pointer-events-none" />

      {/* ── Purple & Grey Marker: Fullscreen Dealer Deal Animation Overlay ── */}
      <AnimatePresence>
        {animatingDeal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 bg-black/90 flex flex-col items-center justify-center p-6 text-center"
          >
            <motion.div
              initial={{ scale: 0.5, y: -50 }}
              animate={{ scale: 1, y: 0 }}
              className="w-32 h-32 sm:w-40 sm:h-40 mb-4 rounded-2xl overflow-hidden border-4 border-amber-500 shadow-2xl bg-black/50 p-2 flex items-center justify-center"
            >
              {typeof dealer.icon === 'string' && dealer.icon.length > 2 ? (
                <img src={dealer.icon} alt="Dealer" className="w-full h-full object-contain" />
              ) : (
                <span className="text-6xl">{dealer.icon || '🤖'}</span>
              )}
            </motion.div>
            <h2 className="text-amber-400 font-bold text-lg uppercase tracking-wider">{dealer.name} is dealing your card...</h2>
            <p className="text-white/80 italic text-sm mt-2">"{dealer.quote}"</p>
            
            <motion.div
              initial={{ x: 0, y: -100, scale: 0.5, opacity: 0 }}
              animate={{ x: [0, 50, -50, 0], y: 150, scale: 1, opacity: 1 }}
              transition={{ duration: 1.2, ease: "easeInOut" }}
              className="mt-8 w-16 h-24 rounded-xl bg-gradient-to-br from-amber-500 to-yellow-600 border-2 border-yellow-200 shadow-2xl flex items-center justify-center text-xl"
            >
              🎴
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Light Blue Marker: Top Header & Players Bar ── */}
      <div className="text-center px-4 mb-3 z-10">
        <div className="inline-flex items-center gap-2 bg-black/60 border border-white/20 rounded-full px-4 py-1 text-white text-xs backdrop-blur-md shadow-lg">
          <span>🇮🇳 {currentTheme.name || 'Game'} Table</span>
          <span>•</span>
          <span>Round {room.currentRound} of {room.totalRounds}</span>
        </div>
      </div>

      <div className="px-4 mb-2 z-10">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-xl mx-auto">
          {(room.players || [{ id: '1', name: 'Player 1' }]).map((player, i) => (
            <div key={player.id} className="flex items-center gap-2 p-2.5 rounded-xl bg-black/70 border border-white/15 backdrop-blur-md shadow-md">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs text-white border border-white/30 flex-shrink-0"
                style={{ backgroundColor: player.avatar?.color || '#7c3aed' }}
              >
                {player.avatar?.initial || player.name[0]}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-white truncate">{player.name}</p>
                <p className="text-[9px] text-emerald-400">
                  {room.confirmedWords?.has?.(player.id) || readyCount > i ? '✅ Ready' : '🎴 Dealt'}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Green Marker: Full Dealer Avatar (No Circle) ── */}
      <div className="flex flex-col items-center justify-center px-4 my-2 z-10">
        <div className="flex flex-col items-center text-center">
          <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden border-2 border-amber-500/50 bg-black/50 p-1 mb-1 shadow-xl flex items-center justify-center">
            {typeof dealer.icon === 'string' && dealer.icon.length > 2 ? (
              <img src={dealer.icon} alt="Dealer" className="w-full h-full object-contain" />
            ) : (
              <span className="text-5xl">{dealer.icon || '🤖'}</span>
            )}
          </div>
          <div className="bg-black/80 border border-amber-500/30 px-3 py-1 rounded-xl shadow-lg">
            <span className="text-[9px] text-amber-400 font-bold uppercase tracking-wider block">{dealer.name}</span>
            <p className="text-[11px] text-white italic">"{dealer.quote}"</p>
          </div>
        </div>
      </div>

      {/* ── Yellow & White Marker: Card Design & High Contrast Solid Text Background ── */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 z-10 mt-2">
        <p className="text-[11px] text-white/70 uppercase tracking-widest mb-2 font-semibold">Your Hand — Tap to Flip</p>

        <motion.div
          whileTap={{ scale: 0.97 }}
          onClick={handleFlip}
          className={`
            relative w-full max-w-xs rounded-3xl border-2 cursor-pointer overflow-hidden
            transition-all duration-400 shadow-2xl p-5 text-center backdrop-blur-md
            ${isCardFlipped
              ? 'border-amber-400 bg-slate-900 shadow-amber-500/20'
              : 'border-white/20 shadow-black/80'
            }
          `}
          style={{ 
            minHeight: '150px', 
            touchAction: 'manipulation',
            backgroundImage: !isCardFlipped && cardBackImage 
               ? `url(${cardBackImage})` 
               : (isCardFlipped ? 'none' : 'linear-gradient(to bottom right, #1e1b4b, #0f172a)'),
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          }}
        >
          <div className="flex justify-between items-center text-[10px] text-white uppercase tracking-wider mb-2 bg-black/70 px-3 py-1 rounded-full font-bold">
            <span>Secret Card</span>
            <span>{isCardFlipped ? '🔓 Revealed' : '🔒 Tap to Flip'}</span>
          </div>

          <AnimatePresence mode="wait">
            {isCardFlipped ? (
              <motion.div
                key="flipped"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="py-2 bg-slate-950/95 rounded-2xl p-3 border border-white/20 shadow-inner"
              >
                <p className="text-[10px] text-amber-300 uppercase font-bold tracking-wider mb-1">Your Word</p>
                <p className="text-3xl font-black text-white tracking-wide my-1">
                  {myWord?.word || 'Sample Word'}
                </p>
                {myWord?.isImposter ? (
                  <span className="inline-block mt-2 text-xs bg-rose-600 text-white px-3 py-1 rounded-full font-bold shadow">
                    😈 You are the Imposter!
                  </span>
                ) : (
                  <span className="inline-block mt-2 text-xs bg-emerald-600 text-white px-3 py-1 rounded-full font-bold shadow">
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
                className="py-5 flex flex-col items-center justify-center bg-slate-950/80 rounded-2xl border border-white/10"
              >
                <div className="text-3xl mb-1">🎴</div>
                <p className="text-white font-bold text-xs">Tap to Reveal Secret Word</p>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Ready & Host Action Buttons */}
        <div className="w-full max-w-xs mt-4 space-y-2.5">
          {!hasConfirmedWord ? (
            <motion.button
              whileTap={{ scale: 0.96 }}
              onClick={() => { sound.click(); confirmWord(); }}
              className="w-full py-3 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-2xl shadow-lg text-xs transition-all cursor-pointer"
              style={{ touchAction: 'manipulation' }}
            >
              ✅ I Have Seen My Card (Ready)
            </motion.button>
          ) : (
            <div className="bg-green-500/20 border border-green-500/40 py-2.5 px-4 rounded-2xl text-center backdrop-blur-sm">
              <p className="text-green-300 text-xs font-bold">✅ Ready! Waiting for others...</p>
            </div>
          )}

          {isHost && (
            <motion.button
              whileTap={{ scale: 0.96 }}
              onClick={() => { sound.click(); startDiscussion(); }}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-2xl text-xs shadow-xl transition-all cursor-pointer flex items-center justify-center gap-2"
              style={{ touchAction: 'manipulation' }}
            >
              <span>🚀 Start Discussion</span>
              {!allReady && <span className="text-[10px] bg-black/30 px-2 py-0.5 rounded">({readyCount}/{totalPlayers} Ready)</span>}
            </motion.button>
          )}
        </div>
      </div>
    </motion.div>
  );
}