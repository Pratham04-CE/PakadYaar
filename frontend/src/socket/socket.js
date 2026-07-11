import { io } from 'socket.io-client';

// Single shared socket instance connecting to the backend
const socket = io('http://localhost:5000', {
    autoConnect: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
});

export default socket;
