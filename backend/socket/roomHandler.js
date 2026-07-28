const rooms = require('../state/rooms');
const playerRooms = require('../state/playerRooms');
const generateRoomCode = require('../utils/roomCode');
const assignWords = require('../utils/assignWords');

// Default game configuration
const DEFAULT_CONFIG = {
    rounds: 3,
    imposters: 1,
    category: 'food',
    difficulty: 'all',
    language: 'en',
    discussionTime: 120,
    votingTime: 60
};

// Grace-period timers: socketId -> setTimeout handle
const disconnectTimers = new Map();
const GRACE_MS = 15000; // 15 seconds — long enough for a page refresh on slow connections


function roomHandler(io, socket) {

    // ─────────────────────────────────────────────
    // CREATE ROOM
    // ─────────────────────────────────────────────
    socket.on('create-room', ({ playerName }) => {
        if (!playerName || !playerName.trim()) {
            socket.emit('error', { message: 'Player name is required' });
            return;
        }

        let code;
        do { code = generateRoomCode(); } while (rooms.has(code));

        const player = {
            id: socket.id,
            name: playerName.trim(),
            isHost: true,
            score: 0,
            avatar: generateAvatar(playerName.trim())
        };

        const room = {
            code,
            host: socket.id,
            players: [player],
            config: { ...DEFAULT_CONFIG },
            gameState: 'lobby',
            currentRound: 0,
            totalRounds: DEFAULT_CONFIG.rounds,
            words: {},
            votes: {},
            timers: {},
            confirmedWords: new Set()
        };

        rooms.set(code, room);
        playerRooms.set(socket.id, code);
        socket.join(code);

        socket.emit('room-created', { room: sanitizeRoom(room) });
        console.log(`Room ${code} created by ${playerName}`);
    });

    // ─────────────────────────────────────────────
    // JOIN ROOM
    // ─────────────────────────────────────────────
    socket.on('join-room', ({ roomCode, playerName }) => {
        if (!playerName || !playerName.trim()) {
            socket.emit('join-error', { message: 'Player name is required' });
            return;
        }

        const code = (roomCode || '').trim().toUpperCase();
        const room = rooms.get(code);

        if (!room) {
            socket.emit('join-error', { message: 'Room not found. Check the code and try again.' });
            return;
        }
        if (room.gameState !== 'lobby') {
            socket.emit('join-error', { message: 'Game is already in progress.' });
            return;
        }
        if (room.players.length >= 10) {
            socket.emit('join-error', { message: 'Room is full (max 10 players).' });
            return;
        }

        const player = {
            id: socket.id,
            name: playerName.trim(),
            isHost: false,
            score: 0,
            avatar: generateAvatar(playerName.trim())
        };

        room.players.push(player);
        playerRooms.set(socket.id, code);
        socket.join(code);

        socket.emit('join-success', { room: sanitizeRoom(room) });
        socket.to(code).emit('room-updated', { room: sanitizeRoom(room) });
        console.log(`${playerName} joined room ${code}`);
    });

    // ─────────────────────────────────────────────
    // REJOIN ROOM (after page refresh / reconnect)
    // ─────────────────────────────────────────────
    socket.on('rejoin-room', ({ roomCode, playerName }) => {
        if (!roomCode || !playerName) {
            socket.emit('rejoin-error', { message: 'Missing room code or player name.' });
            return;
        }

        const code = (roomCode || '').trim().toUpperCase();
        const room = rooms.get(code);

        if (!room) {
            socket.emit('rejoin-error', { message: 'Room no longer exists.' });
            return;
        }

        const name = playerName.trim();
        const playerIndex = room.players.findIndex(p => p.name === name);

        if (playerIndex === -1) {
            socket.emit('rejoin-error', { message: 'Player not found in room.' });
            return;
        }

        const oldSocketId = room.players[playerIndex].id;

        if (disconnectTimers.has(oldSocketId)) {
            clearTimeout(disconnectTimers.get(oldSocketId));
            disconnectTimers.delete(oldSocketId);
            console.log(`Grace period cancelled for ${name} (${oldSocketId})`);
        }

        const player = room.players[playerIndex];
        playerRooms.delete(oldSocketId);

        player.id = socket.id;
        playerRooms.set(socket.id, code);
        socket.join(code);

        if (room.host === oldSocketId) {
            room.host = socket.id;
        }

        if (room.confirmedWords.has(oldSocketId)) {
            room.confirmedWords.delete(oldSocketId);
            room.confirmedWords.add(socket.id);
        }

        if (room.votes && room.votes[oldSocketId] !== undefined) {
            room.votes[socket.id] = room.votes[oldSocketId];
            delete room.votes[oldSocketId];
        }

        if (room.votes) {
            for (const [voterId, targetId] of Object.entries(room.votes)) {
                if (targetId === oldSocketId) {
                    room.votes[voterId] = socket.id;
                }
            }
        }

        console.log(`${name} rejoined room ${code} (${oldSocketId} -> ${socket.id})`);

        socket.emit('rejoin-success', {
            room: sanitizeRoom(room),
            gameState: room.gameState
        });

        if (room.words && room.words[socket.id]) {
            socket.emit('your-word', room.words[socket.id]);
        } else if (room.words && room.words[oldSocketId]) {
            room.words[socket.id] = room.words[oldSocketId];
            delete room.words[oldSocketId];
            socket.emit('your-word', room.words[socket.id]);
        }

        io.to(code).emit('room-updated', { room: sanitizeRoom(room) });
    });

    // ─────────────────────────────────────────────
    // LEAVE ROOM (intentional quit)
    // ─────────────────────────────────────────────
    socket.on('leave-room', () => {
        handleLeave(io, socket);
    });

    // ─────────────────────────────────────────────
    // KICK PLAYER (host only)
    // ─────────────────────────────────────────────
    socket.on('kick-player', ({ playerId }) => {
        const roomCode = playerRooms.get(socket.id);
        if (!roomCode) return;
        const room = rooms.get(roomCode);
        if (!room || room.host !== socket.id) return;
        if (playerId === socket.id) return;

        const target = room.players.find(p => p.id === playerId);
        if (!target) return;

        room.players = room.players.filter(p => p.id !== playerId);
        room.confirmedWords.delete(playerId);
        playerRooms.delete(playerId);

        if (disconnectTimers.has(playerId)) {
            clearTimeout(disconnectTimers.get(playerId));
            disconnectTimers.delete(playerId);
        }

        io.to(playerId).emit('kicked-from-room', { message: 'You were removed by the host.' });
        io.to(roomCode).emit('room-updated', { room: sanitizeRoom(room) });
        io.to(roomCode).emit('player-left', { playerId, playerName: target.name });

        console.log(`${target.name} was kicked from room ${roomCode}`);
    });

    // ─────────────────────────────────────────────
    // UPDATE CONFIG (host only)
    // ─────────────────────────────────────────────
    socket.on('update-config', ({ config }) => {
        const roomCode = playerRooms.get(socket.id);
        if (!roomCode) return;
        const room = rooms.get(roomCode);
        if (!room || room.host !== socket.id) return;
        if (room.gameState !== 'lobby') return;

        room.config = { ...room.config, ...config };
        room.totalRounds = room.config.rounds;

        io.to(roomCode).emit('config-updated', { config: room.config });
    });

    // ─────────────────────────────────────────────
    // START GAME (host only)
    // ─────────────────────────────────────────────
    socket.on('start-game', () => {
        const roomCode = playerRooms.get(socket.id);
        if (!roomCode) return;
        const room = rooms.get(roomCode);

        if (!room) return;
        if (room.host !== socket.id) {
            socket.emit('error', { message: 'Only the host can start the game.' });
            return;
        }
        if (room.players.length < 3) {
            socket.emit('start-error', { message: 'Need at least 3 players to start.' });
            return;
        }

        startNewRound(io, room);
    });

    // ─────────────────────────────────────────────
    // CONFIRM WORD SEEN
    // ─────────────────────────────────────────────
    socket.on('confirm-word', () => {
        const roomCode = playerRooms.get(socket.id);
        if (!roomCode) return;
        const room = rooms.get(roomCode);
        if (!room || room.gameState !== 'word-reveal') return;

        room.confirmedWords.add(socket.id);

        io.to(roomCode).emit('word-confirmed', {
            playerId: socket.id,
            confirmedCount: room.confirmedWords.size,
            totalPlayers: room.players.length
        });
    });

    // ─────────────────────────────────────────────
    // LOBBY & DISCUSSION CHAT & TYPING EVENTS
    // ─────────────────────────────────────────────
    socket.on('send-lobby-message', ({ text }) => {
        const roomCode = playerRooms.get(socket.id);
        if (!roomCode) return;
        const room = rooms.get(roomCode);
        if (!room) return;

        const player = room.players.find(p => p.id === socket.id);
        const playerName = player ? player.name : 'Unknown';
        const messageText = typeof text === 'string' ? text.trim() : '';

        if (!messageText) return;

        const messageData = {
            id: `${socket.id}-${Date.now()}`,
            playerId: socket.id,
            name: playerName,
            text: messageText.slice(0, 240),
            // Send raw UTC epoch so each client can format in their own local timezone
            sentAt: new Date().toISOString(),
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) // fallback
        };

        io.to(roomCode).emit('lobby-message-received', messageData);
    });

    socket.on('typing-status', ({ isTyping }) => {
        const roomCode = playerRooms.get(socket.id);
        if (!roomCode) return;
        const room = rooms.get(roomCode);
        if (!room) return;

        const player = room.players.find(p => p.id === socket.id);
        const playerName = player ? player.name : 'Someone';

        socket.to(roomCode).emit('user-typing-status', {
            playerId: socket.id,
            playerName: playerName,
            isTyping: Boolean(isTyping)
        });
    });

    // ─────────────────────────────────────────────
    // DISCONNECT
    // ─────────────────────────────────────────────
    socket.on('disconnect', () => {
        const roomCode = playerRooms.get(socket.id);
        if (!roomCode) return;

        const room = rooms.get(roomCode);
        if (!room) {
            playerRooms.delete(socket.id);
            return;
        }

        const player = room.players.find(p => p.id === socket.id);
        if (!player) return;

        console.log(`${player.name} disconnected from ${roomCode}, starting ${GRACE_MS}ms grace period`);

        io.to(roomCode).emit('player-disconnected', { playerId: socket.id, playerName: player.name });

        const timer = setTimeout(() => {
            disconnectTimers.delete(socket.id);
            handleLeave(io, socket);
            console.log(`Grace period expired for ${player.name} — removed from ${roomCode}`);
        }, GRACE_MS);

        disconnectTimers.set(socket.id, timer);
    });
}

// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────

function handleLeave(io, socket) {
    const roomCode = playerRooms.get(socket.id);
    if (!roomCode) return;

    const room = rooms.get(roomCode);
    if (!room) {
        playerRooms.delete(socket.id);
        return;
    }

    const leavingPlayer = room.players.find(p => p.id === socket.id);
    const leavingPlayerName = leavingPlayer ? leavingPlayer.name : 'A player';

    playerRooms.delete(socket.id);
    room.players = room.players.filter(p => p.id !== socket.id);
    room.confirmedWords.delete(socket.id);
    socket.leave(roomCode);

    if (room.players.length === 0) {
        clearRoomTimers(room);
        rooms.delete(roomCode);
        console.log(`Room ${roomCode} deleted (empty)`);
        return;
    }

    if (room.host === socket.id) {
        room.players[0].isHost = true;
        room.host = room.players[0].id;
        console.log(`New host for room ${roomCode}: ${room.players[0].name}`);
    }

    io.to(roomCode).emit('room-updated', { room: sanitizeRoom(room) });
    io.to(roomCode).emit('player-left', { playerId: socket.id, playerName: leavingPlayerName });
}

function startNewRound(io, room) {
    room.currentRound++;
    room.words = assignWords(room.players, room.config);
    room.votes = {};
    room.confirmedWords = new Set();
    room.gameState = 'word-reveal';

    // Generate a fresh shuffled speaking order for this round
    room.turnOrder = shuffleArray(room.players.map(p => p.id));

    io.to(room.code).emit('game-started', {
        room: sanitizeRoom(room)
    });

    room.players.forEach(player => {
        io.to(player.id).emit('your-word', room.words[player.id]);
    });

    console.log(`Round ${room.currentRound} started in room ${room.code}`);
}

function clearRoomTimers(room) {
    if (room.timers.discussion) clearInterval(room.timers.discussion);
    if (room.timers.voting) clearInterval(room.timers.voting);
}

function sanitizeRoom(room) {
    return {
        code: room.code,
        host: room.host,
        players: room.players,
        config: room.config,
        gameState: room.gameState,
        currentRound: room.currentRound,
        totalRounds: room.totalRounds,
        confirmedCount: room.confirmedWords ? room.confirmedWords.size : 0,
        turnOrder: room.turnOrder || []
    };
}

function generateAvatar(name) {
    const colors = ['#7c3aed', '#06b6d4', '#f59e0b', '#10b981', '#ef4444', '#3b82f6', '#ec4899', '#8b5cf6'];
    const index = name.charCodeAt(0) % colors.length;
    return { initial: name[0].toUpperCase(), color: colors[index] };
}

// Fisher-Yates shuffle
function shuffleArray(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

module.exports = roomHandler;
module.exports.handleLeave = handleLeave;
module.exports.startNewRound = startNewRound;
module.exports.sanitizeRoom = sanitizeRoom;