const rooms = require('../state/rooms');
const playerRooms = require('../state/playerRooms');

function voiceHandler(io, socket) {

    // Relay WebRTC signal (offer, answer, candidate) to a specific target player
    socket.on('voice-signal', ({ targetId, signal }) => {
        if (!targetId || !signal) return;
        io.to(targetId).emit('voice-signal', {
            senderId: socket.id,
            signal
        });
    });

    // Notify room when a player joins voice / requests WebRTC connections
    socket.on('join-voice', () => {
        const roomCode = playerRooms.get(socket.id);
        if (!roomCode) return;
        const room = rooms.get(roomCode);
        if (!room) return;

        // Broadcast to other players in room that this player joined voice chat
        socket.to(roomCode).emit('user-joined-voice', {
            playerId: socket.id
        });
    });

    // Relay mic status change (muted/unmuted) to all room members
    socket.on('voice-mute-status', ({ isMuted }) => {
        const roomCode = playerRooms.get(socket.id);
        if (!roomCode) return;

        socket.to(roomCode).emit('voice-mute-status', {
            playerId: socket.id,
            isMuted
        });
    });

}

module.exports = voiceHandler;
