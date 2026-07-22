import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import socket from '../socket/socket';
import sound from '../utils/sound';
import voiceChat from '../utils/voiceChat';

const GameContext = createContext(null);

// ─────────────────────────────────────────────
// Session persistence helpers (localStorage)
// ─────────────────────────────────────────────
const SESSION_KEY = 'pakadyaar_session';

function saveSession(data) {
    try { localStorage.setItem(SESSION_KEY, JSON.stringify(data)); } catch (_) {}
}

function loadSession() {
    try {
        const raw = localStorage.getItem(SESSION_KEY);
        return raw ? JSON.parse(raw) : null;
    } catch (_) { return null; }
}

function clearSession() {
    try { localStorage.removeItem(SESSION_KEY); } catch (_) {}
}

export function GameProvider({ children }) {
    const [room, setRoom] = useState(null);
    const [myId, setMyId] = useState(null);
    const [myWord, setMyWord] = useState(null);
    const [gamePhase, setGamePhase] = useState('home');
    const [timer, setTimer] = useState(null);
    const [voteData, setVoteData] = useState({});
    const [results, setResults] = useState(null);
    const [finalResults, setFinalResults] = useState(null);
    const [error, setError] = useState(null);
    const [confirmedCount, setConfirmedCount] = useState(0);
    const [hasConfirmedWord, setHasConfirmedWord] = useState(false);
    const [drawMessage, setDrawMessage] = useState(null);
    const [isCardDisabled, setIsCardDisabled] = useState(false);
    const [reconnecting, setReconnecting] = useState(false);

    const [isMicOn, setIsMicOn] = useState(false);
    const [peerMutedMap, setPeerMutedMap] = useState({});

    // ─────────────────────────────────────────────
    // Map gameState (server) -> gamePhase (client)
    // ─────────────────────────────────────────────
    function serverStateToPhase(state) {
        const map = {
            'lobby': 'waiting-room',
            'word-reveal': 'word-reveal',
            'discussion': 'discussion',
            'voting': 'voting',
            'results': 'results',
            'game-over': 'game-over',
        };
        return map[state] || 'waiting-room';
    }

    // ─────────────────────────────────────────────
    // Socket ID + auto-rejoin on (re)connect
    // ─────────────────────────────────────────────
    useEffect(() => {
        setMyId(socket.id);

        function handleConnect() {
            setMyId(socket.id);
            setReconnecting(false);

            // Attempt to rejoin if we have a saved session
            const session = loadSession();
            if (session && session.roomCode && session.playerName) {
                console.log('[GameContext] Attempting rejoin:', session.roomCode, session.playerName);
                socket.emit('rejoin-room', {
                    roomCode: session.roomCode,
                    playerName: session.playerName,
                });
            }
        }

        function handleDisconnect() {
            setReconnecting(true);
        }

        socket.on('connect', handleConnect);
        socket.on('disconnect', handleDisconnect);

        return () => {
            socket.off('connect', handleConnect);
            socket.off('disconnect', handleDisconnect);
        };
    }, []);

    // ─────────────────────────────────────────────
    // Game event listeners
    // ─────────────────────────────────────────────
    useEffect(() => {
        socket.on('room-created', ({ room }) => {
            setRoom(room);
            setGamePhase('waiting-room');
            setError(null);
            saveSession({ roomCode: room.code, playerName: room.players.find(p => p.id === socket.id)?.name, gamePhase: 'waiting-room' });
        });

        socket.on('join-success', ({ room }) => {
            setRoom(room);
            setGamePhase('waiting-room');
            setError(null);
            saveSession({ roomCode: room.code, playerName: room.players.find(p => p.id === socket.id)?.name, gamePhase: 'waiting-room' });
        });

        // ─── Rejoin success — restore state after refresh ───
        socket.on('rejoin-success', ({ room, gameState }) => {
            setRoom(room);
            const phase = serverStateToPhase(gameState);
            setGamePhase(phase);
            setError(null);
            setReconnecting(false);
            const me = room.players.find(p => p.id === socket.id);
            if (me) {
                saveSession({ roomCode: room.code, playerName: me.name, gamePhase: phase });
            }
            console.log('[GameContext] Rejoined room', room.code, '— phase:', phase);
        });

        socket.on('rejoin-error', ({ message }) => {
            clearSession();
            setReconnecting(false);
            console.log('[GameContext] Rejoin failed:', message);
        });

        socket.on('room-updated', ({ room }) => {
            setRoom(room);
        });

        socket.on('config-updated', ({ config }) => {
            setRoom(prev => prev ? { ...prev, config } : prev);
        });

        socket.on('join-error', ({ message }) => setError(message));
        socket.on('start-error', ({ message }) => setError(message));
        socket.on('error', ({ message }) => setError(message));

        // ─── Kicked from room ───
        socket.on('kicked-from-room', ({ message }) => {
            clearSession();
            voiceChat.closeAll();
            setIsMicOn(false);
            setPeerMutedMap({});
            setRoom(null);
            setMyWord(null);
            setResults(null);
            setFinalResults(null);
            setTimer(null);
            setIsCardDisabled(false);
            setGamePhase('home');
            setError(message || 'You were removed from the room.');
        });

        socket.on('player-left', ({ playerId }) => {
            voiceChat.closePeerConnection(playerId);
            setPeerMutedMap(prev => {
                const next = { ...prev };
                delete next[playerId];
                return next;
            });
        });

        // Temporarily disconnected (grace period) — just update room state when server sends room-updated
        socket.on('player-disconnected', ({ playerId, playerName }) => {
            console.log(`[GameContext] ${playerName} temporarily disconnected`);
        });

        socket.on('user-joined-voice', ({ playerId }) => {
            if (playerId !== socket.id) {
                const isInitiator = socket.id < playerId;
                voiceChat.createPeerConnection(playerId, socket, isInitiator);
            }
        });

        socket.on('voice-signal', ({ senderId, signal }) => {
            if (senderId !== socket.id) {
                voiceChat.handleSignal(senderId, signal, socket);
            }
        });

        socket.on('voice-mute-status', ({ playerId, isMuted }) => {
            setPeerMutedMap(prev => ({ ...prev, [playerId]: isMuted }));
        });

        socket.on('game-started', ({ room }) => {
            setRoom(room);
            setMyWord(null);
            setVoteData({});
            setResults(null);
            setTimer(null);
            setConfirmedCount(0);
            setHasConfirmedWord(false);
            setDrawMessage(null);
            setIsCardDisabled(false);
            setGamePhase('word-reveal');
            sound.start();
            const me = room.players.find(p => p.id === socket.id);
            if (me) saveSession({ roomCode: room.code, playerName: me.name, gamePhase: 'word-reveal' });
        });

        socket.on('your-word', (assignment) => {
            setMyWord(assignment);
        });

        socket.on('word-confirmed', ({ confirmedCount }) => {
            setConfirmedCount(confirmedCount);
            setRoom(prev => prev ? { ...prev, confirmedCount } : prev);
        });

        socket.on('discussion-started', ({ duration, remaining }) => {
            setTimer({ remaining, phase: 'discussion', total: duration });
            setGamePhase('discussion');
            setDrawMessage(null);
            setIsCardDisabled(false);
            sound.start();
            const session = loadSession();
            if (session) saveSession({ ...session, gamePhase: 'discussion' });
        });

        socket.on('timer-tick', ({ remaining, phase }) => {
            setTimer(prev => prev ? { ...prev, remaining } : { remaining, phase });
            if (remaining <= 15 && remaining > 0) {
                sound.tick(remaining);
            }
        });

        socket.on('voting-started', ({ duration, remaining }) => {
            setTimer({ remaining, phase: 'voting', total: duration });
            setVoteData({});
            setGamePhase('voting');
            setIsCardDisabled(true);
            sound.start();
            const session = loadSession();
            if (session) saveSession({ ...session, gamePhase: 'voting' });
        });

        socket.on('vote-cast', ({ voterId, targetId }) => {
            setVoteData(prev => ({ ...prev, [voterId]: targetId }));
            sound.vote();
        });

        socket.on('vote-draw', ({ message }) => {
            setDrawMessage(message);
            setGamePhase('discussion');
            setIsCardDisabled(false);
            sound.draw();
            const session = loadSession();
            if (session) saveSession({ ...session, gamePhase: 'discussion' });
        });

        socket.on('vote-results', (data) => {
            setResults(data);
            setRoom(prev => prev ? { ...prev, players: data.scores } : prev);
            setGamePhase('results');
            if (data.winnerSide === 'players') {
                sound.victory();
            } else {
                sound.defeat();
            }
            const session = loadSession();
            if (session) saveSession({ ...session, gamePhase: 'results' });
        });

        socket.on('game-over', (data) => {
            setFinalResults(data);
            setGamePhase('game-over');
            sound.victory();
            const session = loadSession();
            if (session) saveSession({ ...session, gamePhase: 'game-over' });
        });

        socket.on('game-reset', ({ room }) => {
            setRoom(room);
            setMyWord(null);
            setVoteData({});
            setResults(null);
            setFinalResults(null);
            setTimer(null);
            setConfirmedCount(0);
            setHasConfirmedWord(false);
            setDrawMessage(null);
            setIsCardDisabled(false);
            setGamePhase('waiting-room');
            const me = room.players.find(p => p.id === socket.id);
            if (me) saveSession({ roomCode: room.code, playerName: me.name, gamePhase: 'waiting-room' });
        });

        return () => {
            socket.off('room-created');
            socket.off('join-success');
            socket.off('rejoin-success');
            socket.off('rejoin-error');
            socket.off('room-updated');
            socket.off('config-updated');
            socket.off('join-error');
            socket.off('start-error');
            socket.off('error');
            socket.off('kicked-from-room');
            socket.off('player-left');
            socket.off('player-disconnected');
            socket.off('user-joined-voice');
            socket.off('voice-signal');
            socket.off('voice-mute-status');
            socket.off('game-started');
            socket.off('your-word');
            socket.off('word-confirmed');
            socket.off('discussion-started');
            socket.off('timer-tick');
            socket.off('voting-started');
            socket.off('vote-cast');
            socket.off('vote-draw');
            socket.off('vote-results');
            socket.off('game-over');
            socket.off('game-reset');
        };
    }, []);

    const toggleMic = useCallback(async () => {
        if (!voiceChat.isInitialized()) {
            const stream = await voiceChat.startLocalStream();
            if (!stream) {
                setError('Microphone permission denied or device unavailable.');
                return false;
            }
        }

        const isMuted = voiceChat.toggleMic();
        setIsMicOn(!isMuted);
        socket.emit('voice-mute-status', { isMuted });
        socket.emit('join-voice');

        if (room && room.players) {
            room.players.forEach(p => {
                if (p.id !== socket.id) {
                    const isInitiator = socket.id < p.id;
                    voiceChat.createPeerConnection(p.id, socket, isInitiator);
                }
            });
        }

        return !isMuted;
    }, [room]);

    const createRoom = useCallback((playerName) => {
        setError(null);
        socket.emit('create-room', { playerName });
    }, []);

    const joinRoom = useCallback((roomCode, playerName) => {
        setError(null);
        socket.emit('join-room', { roomCode, playerName });
    }, []);

    const leaveRoom = useCallback(() => {
        clearSession(); // Intentional leave — don't auto-rejoin
        socket.emit('leave-room');
        voiceChat.closeAll();
        setIsMicOn(false);
        setPeerMutedMap({});
        setRoom(null);
        setMyWord(null);
        setResults(null);
        setFinalResults(null);
        setTimer(null);
        setError(null);
        setIsCardDisabled(false);
        setGamePhase('home');
    }, []);

    const kickPlayer = useCallback((playerId) => {
        socket.emit('kick-player', { playerId });
    }, []);

    const updateConfig = useCallback((config) => {
        socket.emit('update-config', { config });
    }, []);

    const startGame = useCallback(() => {
        setError(null);
        socket.emit('start-game');
    }, []);

    const confirmWord = useCallback(() => {
        socket.emit('confirm-word');
        setHasConfirmedWord(true);
    }, []);

    const startDiscussion = useCallback(() => {
        socket.emit('start-discussion');
    }, []);

    const castVote = useCallback((targetId) => {
        socket.emit('cast-vote', { targetId });
    }, []);

    const nextRound = useCallback(() => {
        socket.emit('next-round');
    }, []);

    const playAgain = useCallback(() => {
        socket.emit('play-again');
    }, []);

    const clearError = useCallback(() => setError(null), []);

    const isHost = room && myId && room.host === myId;
    const myPlayer = room?.players?.find(p => p.id === myId);

    const value = {
        socket,
        room,
        myId,
        myWord,
        gamePhase,
        timer,
        voteData,
        results,
        finalResults,
        error,
        confirmedCount,
        hasConfirmedWord,
        drawMessage,
        isHost,
        myPlayer,
        isCardDisabled,
        isMicOn,
        peerMutedMap,
        reconnecting,
        toggleMic,
        createRoom,
        joinRoom,
        leaveRoom,
        kickPlayer,
        updateConfig,
        startGame,
        confirmWord,
        startDiscussion,
        castVote,
        nextRound,
        playAgain,
        clearError,
    };

    return (
        <GameContext.Provider value={value}>
            {children}
            {/* Reconnecting overlay */}
            {reconnecting && (
                <div style={{
                    position: 'fixed', inset: 0, zIndex: 9999,
                    background: 'rgba(10,10,20,0.85)',
                    display: 'flex', flexDirection: 'column',
                    alignItems: 'center', justifyContent: 'center',
                    backdropFilter: 'blur(8px)',
                }}>
                    <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>🔄</div>
                    <p style={{ color: '#a78bfa', fontWeight: 700, fontSize: '1.1rem' }}>Reconnecting…</p>
                    <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.85rem', marginTop: '6px' }}>
                        Don't close this tab — you'll rejoin automatically
                    </p>
                </div>
            )}
        </GameContext.Provider>
    );
}

export function useGame() {
    const ctx = useContext(GameContext);
    if (!ctx) throw new Error('useGame must be used within GameProvider');
    return ctx;
}

export default GameContext;