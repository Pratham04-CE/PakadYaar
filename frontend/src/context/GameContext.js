import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import socket from '../socket/socket';
//Game context
const GameContext = createContext(null);

export function GameProvider({ children }) {
    const [room, setRoom] = useState(null);          // Current room state
    const [myId, setMyId] = useState(null);           // My socket ID
    const [myWord, setMyWord] = useState(null);        // { word, isImposter }
    const [gamePhase, setGamePhase] = useState('home'); // Current UI phase
    const [timer, setTimer] = useState(null);          // { remaining, phase }
    const [voteData, setVoteData] = useState({});      // { voterId: targetId }
    const [results, setResults] = useState(null);      // Vote results
    const [finalResults, setFinalResults] = useState(null); // Game over data
    const [error, setError] = useState(null);
    const [confirmedCount, setConfirmedCount] = useState(0);
    const [hasConfirmedWord, setHasConfirmedWord] = useState(false);
    const [drawMessage, setDrawMessage] = useState(null);

    // Track socket ID
    useEffect(() => {
        setMyId(socket.id);
        socket.on('connect', () => setMyId(socket.id));
        return () => socket.off('connect');
    }, []);

    // ─── Inbound socket events ────────────────────────────────────────────────
    useEffect(() => {
        // ROOM events
        socket.on('room-created', ({ room }) => {
            setRoom(room);
            setGamePhase('waiting-room');
            setError(null);
        });

        socket.on('join-success', ({ room }) => {
            setRoom(room);
            setGamePhase('waiting-room');
            setError(null);
        });

        socket.on('room-updated', ({ room }) => {
            setRoom(room);
        });

        socket.on('config-updated', ({ config }) => {
            setRoom(prev => prev ? { ...prev, config } : prev);
        });

        socket.on('join-error', ({ message }) => {
            setError(message);
        });

        socket.on('start-error', ({ message }) => {
            setError(message);
        });

        socket.on('error', ({ message }) => {
            setError(message);
        });

        socket.on('player-left', ({ playerId }) => {
            // room-updated handles the player list; playerId here for UI hints
        });

        // GAME events
        socket.on('game-started', ({ room }) => {
            setRoom(room);
            setMyWord(null);
            setVoteData({});
            setResults(null);
            setTimer(null);
            setConfirmedCount(0);
            setHasConfirmedWord(false);
            setDrawMessage(null);
            setGamePhase('word-reveal');
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
        });

        socket.on('timer-tick', ({ remaining, phase }) => {
            setTimer(prev => prev ? { ...prev, remaining } : { remaining, phase });
        });

        socket.on('voting-started', ({ duration, remaining }) => {
            setTimer({ remaining, phase: 'voting', total: duration });
            setVoteData({});
            setGamePhase('voting');
        });

        socket.on('vote-cast', ({ voterId, targetId, totalVotes, expectedVotes }) => {
            setVoteData(prev => ({ ...prev, [voterId]: targetId }));
        });

        socket.on('vote-draw', ({ message }) => {
            setDrawMessage(message);
            setGamePhase('discussion');
        });

        socket.on('vote-results', (data) => {
            setResults(data);
            setRoom(prev => prev ? { ...prev, players: data.scores } : prev);
            setGamePhase('results');
        });

        socket.on('game-over', (data) => {
            setFinalResults(data);
            setGamePhase('game-over');
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

    // ─── Outbound actions ─────────────────────────────────────────────────────
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
        setRoom(null);
        setMyWord(null);
        setResults(null);
        setFinalResults(null);
        setTimer(null);
        setError(null);
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
        // Actions
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
