import { io, Socket } from 'socket.io-client';

// The socket server is on the same host/port as the app
const socket: Socket = io();

export default socket;
