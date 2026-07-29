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
    const [turnOrder, setTurnOrder] = useState([]);

    const [lobbyMessages, setLobbyMessages] = useState([]);
    const [typingUsers, setTypingUsers] = useState({});

    const [isMicOn, setIsMicOn] = useState(false);
    const [peerMutedMap, setPeerMutedMap] = useState({});

    const speakRegionalDealer = useCallback((text, themeKey = 'gujarat') => {
        if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel();
            const utterance = new SpeechSynthesisUtterance(text);
            
            if (themeKey === 'gujarat') utterance.lang = 'gu-IN';
            else if (themeKey === 'maharashtra') utterance.lang = 'mr-IN';
            else if (themeKey === 'kerala') utterance.lang = 'ml-IN';
            else if (themeKey === 'assam') utterance.lang = 'as-IN';
            else utterance.lang = 'hi-IN';

            utterance.rate = 1.0;
            window.speechSynthesis.speak(utterance);
        }
    }, []);

    useEffect(() => {
        function handleConnect() {
            setMyId(socket.id);
            const savedSession = sessionStorage.getItem('pakadyaar_session');
            if (savedSession) {
                try {
                    const { roomCode, playerName, avatar } = JSON.parse(savedSession);
                    if (roomCode && playerName) {
                        socket.emit('rejoin-room', { roomCode, playerName, avatar });
                    }
                } catch (e) {
                    sessionStorage.removeItem('pakadyaar_session');
                }
            }
        }

        if (socket.connected) {
            setMyId(socket.id);
        }
        socket.on('connect', handleConnect);
        return () => socket.off('connect', handleConnect);
    }, []);

    function serverStateToPhase(gameState) {
        switch (gameState) {
            case 'lobby':       return 'waiting-room';
            case 'word-reveal': return 'word-reveal';
            case 'discussion':  return 'discussion';
            case 'voting':      return 'voting';
            case 'results':     return 'results';
            case 'game-over':   return 'game-over';
            default:            return 'waiting-room';
        }
    }

    useEffect(() => {
        socket.on('voice-signal', ({ senderId, signal }) => {
            voiceChat.handleSignal(senderId, signal, socket);
        });

        socket.on('user-joined-voice', ({ playerId }) => {
            voiceChat.createPeerConnection(playerId, socket, true);
            setPeerMutedMap(prev => ({ ...prev, [playerId]: false }));
        });

        socket.on('voice-mute-status', ({ playerId, isMuted }) => {
            setPeerMutedMap(prev => ({ ...prev, [playerId]: isMuted }));
        });

        return () => {
            socket.off('voice-signal');
            socket.off('user-joined-voice');
            socket.off('voice-mute-status');
        };
    }, []);

    useEffect(() => {
        socket.on('lobby-message-received', (message) => {
            setLobbyMessages(prev => [...prev, message]);
        });

        socket.on('user-typing-status', ({ playerId, playerName, isTyping }) => {
            setTypingUsers(prev => {
                const next = { ...prev };
                if (isTyping) {
                    next[playerId] = playerName;
                } else {
                    delete next[playerId];
                }
                return next;
            });
        });

        return () => {
            socket.off('lobby-message-received');
            socket.off('user-typing-status');
        };
    }, []);

    useEffect(() => {
        socket.on('room-created', ({ room }) => {
            setRoom(room);
            setGamePhase('waiting-room');
            setError(null);
            setLobbyMessages([]);
            const myPlayer = room.players.find(p => p.id === socket.id);
            if (myPlayer) {
                sessionStorage.setItem('pakadyaar_session', JSON.stringify({
                    roomCode: room.code,
                    playerName: myPlayer.name,
                    avatar: myPlayer.avatar
                }));
            }
        });

        socket.on('join-success', ({ room }) => {
            setRoom(room);
            setGamePhase('waiting-room');
            setError(null);
            setLobbyMessages([]);
            const myPlayer = room.players.find(p => p.id === socket.id);
            if (myPlayer) {
                sessionStorage.setItem('pakadyaar_session', JSON.stringify({
                    roomCode: room.code,
                    playerName: myPlayer.name,
                    avatar: myPlayer.avatar
                }));
            }
        });

        socket.on('rejoin-success', ({ room, gameState }) => {
            setRoom(room);
            setError(null);
            setLobbyMessages([]);
            const phase = serverStateToPhase(gameState);
            setGamePhase(phase);
            if (room.turnOrder && room.turnOrder.length > 0) {
                setTurnOrder(room.turnOrder);
            }
            const myPlayer = room.players.find(p => p.id === socket.id);
            if (myPlayer) {
                sessionStorage.setItem('pakadyaar_session', JSON.stringify({
                    roomCode: room.code,
                    playerName: myPlayer.name,
                    avatar: myPlayer.avatar
                }));
            }
        });

        socket.on('rejoin-error', ({ message }) => {
            sessionStorage.removeItem('pakadyaar_session');
            setRoom(null);
            setGamePhase('home');
            setError(message);
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

        socket.on('player-left', ({ playerId, playerName }) => {
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

        socket.on('player-disconnected', ({ playerName }) => {
            setLeaveNotification(`${playerName || 'A player'} lost connection… waiting for reconnect.`);
            setTimeout(() => setLeaveNotification(null), 6000);
        });

        socket.on('kicked-from-room', ({ message }) => {
            sessionStorage.removeItem('pakadyaar_session');
            voiceChat.closeAll();
            setIsMicOn(false);
            setPeerMutedMap({});
            setRoom(null);
            setMyWord(null);
            setResults(null);
            setFinalResults(null);
            setTimer(null);
            setError(message || 'You were removed from the room.');
            setLobbyMessages([]);
            setGamePhase('home');
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
            if (room.turnOrder && room.turnOrder.length > 0) {
                setTurnOrder(room.turnOrder);
            }
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

        socket.on('discussion-started', ({ duration, remaining, turnOrder: to }) => {
            setTimer({ remaining, phase: 'discussion', total: duration });
            setGamePhase('discussion');
            setDrawMessage(null);
            setIsCardDisabled(false);
            if (to && to.length > 0) setTurnOrder(to);
            sound.start();
            
            const themeKey = room?.config?.theme || 'gujarat';
            speakRegionalDealer("Charcha shuru ho gayi hai, savdhan rahein!", themeKey);
        });

        socket.on('timer-tick', ({ remaining, phase }) => {
            setTimer(prev => prev ? { ...prev, remaining } : { remaining, phase });
            if (remaining <= 15 && remaining > 0) {
                sound.tick(remaining);
                if (remaining === 10) {
                    const themeKey = room?.config?.theme || 'gujarat';
                    speakRegionalDealer("Samay samapt hone wala hai!", themeKey);
                }
            }
        });

        socket.on('voting-started', ({ duration, remaining }) => {
            setTimer({ remaining, phase: 'voting', total: duration });
            setVoteData({});
            setGamePhase('voting');
            setIsCardDisabled(true);
            sound.start();
            
            const themeKey = room?.config?.theme || 'gujarat';
            speakRegionalDealer("Matdan ka samay shuru ho chuka hai!", themeKey);
        });

        socket.on('vote-cast', ({ voterId, targetId }) => {
            setVoteData(prev => ({ ...prev, [voterId]: targetId }));
        });

        socket.on('vote-draw', ({ message }) => {
            setDrawMessage(message || "It's a tie! More discussion time added.");
            setIsCardDisabled(false);
            setGamePhase('discussion');
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
            socket.off('rejoin-success');
            socket.off('rejoin-error');
            socket.off('room-updated');
            socket.off('config-updated');
            socket.off('player-left');
            socket.off('player-disconnected');
            socket.off('kicked-from-room');
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
    }, [room, speakRegionalDealer]);

    const createRoom = useCallback((playerName, avatar) => {
        setError(null);
        socket.emit('create-room', { playerName, avatar });
    }, []);

    const joinRoom = useCallback((roomCode, playerName, avatar) => {
        setError(null);
        socket.emit('join-room', { roomCode, playerName, avatar });
    }, []);

    const leaveRoom = useCallback(() => {
        socket.emit('leave-room');
        sessionStorage.removeItem('pakadyaar_session');
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

    const toggleMic = useCallback(async () => {
        if (!voiceChat.isInitialized()) {
            const stream = await voiceChat.startLocalStream();
            if (!stream) return;
            socket.emit('join-voice');
        }
        const nowMuted = voiceChat.toggleMic();
        const nowOn = !nowMuted;
        setIsMicOn(nowOn);
        socket.emit('voice-mute-status', { isMuted: nowMuted });
    }, []);

    const sendLobbyMessage = useCallback((text) => {
        socket.emit('send-lobby-message', { text });
    }, []);

    const setTypingStatus = useCallback((isTyping) => {
        socket.emit('typing-status', { isTyping });
    }, []);

    const value = {
        socket, room, myId, myWord, gamePhase, timer, voteData, results, finalResults,
        error, confirmedCount, hasConfirmedWord, drawMessage, isHost, myPlayer,
        isCardDisabled, leaveNotification, lobbyMessages, typingUsers,
        sendLobbyMessage, setTypingStatus,
        isMicOn, peerMutedMap, toggleMic, turnOrder,
        createRoom, joinRoom, leaveRoom, updateConfig, startGame,
        confirmWord, startDiscussion, castVote, nextRound, playAgain, kickPlayer, clearError
    };

    return (
        <GameContext.Provider value={value}>
            {children}
            {leaveNotification && (
                <div className="fixed top-4 left-4 right-4 sm:left-1/2 sm:-translate-x-1/2 sm:max-w-md z-50 bg-rose-600 text-white px-4 py-2.5 rounded-xl shadow-2xl text-xs font-bold animate-bounce text-center">
                    ⚠️ {leaveNotification}
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