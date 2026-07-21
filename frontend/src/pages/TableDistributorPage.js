import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGame } from '../context/GameContext';
import sound from '../utils/sound';

export default function TableDistributorPage() {
  const { room, myWord, isHost, confirmWord, hasConfirmedWord, confirmedCount, startDiscussion } = useGame();
  const [isCardFlipped, setIsCardFlipped] = useState(false);

  if (!room) return null;

  const totalPlayers = room.players.length;
  const readyCount = confirmedCount || room.confirmedCount || 0;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen px-4 py-6 flex flex-col items-center justify-between relative overflow-hidden bg-gradient-to-b from-slate-950 via-indigo-950 to-slate-900 text-white"
    >
      {/* Top Header */}
      <div className="text-center z-10 mt-2">
        <div className="inline-flex items-center gap-2 bg-primary-500/20 border border-primary-500/30 rounded-full px-4 py-1 text-primary-300 text-xs mb-2">
          <span className="live-dot" />
          Round {room.currentRound} of {room.totalRounds} — Central Table Distributor
        </div>
        <h1 className="text-2xl font-black">Virtual Card Table</h1>
        <p className="text-white/40 text-xs">Dealer is distributing cards to all players around the table.</p>
      </div>

      {/* Central Poker / UNO Style Table & Distributor Character */}
      <div className="relative w-full max-w-4xl h-[420px] my-auto flex items-center justify-center">
        
        {/* Table Oval Surface */}
        <div className="absolute w-[90%] h-[320px] bg-emerald-900/40 border-4 border-emerald-500/30 rounded-[150px] shadow-[0_0_50px_rgba(16,185,129,0.15)] flex flex-col items-center justify-center backdrop-blur-md">
          
          {/* Dealer Character in the Center */}
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="flex flex-col items-center mb-3"
          >
            <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-amber-500 to-yellow-300 border-2 border-yellow-200 flex items-center justify-center text-3xl shadow-lg shadow-amber-500/30 animate-bounce">
              🤖
            </div>
            <span className="text-xs font-bold text-amber-300 mt-1 bg-black/40 px-3 py-0.5 rounded-full border border-amber-500/30">
              Dealer "PakadYaar"
            </span>
            <p className="text-[10px] text-white/50 mt-0.5">"Cards distributed! Check yours below."</p>
          </motion.div>

          {/* Players Seated around the Table Avatars */}
          <div className="absolute inset-x-4 bottom-4 flex justify-around items-center px-4">
            {room.players.map((player, idx) => (
              <div key={player.id} className="flex flex-col items-center">
                <div 
                  className="w-10 h-10 rounded-full border-2 border-white/20 flex items-center justify-center font-bold text-xs shadow-md"
                  style={{ backgroundColor: player.avatar?.color || '#7c3aed' }}
                >
                  {player.avatar?.initial || player.name[0]}
                </div>
                <span className="text-[10px] text-white/80 mt-1 max-w-[60px] truncate">{player.name}</span>
                <span className="text-[9px] text-emerald-400">🎴 Seated</span>
              </div>
            ))}
          </div>

        </div>
      </div>

      {/* Bottom Section: My Card View & Ready Controls */}
      <div className="w-full max-w-md mx-auto text-center z-10 mb-4">
        
        {/* Interactive Personal Card */}
        <div className="mb-4 flex flex-col items-center">
          <p className="text-xs text-white/50 uppercase tracking-widest mb-2 font-semibold">Your Hand (Tap to Flip)</p>
          <motion.div
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => {
              sound.cardFlip();
              setIsCardFlipped(!isCardFlipped);
            }}
            className={`w-64 h-36 rounded-2xl p-4 flex flex-col justify-between cursor-pointer transition-all duration-500 shadow-xl border-2 ${
              isCardFlipped 
                ? 'bg-gradient-to-br from-indigo-900 to-slate-900 border-primary-400 shadow-primary-500/20' 
                : 'bg-gradient-to-br from-slate-800 to-slate-900 border-white/20'
            }`}
          >
            <div className="flex justify-between items-center text-[10px] text-white/40 uppercase">
              <span>Secret Card</span>
              <span>🔒 Private</span>
            </div>

            {isCardFlipped ? (
              <div className="text-center">
                <div className="text-[10px] text-primary-300 uppercase font-bold">Your Word</div>
                <div className="text-2xl font-black text-white my-1">{myWord?.word || 'Loading...'}</div>
                {myWord?.isImposter ? (
                  <span className="text-[10px] bg-rose-500/20 text-rose-300 px-2 py-0.5 rounded-full font-bold">Imposter Role</span>
                ) : (
                  <span className="text-[10px] bg-green-500/20 text-green-300 px-2 py-0.5 rounded-full font-bold">Crew Role</span>
                )}
              </div>
            ) : (
              <div className="text-center">
                <span className="text-xl">🎴</span>
                <p className="text-xs text-white/80 font-bold mt-1">Tap to See Word</p>
              </div>
            )}

            <div className="text-[9px] text-white/30 text-center">Distributed by Dealer</div>
          </motion.div>
        </div>

        {/* Ready Action & Host Controls */}
        {!hasConfirmedWord ? (
          <button
            onClick={() => {
              sound.click();
              confirmWord();
            }}
            className="w-full py-3 bg-gradient-to-r from-primary-600 to-accent-600 hover:from-primary-500 hover:to-accent-500 text-white font-bold rounded-xl shadow-lg text-sm transition-all active:scale-95 cursor-pointer"
          >
            I'm Ready ({readyCount}/{totalPlayers}) ✅
          </button>
        ) : (
          <div className="glass p-3 rounded-xl border-green-500/30 bg-green-500/10 text-green-400 text-xs font-semibold">
            ✅ You are Ready! Waiting for others... ({readyCount}/{totalPlayers})
          </div>
        )}

        {isHost && (
          <div className="mt-3">
            <button
              onClick={() => {
                sound.click();
                startDiscussion();
              }}
              className="w-full py-2.5 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold rounded-xl text-xs transition-all active:scale-95 cursor-pointer"
            >
              Start Table Discussion 🚀
            </button>
          </div>
        )}

      </div>
    </motion.div>
  );
}