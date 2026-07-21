import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { GameProvider, useGame } from './context/GameContext';
import sound from './utils/sound';

// Pages
import HomePage from './pages/HomePage';
import LobbyPage from './pages/LobbyPage';
import WaitingRoomPage from './pages/WaitingRoomPage';
import TableDistributorPage from './pages/TableDistributorPage'; // <--- Updated Table Distributor Page
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
    case 'word-reveal':  return <TableDistributorPage />; // <--- Renders Central Table & Dealer here
    case 'discussion':   return <DiscussionPage />;
    case 'voting':       return <VotingPage />;
    case 'results':      return <ResultsPage />;
    case 'game-over':    return <GameOverPage />;
    default:             return <HomePage />;
  }
}

function SoundToggle() {
  const [muted, setMuted] = useState(sound.isMuted());

  function toggle() {
    const isNowMuted = sound.toggleMute();
    setMuted(isNowMuted);
    if (!isNowMuted) {
      sound.click();
    }
  }

  return (
    <button
      onClick={toggle}
      title={muted ? "Unmute Sound" : "Mute Sound"}
      className="fixed top-4 right-4 z-50 w-11 h-11 rounded-full glass flex items-center justify-center text-xl shadow-lg border border-white/10 hover:border-white/30 transition-all active:scale-95 cursor-pointer select-none"
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
      onClick={() => {
        sound.click();
        toggleMic();
      }}
      title={isMicOn ? "Mute Microphone" : "Turn On Microphone"}
      className={`
        fixed top-4 right-17 z-50 w-11 h-11 rounded-full flex items-center justify-center text-xl shadow-lg border
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
          {/* Sound & Mic Controls */}
          <MicToggle />
          <SoundToggle />

          {/* Ambient background orbs */}
          <div className="fixed inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-[-20%] left-[-10%] w-96 h-96 bg-primary-700/20 rounded-full blur-3xl animate-pulse-slow" />
            <div className="absolute bottom-[-20%] right-[-10%] w-96 h-96 bg-accent-600/15 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '2s' }} />
            <div className="absolute top-[40%] right-[20%] w-64 h-64 bg-primary-800/10 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '4s' }} />
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