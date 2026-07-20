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


function roomHandler(io, socket) {

    // ─────────────────────────────────────────────
    // CREATE ROOM
    // ─────────────────────────────────────────────
    socket.on('create-room', ({ playerName }) => {
        if (!playerName || !playerName.trim()) {
            socket.emit('error', { message: 'Player name is required' });
            return;
        }

        // Generate a unique room code
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
    // LEAVE ROOM
    // ─────────────────────────────────────────────
    socket.on('leave-room', () => {
        handleLeave(io, socket);
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
    // CONFIRM WORD SEEN (marks player ready for discussion)
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
    // DISCONNECT
    // ─────────────────────────────────────────────
    socket.on('disconnect', () => {
        handleLeave(io, socket);
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

    // Re-assign host if the host left
    if (room.host === socket.id) {
        room.players[0].isHost = true;
        room.host = room.players[0].id;
        console.log(`New host for room ${roomCode}: ${room.players[0].name}`);
    }

    io.to(roomCode).emit('room-updated', { room: sanitizeRoom(room) });
    io.to(roomCode).emit('player-left', { playerId: socket.id });
}

function startNewRound(io, room) {
    room.currentRound++;
    room.words = assignWords(room.players, room.config);
    room.votes = {};
    room.confirmedWords = new Set();
    room.gameState = 'word-reveal';

    // Broadcast public game state (without private words)
    io.to(room.code).emit('game-started', {
        room: sanitizeRoom(room)
    });

    // Send each player their private word
    room.players.forEach(player => {
        io.to(player.id).emit('your-word', room.words[player.id]);
    });

    console.log(`Round ${room.currentRound} started in room ${room.code}`);
}

function clearRoomTimers(room) {
    if (room.timers.discussion) clearInterval(room.timers.discussion);
    if (room.timers.voting) clearInterval(room.timers.voting);
}

// Remove server-only fields before sending to clients
function sanitizeRoom(room) {
    return {
        code: room.code,
        host: room.host,
        players: room.players,
        config: room.config,
        gameState: room.gameState,
        currentRound: room.currentRound,
        totalRounds: room.totalRounds,
        confirmedCount: room.confirmedWords ? room.confirmedWords.size : 0
    };
}

// Generate a simple color avatar based on the first character of name
function generateAvatar(name) {
    const colors = ['#7c3aed', '#06b6d4', '#f59e0b', '#10b981', '#ef4444', '#3b82f6', '#ec4899', '#8b5cf6'];
    const index = name.charCodeAt(0) % colors.length;
    return { initial: name[0].toUpperCase(), color: colors[index] };
}

module.exports = roomHandler;
module.exports.handleLeave = handleLeave;
module.exports.startNewRound = startNewRound;
module.exports.sanitizeRoom = sanitizeRoom;