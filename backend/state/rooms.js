// Shared in-memory store of all active rooms
// Key: roomCode (string), Value: room object
const rooms = new Map();

module.exports = rooms;
