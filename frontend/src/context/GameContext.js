import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import socket from '../socket/socket';
import sound from '../utils/sound';
import voiceChat from '../utils/voiceChat';

const GameContext = createContext(null);

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
    const [leaveNotification, setLeaveNotification] = useState(null);

    // Lobby Chat & Typing States
    const [lobbyMessages, setLobbyMessages] = useState([]);
    const [typingUsers, setTypingUsers] = useState({});

    const [isMicOn, setIsMicOn] = useState(false);
    const [peerMutedMap, setPeerMutedMap] = useState({});

    useEffect(() => {
        setMyId(socket.id);
        socket.on('connect', () => setMyId(socket.id));
        return () => socket.off('connect');
    }, []);

    useEffect(() => {
        socket.on('room-created', ({ room }) => {
            setRoom(room);
            setGamePhase('waiting-room');
            setError(null);
            setLobbyMessages([]);
        });

        socket.on('join-success', ({ room }) => {
            setRoom(room);
            setGamePhase('waiting-room');
            setError(null);
            setLobbyMessages([]);
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

        // --- FIXED: Player Left Notification with Exact Name Lookup ---
        socket.on('player-left', ({ playerId, playerName }) => {
            // Agar backend se name nahi aaya toh room players list me se dhoond lo
            let nameToDisplay = playerName;
            if (!nameToDisplay && room && room.players) {
                const foundPlayer = room.players.find(p => p.id === playerId);
                if (foundPlayer) nameToDisplay = foundPlayer.name;
            }

            setLeaveNotification(`${nameToDisplay || 'A player'} has left the room.`);
            setTimeout(() => setLeaveNotification(null), 4000);

            voiceChat.closePeerConnection(playerId);
            setPeerMutedMap(prev => {
                const next = { ...prev };
                delete next[playerId];
                return next;
            });
        });

        socket.on('lobby-message-received', (messageData) => {
            setLobbyMessages(prev => [...prev, messageData]);
        });

        socket.on('user-typing-status', ({ playerId, playerName, isTyping }) => {
            setTypingUsers(prev => {
                const updated = { ...prev };
                if (isTyping) {
                    updated[playerId] = playerName;
                } else {
                    delete updated[playerId];
                }
                return updated;
            });
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
        });

        socket.on('game-over', (data) => {
            setFinalResults(data);
            setGamePhase('game-over');
            sound.victory();
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
        });

        return () => {
            socket.off('room-created');
            socket.off('join-success');
            socket.off('room-updated');
            socket.off('config-updated');
            socket.off('join-error');
            socket.off('start-error');
            socket.off('error');
            socket.off('player-left');
            socket.off('lobby-message-received');
            socket.off('user-typing-status');
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
    }, [room]);

    const sendLobbyMessage = useCallback((text) => {
        if (!text || !text.trim()) return;
        socket.emit('send-lobby-message', { text: text.trim() });
    }, []);

    const setTypingStatus = useCallback((isTyping) => {
        socket.emit('typing-status', { isTyping });
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
        setLeaveNotification(null);
        setLobbyMessages([]);
        setGamePhase('home');
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

    const kickPlayer = useCallback((playerId) => {
        socket.emit('kick-player', { playerId });
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
        leaveNotification,
        lobbyMessages,
        typingUsers,
        sendLobbyMessage,
        setTypingStatus,
        isMicOn,
        peerMutedMap,
        toggleMic,
        createRoom,
        joinRoom,
        leaveRoom,
        updateConfig,
        startGame,
        confirmWord,
        startDiscussion,
        castVote,
        nextRound,
        playAgain,
        kickPlayer,
        clearError,
    };

    return (
        <GameContext.Provider value={value}>
            {children}
        </GameContext.Provider>
    );
}

export function useGame() {
    const ctx = useContext(GameContext);
    if (!ctx) throw new Error('useGame must be used within GameProvider');
    return ctx;
}

export default GameContext;