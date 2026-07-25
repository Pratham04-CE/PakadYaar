import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGame } from '../context/GameContext';
import sound from '../utils/sound';

export default function LeaveRoomButton() {
  const { room, leaveRoom, leaveNotification } = useGame();
  const [showConfirm, setShowConfirm] = useState(false);

  if (!room) return null;

  return (
    <>
      {/* Leave Button - Responsive for Mobile & Desktop */}
      <div className="fixed top-4 left-4 z-50">
        <button
          onClick={() => {
            sound.click();
            setShowConfirm(true);
          }}
          className="flex items-center gap-1.5 px-3 py-2 sm:px-3.5 sm:py-2 rounded-full glass border border-rose-500/30 bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 text-xs font-bold shadow-lg transition-all active:scale-95 cursor-pointer select-none"
        >
          <span>🚪</span>
          <span className="hidden sm:inline">Leave Room</span>
        </button>
      </div>

      {/* Real-time Player Left Notification Banner */}
      <AnimatePresence>
        {leaveNotification && (
          <motion.div
            initial={{ opacity: 0, y: -40, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.9 }}
            className="fixed top-16 left-1/2 -translate-x-1/2 z-50 w-[90%] max-w-sm bg-amber-500/20 border border-amber-500/40 backdrop-blur-md px-4 py-2 rounded-2xl shadow-2xl text-center text-amber-300 text-xs sm:text-sm font-semibold"
          >
            ⚠️ {leaveNotification}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Animated Confirmation Pop-up Modal */}
      <AnimatePresence>
        {showConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: 20 }}
              className="w-full max-w-sm glass-strong p-6 rounded-3xl border border-white/10 shadow-2xl text-center"
            >
              <div className="w-12 h-12 rounded-full bg-rose-500/20 border border-rose-500/30 flex items-center justify-center mx-auto mb-4 text-xl">
                🚪
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Leave Room?</h3>
              <p className="text-white/60 text-xs sm:text-sm mb-6">
                Are you sure you want to leave the game? You will be disconnected from the room.
              </p>

              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => {
                    sound.click();
                    setShowConfirm(false);
                  }}
                  className="py-2.5 px-4 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs sm:text-sm transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    sound.click();
                    leaveRoom();
                    setShowConfirm(false);
                  }}
                  className="py-2.5 px-4 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs sm:text-sm shadow-lg shadow-rose-500/30 transition-all cursor-pointer"
                >
                  Yes, Leave
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}