import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { GameProvider, useGame } from './context/GameContext';
import sound from './utils/sound';

// Pages
import HomePage from './pages/HomePage';
import LobbyPage from './pages/LobbyPage';
import WaitingRoomPage from './pages/WaitingRoomPage';
import TableDistributorPage from './pages/TableDistributorPage';
import DiscussionPage from './pages/DiscussionPage';
import VotingPage from './pages/VotingPage';
import ResultsPage from './pages/ResultsPage';
import GameOverPage from './pages/GameOverPage';
import OfflinePage from './pages/OfflinePage';

// Phase router — renders the right page based on game phase
function PhaseRouter() {
  const { gamePhase } = useGame();

  switch (gamePhase) {
    case 'home':        return <HomePage />;
    case 'lobby':       return <LobbyPage />;
    case 'waiting-room': return <WaitingRoomPage />;
    case 'word-reveal':  return <TableDistributorPage />;
    case 'discussion':   return <DiscussionPage />;
    case 'voting':       return <VotingPage />;
    case 'results':      return <ResultsPage />;
    case 'game-over':    return <GameOverPage />;
    default:             return <HomePage />;
  }
}

// Inline Leave Room Button & Animated Modal Component (Responsive for Phone & PC)
function LeaveRoomButton() {
  const { room, leaveRoom, leaveNotification } = useGame();
  const [showConfirm, setShowConfirm] = useState(false);

  if (!room) return null;

  return (
    <>
      {/* Leave Button - Top Left */}
      <div className="fixed top-3 left-3 z-50">
        <button
          onClick={() => {
            sound.click();
            setShowConfirm(true);
          }}
          className="flex items-center gap-1.5 px-3 py-2 rounded-full glass border border-rose-500/30 bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 text-xs font-bold shadow-lg transition-all active:scale-95 cursor-pointer select-none"
          style={{ touchAction: 'manipulation' }}
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
            className="fixed top-16 left-1/2 -translate-x-1/2 z-50 w-[90%] max-w-sm bg-amber-500/20 border border-amber-500/40 backdrop-blur-md px-4 py-2 rounded-2xl shadow-2xl text-center text-amber-300 text-xs sm:text-sm font-semibold pointer-events-none"
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

function SoundToggle() {
  const [muted, setMuted] = useState(sound.isMuted());

  function toggle() {
    const isNowMuted = sound.toggleMute();
    setMuted(isNowMuted);
    if (!isNowMuted) sound.click();
  }

  return (
    <button
      onClick={toggle}
      title={muted ? 'Unmute Sound' : 'Mute Sound'}
      className="fixed top-3 right-3 z-50 w-10 h-10 rounded-full glass flex items-center justify-center text-lg shadow-lg border border-white/10 hover:border-white/30 transition-all active:scale-95 cursor-pointer select-none"
      style={{ touchAction: 'manipulation' }}
    >
      {muted ? '🔇' : '🔊'}
    </button>
  );
}

function MicToggle() {
  const { room, isMicOn, toggleMic } = useGame();

  if (!room) return null;

  return (
    <button
      onClick={() => { sound.click(); toggleMic(); }}
      title={isMicOn ? 'Mute Microphone' : 'Turn On Microphone'}
      style={{ touchAction: 'manipulation', right: '56px' }}
      className={`
        fixed top-3 z-50 w-10 h-10 rounded-full flex items-center justify-center text-lg shadow-lg border
        transition-all active:scale-95 cursor-pointer select-none
        ${isMicOn
          ? 'bg-green-500/20 border-green-500/50 text-green-400 glow-teal animate-pulse'
          : 'glass border-white/10 hover:border-white/30 text-white/40'
        }
      `}
    >
      {isMicOn ? '🎤' : '🎙️'}
    </button>
  );
}

function App() {
  return (
    <BrowserRouter>
      <GameProvider>
        <div className="min-h-screen bg-dark-900 relative">
          {/* Leave Room Button & Modal Integration */}
          <LeaveRoomButton />

          {/* Sound & Mic Controls */}
          <MicToggle />
          <SoundToggle />

          {/* Ambient background orbs */}
          <div className="fixed inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-[-20%] left-[-10%] w-72 h-72 sm:w-96 sm:h-96 bg-primary-700/20 rounded-full blur-3xl animate-pulse-slow" />
            <div className="absolute bottom-[-20%] right-[-10%] w-72 h-72 sm:w-96 sm:h-96 bg-accent-600/15 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '2s' }} />
            <div className="absolute top-[40%] right-[20%] w-48 h-48 sm:w-64 sm:h-64 bg-primary-800/10 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '4s' }} />
          </div>

          <AnimatePresence mode="wait">
            <Routes>
              <Route path="/" element={<PhaseRouter />} />
              <Route path="/lobby" element={<LobbyPage />} />
              <Route path="/offline" element={<OfflinePage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </AnimatePresence>
        </div>
      </GameProvider>
    </BrowserRouter>
  );
}

export default App;