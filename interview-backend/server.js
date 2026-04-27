const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("Interview DB Connected"))
  .catch(err => console.error("DB Connection Error:", err));

// Basic Route
app.get('/health', (req, res) => res.send('Interview Microservice Healthy'));

// Socket.io for WebRTC signaling and Collaborative IDE
io.on('connection', (socket) => {
    console.log(`Socket connected: ${socket.id}`);

    // Join Interview Room
    socket.on('join-room', (roomId, userId) => {
        socket.join(roomId);
        // Broadcast that a user connected so the other side can initiate WebRTC Offer
        socket.to(roomId).emit('user-connected', userId, socket.id);
        console.log(`User ${userId} (${socket.id}) joined room ${roomId}`);
    });

    // WebRTC Signaling Events
    socket.on('offer', (offer, roomId, toSocketId) => {
        socket.to(toSocketId).emit('offer', offer, socket.id);
    });

    socket.on('answer', (answer, roomId, toSocketId) => {
        socket.to(toSocketId).emit('answer', answer, socket.id);
    });

    socket.on('ice-candidate', (candidate, roomId, toSocketId) => {
        socket.to(toSocketId).emit('ice-candidate', candidate, socket.id);
    });

    // Collaborative Code Sync
    socket.on('code-change', (code, roomId, language) => {
        // Broadcast code back to everyone else in the room
        socket.to(roomId).emit('code-update', code, language);
    });

    // Language Sync
    socket.on('language-change', (language, roomId) => {
        socket.to(roomId).emit('language-change', language);
    });

    socket.on('disconnect', () => {
        console.log(`Socket disconnected: ${socket.id}`);
        // Notify rooms to handle disconnection if needed handling
    });
});

const PORT = process.env.PORT || 5002;
server.listen(PORT, () => {
  console.log(`Interview Microservice running on port ${PORT}`);
});
