import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import PlayerAvatar from './PlayerAvatar';
import sound from '../utils/sound';
import voiceChat from '../utils/voiceChat';

const QUICK_EMOJIS = ['😀', '😂', '🔥', '👍', '😎', '🎉', '😱', '💩'];

// Helper to determine corner/perimeter placement class based on index and total count
// Corner filling order FIRST (P1 Top-Left, P2 Bottom-Left, P3 Top-Right, P4 Bottom-Right),
// followed by middle perimeter edges (P_ex Bottom-Center, Top-Center, Left-Middle, Right-Middle).
function getPerimeterPosition(index) {
  const positions = [
    'top-14 left-3 sm:top-16 sm:left-6',             // P1: Top-Left Corner
    'bottom-3 left-3 sm:bottom-6 sm:left-6',       // P2: Bottom-Left Corner
    'top-14 right-3 sm:top-16 sm:right-6',           // P3: Top-Right Corner
    'bottom-3 right-3 sm:bottom-6 sm:right-6',     // P4: Bottom-Right Corner
    'bottom-3 left-1/2 -translate-x-1/2 sm:bottom-6', // P_ex: Bottom-Center Edge
    'top-14 left-1/2 -translate-x-1/2 sm:top-16',      // Top-Center Edge
    'top-1/2 left-3 -translate-y-1/2 sm:left-6',      // Left-Middle Edge
    'top-1/2 right-3 -translate-y-1/2 sm:right-6',    // Right-Middle Edge
    'top-1/3 left-3 sm:left-6',                        // Extra Top-Left Edge
    'top-1/3 right-3 sm:right-6',                      // Extra Top-Right Edge
  ];
  return positions[index % positions.length];
}

export default function TablePerimeterLayout({
  players = [],
  myId,
  turnOrder = [],
  isMicOn = false,
  toggleMic,
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
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);
  const [localPeerMutedMap, setLocalPeerMutedMap] = useState({});
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

      {/* Top Navigation Bar: Table Title ONLY */}
      <div className="relative z-30 flex items-center justify-between px-3 pt-2.5 pb-1.5 sm:px-5 sm:pt-3">
        <div className="flex items-center gap-2 bg-black/70 border border-white/15 backdrop-blur-md rounded-full px-3.5 py-1 text-white text-xs shadow-lg">
          <span>🇮🇳 {tableTitle || 'PakadYaar Table'}</span>
        </div>
      </div>

      {/* Center Screen: Reserved EXCLUSIVELY for Player's Card & Action Buttons with Spacing */}
      <main className="relative z-20 flex-1 flex items-center justify-center p-4 sm:p-6 my-auto max-w-full overflow-y-auto">
        {children}
      </main>

      {/* Perimeter Player Cards (Positioned in corners and perimeter edges) */}
      <div className="pointer-events-none">
        {players.map((player, idx) => {
          const isMe = player.id === myId;
          const posClass = getPerimeterPosition(idx);
          const turnPos = turnOrder.indexOf(player.id);
          const isSpeaking = isMe ? isMicOn : peerMutedMap[player.id] === false;
          const peerMicOn = peerMutedMap[player.id] === false;
          const isPeerMutedByMe = !!localPeerMutedMap[player.id];

          return (
            <div
              key={player.id || idx}
              className={`absolute z-30 pointer-events-auto flex flex-col gap-1.5 p-2 sm:p-2.5 rounded-2xl border backdrop-blur-md shadow-2xl transition-all duration-300 ${posClass} ${
                isSpeaking
                  ? 'border-emerald-400 bg-emerald-950/80 shadow-emerald-500/30 scale-[1.02]'
                  : isMe
                  ? 'border-primary-400/70 bg-primary-950/80 shadow-primary-500/20'
                  : 'border-white/15 bg-slate-900/85'
              }`}
            >
              {/* Avatar + Player Name + Turn Order */}
              <div className="flex items-center gap-2">
                <PlayerAvatar
                  avatar={player.avatar}
                  name={player.name}
                  className="w-10 h-10 sm:w-11 sm:h-11"
                  textClassName="text-xs sm:text-base"
                  isSpeaking={isSpeaking}
                />

                <div className="flex flex-col min-w-0 pr-1">
                  <div className="flex items-center gap-1">
                    <span className="text-xs sm:text-sm font-bold text-white truncate max-w-[85px] sm:max-w-[110px]">
                      {isMe ? 'You' : player.name}
                    </span>
                    {turnPos >= 0 && (
                      <span className={`text-[9px] font-black px-1.5 py-0.2 rounded-full ${turnPos === 0 ? 'bg-amber-400 text-black' : 'bg-white/20 text-white'}`}>
                        #{turnPos + 1}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Mic & Speaker Action Buttons Bar attached to Player Box */}
              <div className="flex items-center gap-1 pt-1 border-t border-white/15 w-full">
                {isMe ? (
                  <>
                    {/* Local Player Mic Button */}
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); sound.click(); if (toggleMic) toggleMic(); }}
                      className={`flex-1 py-1 px-1.5 rounded-lg text-[10px] sm:text-xs font-bold flex items-center justify-center gap-1 transition-all active:scale-95 cursor-pointer shadow ${
                        isMicOn
                          ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-500/30'
                          : 'bg-rose-900/80 hover:bg-rose-800 text-rose-200 border border-rose-500/40'
                      }`}
                      title={isMicOn ? 'Turn Mic Off' : 'Turn Mic On'}
                    >
                      <span>{isMicOn ? '🎤' : '🔇'}</span>
                      <span>{isMicOn ? 'Mic On' : 'Mic Off'}</span>
                    </button>

                    {/* Local Player Speaker Button */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        sound.click();
                        const newState = voiceChat.toggleSpeaker();
                        setIsSpeakerOn(newState);
                      }}
                      className={`flex-1 py-1 px-1.5 rounded-lg text-[10px] sm:text-xs font-bold flex items-center justify-center gap-1 transition-all active:scale-95 cursor-pointer shadow ${
                        isSpeakerOn
                          ? 'bg-sky-600 hover:bg-sky-500 text-white shadow-sky-500/30'
                          : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-600/40'
                      }`}
                      title={isSpeakerOn ? 'Mute Speaker Audio' : 'Unmute Speaker Audio'}
                    >
                      <span>{isSpeakerOn ? '🔊' : '🔇'}</span>
                      <span>{isSpeakerOn ? 'Sound' : 'Muted'}</span>
                    </button>
                  </>
                ) : (
                  <>
                    {/* Remote Player Mic Status Badge */}
                    <span className={`flex-1 py-1 px-1.5 rounded-lg text-[10px] sm:text-xs font-bold flex items-center justify-center gap-1 border ${
                      peerMicOn
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 animate-pulse'
                        : 'bg-white/5 text-white/40 border-white/10'
                    }`}>
                      <span>{peerMicOn ? '🎤' : '🔇'}</span>
                      <span>{peerMicOn ? 'Mic On' : 'Muted'}</span>
                    </span>

                    {/* Remote Peer Speaker Mute Toggle Button */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        sound.click();
                        const isMutedNow = voiceChat.togglePeerAudio(player.id);
                        setLocalPeerMutedMap(prev => ({ ...prev, [player.id]: isMutedNow }));
                      }}
                      className={`flex-1 py-1 px-1.5 rounded-lg text-[10px] sm:text-xs font-bold flex items-center justify-center gap-1 transition-all active:scale-95 cursor-pointer border ${
                        isPeerMutedByMe
                          ? 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border-amber-400/40'
                          : 'bg-sky-500/20 hover:bg-sky-500/30 text-sky-200 border-sky-400/30'
                      }`}
                      title={isPeerMutedByMe ? `Unmute ${player.name}` : `Mute ${player.name}`}
                    >
                      <span>{isPeerMutedByMe ? '🔇' : '🔊'}</span>
                      <span>{isPeerMutedByMe ? 'Muted' : 'Sound'}</span>
                    </button>
                  </>
                )}
              </div>

              {/* Chat Drawer Button attached to Local Player ("You") box */}
              {isMe && (
                <div className="w-full">
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); sound.click(); setShowChatModal(true); }}
                    className="relative w-full py-1 px-2 rounded-lg bg-primary-600 hover:bg-primary-500 text-white text-xs font-bold transition-all active:scale-95 flex items-center justify-center gap-1.5 shadow-md cursor-pointer"
                    title="Open Room Chat"
                  >
                    <span>💬 Chat</span>
                    {unreadCount > 0 && (
                      <span className="w-4 h-4 bg-amber-400 text-slate-950 rounded-full text-[9px] font-black flex items-center justify-center shadow animate-bounce">
                        {unreadCount}
                      </span>
                    )}
                  </button>
                </div>
              )}
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
