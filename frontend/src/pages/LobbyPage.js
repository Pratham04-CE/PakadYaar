import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useGame } from '../context/GameContext';

export default function LobbyPage() {
  const { createRoom, joinRoom, error, clearError, gamePhase } = useGame();
  const navigate = useNavigate();
  const [tab, setTab] = useState('create'); // 'create' | 'join'
  const [playerName, setPlayerName] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [loading, setLoading] = useState(false);

  // Redirect to PhaseRouter at "/" once we're in the room
  useEffect(() => {
    if (gamePhase === 'waiting-room') navigate('/', { replace: true });
  }, [gamePhase, navigate]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { clearError(); }, [tab]);

  function handleCreate(e) {
    e.preventDefault();
    if (!playerName.trim()) return;
    setLoading(true);
    createRoom(playerName.trim());
    setTimeout(() => setLoading(false), 3000);
  }

  function handleJoin(e) {
    e.preventDefault();
    if (!playerName.trim() || !roomCode.trim()) return;
    setLoading(true);
    joinRoom(roomCode.trim().toUpperCase(), playerName.trim());
    setTimeout(() => setLoading(false), 3000);
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -24 }}
      className="min-h-screen flex flex-col items-center justify-center px-4 py-8"
      style={{ paddingTop: '80px' }}
    >
      {/* Header */}
      <motion.div
        initial={{ y: -16, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="text-center mb-6"
      >
        <a href="/" className="inline-flex items-center gap-2 text-white/40 hover:text-white/70 transition-colors mb-5 text-sm">
          ← Back to Home
        </a>
        <div className="flex justify-center mb-2">
          <span className="text-4xl">🎭</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black">
          <span className="text-gradient">Pakad</span>
          <span className="text-white">Yaar</span>
        </h1>
        <p className="text-white/40 mt-1 text-sm">Online Multiplayer</p>
      </motion.div>

      {/* Card */}
      <motion.div
        initial={{ scale: 0.96, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="glass-strong w-full max-w-sm p-6"
      >
        {/* Tabs */}
        <div className="flex rounded-xl bg-white/5 p-1 mb-6">
          {['create', 'join'].map(t => (
            <button
              key={t}
              onClick={() => { setTab(t); clearError(); }}
              style={{ touchAction: 'manipulation' }}
              className={`
                flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200
                ${tab === t ? 'bg-primary-600 text-white shadow-lg' : 'text-white/50 hover:text-white/80'}
              `}
            >
              {t === 'create' ? '🏠 Create' : '🚪 Join'}
            </button>
          ))}
        </div>

        {/* Error */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-rose-500/20 border border-rose-500/40 rounded-xl px-4 py-3 mb-4 text-rose-300 text-sm"
            >
              ⚠️ {error}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Form */}
        <AnimatePresence mode="wait">
          {tab === 'create' ? (
            <motion.form
              key="create"
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 16 }}
              onSubmit={handleCreate}
              className="space-y-4"
            >
              <div>
                <label className="block text-sm text-white/60 mb-2 font-medium">Your Name</label>
                <input
                  id="create-name"
                  className="input"
                  placeholder="Enter your nickname"
                  value={playerName}
                  onChange={e => setPlayerName(e.target.value)}
                  maxLength={20}
                  autoFocus
                />
              </div>

              <button
                type="submit"
                id="create-room-btn"
                disabled={!playerName.trim() || loading}
                className="btn-primary w-full flex items-center justify-center gap-2 py-4 text-base"
                style={{ touchAction: 'manipulation' }}
              >
                {loading ? <span className="animate-spin">⏳</span> : <>🏠 Create Room</>}
              </button>

              <p className="text-xs text-white/30 text-center">
                You'll be the host and share the code with friends.
              </p>
            </motion.form>
          ) : (
            <motion.form
              key="join"
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -16 }}
              onSubmit={handleJoin}
              className="space-y-4"
            >
              <div>
                <label className="block text-sm text-white/60 mb-2 font-medium">Your Name</label>
                <input
                  id="join-name"
                  className="input"
                  placeholder="Enter your nickname"
                  value={playerName}
                  onChange={e => setPlayerName(e.target.value)}
                  maxLength={20}
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm text-white/60 mb-2 font-medium">Room Code</label>
                <input
                  id="join-code"
                  className="input uppercase tracking-widest text-center text-xl font-bold"
                  placeholder="ABC123"
                  value={roomCode}
                  onChange={e => setRoomCode(e.target.value.toUpperCase())}
                  maxLength={6}
                />
              </div>

              <button
                type="submit"
                id="join-room-btn"
                disabled={!playerName.trim() || !roomCode.trim() || loading}
                className="btn-accent w-full flex items-center justify-center gap-2 py-4 text-base"
                style={{ touchAction: 'manipulation' }}
              >
                {loading ? <span className="animate-spin">⏳</span> : <>🚪 Join Room</>}
              </button>

              <p className="text-xs text-white/30 text-center">
                Ask the host for the 6-character room code.
              </p>
            </motion.form>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
}
