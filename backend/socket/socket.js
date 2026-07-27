const { Server } = require("socket.io");

const roomHandler = require("./roomHandler");
const gameHandler = require("./gameHandler");
const voiceHandler = require("./voiceHandler");

function initializeSocket(server) {

    const io = new Server(server, {
        cors: {
            origin: "*",
            methods: ["GET", "POST"]
        }
    });

    io.on("connection", (socket) => {
        console.log(`Player Connected : ${socket.id}`);

        // Register event handlers
        roomHandler(io, socket);
        gameHandler(io, socket);
        voiceHandler(io, socket);

        socket.on("disconnect", () => {
            console.log(`Player Disconnected : ${socket.id}`);
        });
    });
socket.on('play-again', () => {
    const roomCode = getRoomCodeBySocketId(socket.id);
    const room = rooms[roomCode];
    if (!room) return;

    // Check if the requester is the host
    if (room.host === socket.id) {
        room.currentRound = 1;
        room.gamePhase = 'waiting-room';
        // Reset player scores or keep them as per your design
        room.players.forEach(p => { p.score = 0; });

        io.to(roomCode).emit('game-reset', { room });
    }
});
}

module.exports = initializeSocket;