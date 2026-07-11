const rooms = require('../state/rooms');
const playerRooms = require('../state/playerRooms');
const assignWords = require('../utils/assignWords');
const { sanitizeRoom } = require('./roomHandler');

function gameHandler(io, socket) {

    // ─────────────────────────────────────────────
    // START DISCUSSION (host triggers after word reveal)
    // ─────────────────────────────────────────────
    socket.on('start-discussion', () => {
        const roomCode = playerRooms.get(socket.id);
        if (!roomCode) return;
        const room = rooms.get(roomCode);
        if (!room || room.host !== socket.id) return;
        if (room.gameState !== 'word-reveal') return;

        startDiscussion(io, room);
    });

    // ─────────────────────────────────────────────
    // CAST VOTE
    // ─────────────────────────────────────────────
    socket.on('cast-vote', ({ targetId }) => {
        const roomCode = playerRooms.get(socket.id);
        if (!roomCode) return;
        const room = rooms.get(roomCode);
        if (!room || room.gameState !== 'voting') return;

        // Prevent voting for yourself
        if (targetId === socket.id) {
            socket.emit('error', { message: "You cannot vote for yourself." });
            return;
        }

        // Only allow one vote per player
        if (room.votes[socket.id]) {
            socket.emit('error', { message: "You have already voted." });
            return;
        }

        // Validate target exists
        const targetExists = room.players.some(p => p.id === targetId);
        if (!targetExists) {
            socket.emit('error', { message: "Invalid vote target." });
            return;
        }

        room.votes[socket.id] = targetId;

        const totalVotes = Object.keys(room.votes).length;
        const expectedVotes = room.players.length;

        io.to(roomCode).emit('vote-cast', {
            voterId: socket.id,
            targetId,
            totalVotes,
            expectedVotes
        });

        // Tally when all votes are in
        if (totalVotes >= expectedVotes) {
            if (room.timers.voting) clearInterval(room.timers.voting);
            tallyVotes(io, room);
        }
    });

    // ─────────────────────────────────────────────
    // NEXT ROUND (host)
    // ─────────────────────────────────────────────
    socket.on('next-round', () => {
        const roomCode = playerRooms.get(socket.id);
        if (!roomCode) return;
        const room = rooms.get(roomCode);
        if (!room || room.host !== socket.id) return;
        if (room.gameState !== 'results') return;

        if (room.currentRound >= room.totalRounds) {
            endGame(io, room);
        } else {
            startNewRound(io, room);
        }
    });

    // ─────────────────────────────────────────────
    // PLAY AGAIN (host resets game to lobby)
    // ─────────────────────────────────────────────
    socket.on('play-again', () => {
        const roomCode = playerRooms.get(socket.id);
        if (!roomCode) return;
        const room = rooms.get(roomCode);
        if (!room || room.host !== socket.id) return;

        // Reset scores and round counter
        room.players.forEach(p => { p.score = 0; });
        room.currentRound = 0;
        room.gameState = 'lobby';
        room.words = {};
        room.votes = {};
        if (room.confirmedWords) room.confirmedWords.clear();

        io.to(roomCode).emit('game-reset', { room: sanitizeRoom(room) });
    });
}

// ─────────────────────────────────────────────
// INTERNAL GAME FLOW FUNCTIONS
// ─────────────────────────────────────────────

function startDiscussion(io, room, durationOverride = null) {
    room.gameState = 'discussion';
    const duration = durationOverride || room.config.discussionTime;
    let remaining = duration;

    if (room.timers.discussion) clearInterval(room.timers.discussion);

    io.to(room.code).emit('discussion-started', { duration, remaining });
    console.log(`Discussion started in room ${room.code} (${duration}s)`);

    room.timers.discussion = setInterval(() => {
        remaining--;
        io.to(room.code).emit('timer-tick', { remaining, phase: 'discussion' });

        if (remaining <= 0) {
            clearInterval(room.timers.discussion);
            startVoting(io, room);
        }
    }, 1000);
}

function startVoting(io, room) {
    room.gameState = 'voting';
    room.votes = {};
    const duration = room.config.votingTime;
    let remaining = duration;

    if (room.timers.voting) clearInterval(room.timers.voting);

    io.to(room.code).emit('voting-started', { duration, remaining });
    console.log(`Voting started in room ${room.code} (${duration}s)`);

    room.timers.voting = setInterval(() => {
        remaining--;
        io.to(room.code).emit('timer-tick', { remaining, phase: 'voting' });

        if (remaining <= 0) {
            clearInterval(room.timers.voting);
            tallyVotes(io, room);
        }
    }, 1000);
}

function tallyVotes(io, room) {
    // Count votes per player
    const voteCounts = {};
    room.players.forEach(p => { voteCounts[p.id] = 0; });

    Object.values(room.votes).forEach(targetId => {
        if (voteCounts[targetId] !== undefined) voteCounts[targetId]++;
    });

    // Find who got the most votes
    const maxVotes = Math.max(...Object.values(voteCounts));
    const topVoted = Object.keys(voteCounts).filter(id => voteCounts[id] === maxVotes);

    // Draw — extend discussion by 2 minutes
    if (topVoted.length > 1) {
        console.log(`Vote draw in room ${room.code} — extending discussion`);
        io.to(room.code).emit('vote-draw', {
            voteCounts,
            message: "It's a tie! 2 more minutes of discussion..."
        });
        room.gameState = 'word-reveal'; // reset so start-discussion can fire
        setTimeout(() => {
            room.gameState = 'word-reveal';
            startDiscussion(io, room, 120);
        }, 3000);
        return;
    }

    const eliminatedId = topVoted[0];
    const eliminatedPlayer = room.players.find(p => p.id === eliminatedId);
    const eliminatedIsImposter = room.words[eliminatedId]?.isImposter ?? false;

    const imposterIds = room.players
        .filter(p => room.words[p.id]?.isImposter)
        .map(p => p.id);

    const winnerSide = eliminatedIsImposter ? 'players' : 'imposters';

    // Award points
    room.players.forEach(p => {
        const isImposter = room.words[p.id]?.isImposter;
        if (winnerSide === 'players' && !isImposter) {
            p.score = (p.score || 0) + 100;
        } else if (winnerSide === 'imposters' && isImposter) {
            p.score = (p.score || 0) + 150;
        }
    });

    room.gameState = 'results';

    io.to(room.code).emit('vote-results', {
        voteCounts,
        votes: room.votes,
        eliminatedId,
        eliminatedName: eliminatedPlayer?.name || 'Unknown',
        eliminatedIsImposter,
        imposterIds,
        winnerSide,
        words: room.words,           // Full word reveal
        scores: room.players,
        currentRound: room.currentRound,
        totalRounds: room.totalRounds,
        isLastRound: room.currentRound >= room.totalRounds
    });

    console.log(`Round ${room.currentRound} results in room ${room.code}: ${winnerSide} win`);
}

function startNewRound(io, room) {
    room.currentRound++;
    room.words = assignWords(room.players, room.config);
    room.votes = {};
    room.confirmedWords = new Set();
    room.gameState = 'word-reveal';

    io.to(room.code).emit('game-started', { room: sanitizeRoom(room) });

    room.players.forEach(player => {
        io.to(player.id).emit('your-word', room.words[player.id]);
    });

    console.log(`Round ${room.currentRound} started in room ${room.code}`);
}

function endGame(io, room) {
    const sortedPlayers = [...room.players].sort((a, b) => (b.score || 0) - (a.score || 0));
    const overallWinner = sortedPlayers[0];

    room.gameState = 'game-over';

    io.to(room.code).emit('game-over', {
        scores: sortedPlayers,
        winner: overallWinner,
        totalRounds: room.totalRounds
    });

    // Reset room back to lobby after 30 seconds
    setTimeout(() => {
        if (rooms.has(room.code)) {
            room.players.forEach(p => { p.score = 0; });
            room.currentRound = 0;
            room.gameState = 'lobby';
            room.words = {};
            room.votes = {};
            if (room.confirmedWords) room.confirmedWords.clear();
            io.to(room.code).emit('game-reset', { room: sanitizeRoom(room) });
        }
    }, 30000);
}

module.exports = gameHandler;
