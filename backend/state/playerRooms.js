// Maps each socket.id to its current roomCode for quick lookups
// Key: socketId (string), Value: roomCode (string)
const playerRooms = new Map();

module.exports = playerRooms;
