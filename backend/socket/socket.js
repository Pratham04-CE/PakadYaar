const { Server } = require("socket.io");

const roomHandler = require("./roomHandler");
const gameHandler = require("./gameHandler");

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

        socket.on("disconnect", () => {
            console.log(`Player Disconnected : ${socket.id}`);
        });
    });

}

module.exports = initializeSocket;