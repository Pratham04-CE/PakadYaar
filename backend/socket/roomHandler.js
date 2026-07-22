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
// When a socket disconnects, we wait GRACE_MS before actually removing the player.
// If they rejoin before that, the timer is cancelled.
const disconnectTimers = new Map();
const GRACE_MS = 6000; // 6 seconds


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

        // Cancel any pending grace-period removal for the old socket
        if (disconnectTimers.has(oldSocketId)) {
            clearTimeout(disconnectTimers.get(oldSocketId));
            disconnectTimers.delete(oldSocketId);
            console.log(`Grace period cancelled for ${name} (${oldSocketId})`);
        }

        // Swap socket IDs
        const player = room.players[playerIndex];
        playerRooms.delete(oldSocketId);

        player.id = socket.id;
        playerRooms.set(socket.id, code);
        socket.join(code);

        // If this player was the host, update room.host
        if (room.host === oldSocketId) {
            room.host = socket.id;
        }

        // Also update confirmedWords set if old ID was in there
        if (room.confirmedWords.has(oldSocketId)) {
            room.confirmedWords.delete(oldSocketId);
            room.confirmedWords.add(socket.id);
        }

        // Also update votes map if old ID voted
        if (room.votes && room.votes[oldSocketId] !== undefined) {
            room.votes[socket.id] = room.votes[oldSocketId];
            delete room.votes[oldSocketId];
        }
        // Update any vote targets pointing to old ID
        if (room.votes) {
            for (const [voterId, targetId] of Object.entries(room.votes)) {
                if (targetId === oldSocketId) {
                    room.votes[voterId] = socket.id;
                }
            }
        }

        console.log(`${name} rejoined room ${code} (${oldSocketId} -> ${socket.id})`);

        // Send full room state back
        socket.emit('rejoin-success', {
            room: sanitizeRoom(room),
            gameState: room.gameState
        });

        // If game in progress, resend their private word
        if (room.words && room.words[socket.id]) {
            socket.emit('your-word', room.words[socket.id]);
        } else if (room.words && room.words[oldSocketId]) {
            // Word was stored under old ID — migrate it
            room.words[socket.id] = room.words[oldSocketId];
            delete room.words[oldSocketId];
            socket.emit('your-word', room.words[socket.id]);
        }

        // Notify other players that room updated
        io.to(code).emit('room-updated', { room: sanitizeRoom(room) });
    });

    // ─────────────────────────────────────────────
    // LEAVE ROOM (intentional quit)
    // ─────────────────────────────────────────────
    socket.on('leave-room', () => {
        handleLeave(io, socket, true);
    });

    // ─────────────────────────────────────────────
    // KICK PLAYER (host only)
    // ─────────────────────────────────────────────
    socket.on('kick-player', ({ playerId }) => {
        const roomCode = playerRooms.get(socket.id);
        if (!roomCode) return;
        const room = rooms.get(roomCode);
        if (!room || room.host !== socket.id) return;
        if (playerId === socket.id) return; // Can't kick yourself

        const target = room.players.find(p => p.id === playerId);
        if (!target) return;

        // Remove from room
        room.players = room.players.filter(p => p.id !== playerId);
        room.confirmedWords.delete(playerId);
        playerRooms.delete(playerId);

        // Clean up grace timer if any
        if (disconnectTimers.has(playerId)) {
            clearTimeout(disconnectTimers.get(playerId));
            disconnectTimers.delete(playerId);
        }

        // Tell the kicked player they've been removed
        io.to(playerId).emit('kicked-from-room', { message: 'You were removed by the host.' });

        // Update all remaining players
        io.to(roomCode).emit('room-updated', { room: sanitizeRoom(room) });
        io.to(roomCode).emit('player-left', { playerId });

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
    // DISCONNECT — grace period before removing
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

        // Notify others that player is temporarily disconnected
        io.to(roomCode).emit('player-disconnected', { playerId: socket.id, playerName: player.name });

        // Start grace-period timer
        const timer = setTimeout(() => {
            disconnectTimers.delete(socket.id);
            handleLeave(io, socket, false);
            console.log(`Grace period expired for ${player.name} — removed from ${roomCode}`);
        }, GRACE_MS);

        disconnectTimers.set(socket.id, timer);
    });
}

// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────

function handleLeave(io, socket, isIntentional = true) {
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