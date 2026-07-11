import { io } from 'socket.io-client';

// Backend URL — uses the deployed Render API in production, localhost in development
const BACKEND_URL =
    process.env.REACT_APP_BACKEND_URL || 'https://pakadyaar.onrender.com';

// Single shared socket instance connecting to the backend
const socket = io(BACKEND_URL, {
    autoConnect: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
    transports: ['websocket', 'polling'], // Render requires websocket first
});

export default socket;
