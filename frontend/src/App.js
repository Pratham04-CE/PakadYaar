import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { GameProvider, useGame } from './context/GameContext';

// Pages
import HomePage from './pages/HomePage';
import LobbyPage from './pages/LobbyPage';
import WaitingRoomPage from './pages/WaitingRoomPage';
import WordRevealPage from './pages/WordRevealPage';
import DiscussionPage from './pages/DiscussionPage';
import VotingPage from './pages/VotingPage';
import ResultsPage from './pages/ResultsPage';
import GameOverPage from './pages/GameOverPage';
import OfflinePage from './pages/OfflinePage';

// Phase router — renders the right page based on game phase
function PhaseRouter() {
  const { gamePhase } = useGame();

  switch (gamePhase) {
    case 'home':       return <HomePage />;
    case 'lobby':      return <LobbyPage />;
    case 'waiting-room': return <WaitingRoomPage />;
    case 'word-reveal':  return <WordRevealPage />;
    case 'discussion':   return <DiscussionPage />;
    case 'voting':       return <VotingPage />;
    case 'results':      return <ResultsPage />;
    case 'game-over':    return <GameOverPage />;
    default:           return <HomePage />;
  }
}

function App() {
  return (
    <BrowserRouter>
      <GameProvider>
        <div className="min-h-screen bg-dark-900">
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
