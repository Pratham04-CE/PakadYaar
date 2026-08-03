import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import PlayerAvatar from './PlayerAvatar';
import sound from '../utils/sound';

const QUICK_EMOJIS = ['😀', '😂', '🔥', '👍', '😎', '🎉', '😱', '💩'];

// Helper to determine corner/perimeter placement class based on index and total count
function getPerimeterPosition(index, total) {
  if (total === 2) {
    if (index === 0) return 'bottom-4 left-4 sm:bottom-6 sm:left-6';
    return 'bottom-4 right-4 sm:bottom-6 sm:right-6';
  }
  if (total === 3) {
    if (index === 0) return 'top-16 left-4 sm:top-20 sm:left-6';
    if (index === 1) return 'top-16 right-4 sm:top-20 sm:right-6';
    return 'bottom-4 left-1/2 -translate-x-1/2 sm:bottom-6';
  }
  if (total === 4) {
    if (index === 0) return 'top-16 left-4 sm:top-20 sm:left-6';
    if (index === 1) return 'top-16 right-4 sm:top-20 sm:right-6';
    if (index === 2) return 'bottom-4 left-4 sm:bottom-6 sm:left-6';
    return 'bottom-4 right-4 sm:bottom-6 sm:right-6';
  }
  // 5+ Players (Distributed around perimeter edges)
  const positions5Plus = [
    'top-16 left-4 sm:top-20 sm:left-6',          // Top Left
    'top-16 right-4 sm:top-20 sm:right-6',        // Top Right
    'bottom-4 left-4 sm:bottom-6 sm:left-6',       // Bottom Left
    'bottom-4 right-4 sm:bottom-6 sm:right-6',     // Bottom Right
    'top-16 left-1/2 -translate-x-1/2 sm:top-20',   // Top Center
    'bottom-4 left-1/2 -translate-x-1/2 sm:bottom-6',// Bottom Center
    'top-1/2 left-4 -translate-y-1/2 sm:left-6',    // Left Middle
    'top-1/2 right-4 -translate-y-1/2 sm:right-6',  // Right Middle
    'top-1/3 left-4 sm:left-6',
    'top-1/3 right-4 sm:right-6',
  ];
  return positions5Plus[index % positions5Plus.length];
}

export default function TablePerimeterLayout({
  players = [],
  myId,
  turnOrder = [],
  isMicOn = false,
  peerMutedMap = {},
  lobbyMessages = [],
  typingUsers = {},
  sendLobbyMessage,
  setTypingStatus,
  children,
  bgStyle = '',
  bgImage = null,
  tableTitle = ''
}) {
  const [showChatModal, setShowChatModal] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [chatInput, setChatInput] = useState('');
  const chatBottomRef = useRef(null);
  const lastMsgCountRef = useRef(lobbyMessages.length);

  // Track unread messages when chat drawer is closed
  useEffect(() => {
    if (!showChatModal && lobbyMessages.length > lastMsgCountRef.current) {
      setUnreadCount(prev => prev + (lobbyMessages.length - lastMsgCountRef.current));
    }
    lastMsgCountRef.current = lobbyMessages.length;
  }, [lobbyMessages.length, showChatModal]);

  useEffect(() => {
    if (showChatModal) {
      setUnreadCount(0);
      chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [showChatModal, lobbyMessages]);

  const typingNames = Object.values(typingUsers || {}).filter(Boolean);

  function handleSendChat(e) {
    e.preventDefault();
    const trimmed = chatInput.trim();
    if (!trimmed) return;
    if (sendLobbyMessage) sendLobbyMessage(trimmed);
    setChatInput('');
    if (setTypingStatus) setTypingStatus(false);
    sound.click();
  }

  function addEmoji(emoji) {
    setChatInput(prev => `${prev}${emoji}`.slice(0, 240));
    if (setTypingStatus) setTypingStatus(true);
    sound.click();
  }

  return (
    <div
      className={`min-h-screen relative overflow-hidden flex flex-col justify-between select-none ${bgStyle || 'bg-slate-950'}`}
      style={{
        backgroundImage: bgImage ? `url(${bgImage})` : 'none',
        backgroundSize: 'cover',
        backgroundPosition: 'center'
      }}
    >
      <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-[1px] pointer-events-none" />

      {/* Top Navigation Bar: Table Title & Floating Chat Button */}
      <div className="relative z-30 flex items-center justify-between px-4 pt-3 pb-2">
        <div className="flex items-center gap-2 bg-black/60 border border-white/15 backdrop-blur-md rounded-full px-3.5 py-1 text-white text-xs shadow-lg">
          <span>🇮🇳 {tableTitle || 'PakadYaar Table'}</span>
        </div>

        {/* Floating Chat Button */}
        <button
          type="button"
          onClick={() => { sound.click(); setShowChatModal(true); }}
          className="relative flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-primary-600/80 hover:bg-primary-500 text-white font-bold text-xs shadow-xl border border-primary-400/50 backdrop-blur-md transition-all active:scale-95 cursor-pointer"
        >
          <span>💬 Chat</span>
          {unreadCount > 0 && (
            <span className="w-4 h-4 bg-amber-400 text-slate-950 rounded-full text-[10px] font-black flex items-center justify-center shadow animate-bounce">
              {unreadCount}
            </span>
          )}
        </button>
      </div>

      {/* Center Screen: Reserved EXCLUSIVELY for Player's Card */}
      <main className="relative z-20 flex-1 flex items-center justify-center p-4">
        {children}
      </main>

      {/* Perimeter Player Cards (Positioned along laptop screen corners/edges) */}
      <div className="pointer-events-none">
        {players.map((player, idx) => {
          const isMe = player.id === myId;
          const isSpeaking = isMe ? isMicOn : peerMutedMap[player.id] === false;
          const posClass = getPerimeterPosition(idx, players.length);
          const turnPos = turnOrder.indexOf(player.id);

          return (
            <div
              key={player.id || idx}
              className={`absolute z-30 pointer-events-auto flex items-center gap-2 p-2 rounded-2xl border backdrop-blur-md shadow-2xl transition-all duration-300 ${posClass} ${
                isSpeaking
                  ? 'border-emerald-400 bg-emerald-950/80 shadow-emerald-500/20 scale-105'
                  : isMe
                  ? 'border-primary-400/60 bg-primary-950/70'
                  : 'border-white/15 bg-slate-900/80'
              }`}
            >
              {/* Google Meet-style Speaking Animated Avatar */}
              <PlayerAvatar
                avatar={player.avatar}
                name={player.name}
                className="w-11 h-11 sm:w-12 sm:h-12"
                textClassName="text-base sm:text-lg"
                isSpeaking={isSpeaking}
              />

              <div className="flex flex-col min-w-0 pr-1">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs sm:text-sm font-bold text-white truncate max-w-[90px] sm:max-w-[120px]">
                    {isMe ? 'You' : player.name}
                  </span>
                  {turnPos >= 0 && (
                    <span className={`text-[10px] font-black px-1.5 py-0.2 rounded-full ${turnPos === 0 ? 'bg-amber-400 text-black' : 'bg-white/20 text-white'}`}>
                      #{turnPos + 1}
                    </span>
                  )}
                </div>

                {/* Status / Mic indicator */}
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold flex items-center gap-1 ${
                    isSpeaking ? 'bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 animate-pulse' : 'bg-white/10 text-white/50'
                  }`}>
                    {isSpeaking ? '🎤 Speaking' : '🔇 Muted'}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Floating / Collapsible Chat Modal */}
      <AnimatePresence>
        {showChatModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="w-full max-w-md glass-strong p-4 rounded-3xl border border-white/15 shadow-2xl flex flex-col h-[28rem]"
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-3 border-b border-white/10 pb-2">
                <div className="flex items-center gap-2">
                  <span className="text-lg">💬</span>
                  <h3 className="font-bold text-white text-sm">Room Chat & Emojis</h3>
                </div>
                <button
                  type="button"
                  onClick={() => { sound.click(); setShowChatModal(false); }}
                  className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white/70 hover:text-white flex items-center justify-center text-sm font-bold transition-all cursor-pointer"
                >
                  ✕
                </button>
              </div>

              {/* Messages Container */}
              <div className="flex-1 overflow-y-auto space-y-2 pr-1 mb-2 bg-black/40 p-3 rounded-2xl border border-white/10">
                {lobbyMessages.length === 0 ? (
                  <p className="text-white/40 text-xs text-center py-12 italic">No messages yet. Say hello or send an emoji! 👋</p>
                ) : (
                  lobbyMessages.map((msg, index) => (
                    <div key={index} className="text-xs">
                      <span className="font-bold text-primary-300 mr-1.5">{msg.name}:</span>
                      <span className="text-white/90 break-words">{msg.text}</span>
                      <span className="text-[9px] text-white/30 ml-2 float-right">{msg.time}</span>
                    </div>
                  ))
                )}
                <div ref={chatBottomRef} />
              </div>

              {typingNames.length > 0 && (
                <div className="text-[11px] text-amber-300/90 italic mb-1 px-1 flex items-center gap-1.5 animate-pulse">
                  <span>✍️</span>
                  <span>{typingNames.join(', ')} {typingNames.length === 1 ? 'is' : 'are'} typing...</span>
                </div>
              )}

              {/* Quick Emojis */}
              <div className="flex gap-1 mb-2 overflow-x-auto py-1 no-scrollbar">
                {QUICK_EMOJIS.map((emoji, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => addEmoji(emoji)}
                    className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-sm transition-all active:scale-95 cursor-pointer flex-shrink-0"
                    style={{ touchAction: 'manipulation' }}
                  >
                    {emoji}
                  </button>
                ))}
              </div>

              {/* Input Form */}
              <form onSubmit={handleSendChat} className="flex gap-2">
                <input
                  type="text"
                  value={chatInput}
                  onChange={e => {
                    setChatInput(e.target.value.slice(0, 240));
                    if (setTypingStatus) setTypingStatus(e.target.value.trim().length > 0);
                  }}
                  onBlur={() => setTypingStatus && setTypingStatus(false)}
                  placeholder="Type message..."
                  className="flex-1 bg-white/10 border border-white/20 rounded-xl px-3 py-2 text-xs text-white placeholder-white/40 focus:outline-none focus:border-primary-500"
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary-600 hover:bg-primary-500 text-white rounded-xl text-xs font-bold transition-all cursor-pointer active:scale-95 flex-shrink-0"
                >
                  Send 🚀
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
