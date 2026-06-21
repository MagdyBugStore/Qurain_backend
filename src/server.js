import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import { createServer } from 'http';
import { Server } from 'socket.io';
import path from 'path';
import { fileURLToPath } from 'url';

// Import routes
import authRoutes from './routes/auth.routes.js';
import userRoutes from './routes/user.routes.js';
import teacherRoutes from './routes/teacher.routes.js';
import studentRoutes from './routes/student.routes.js';
import sessionRoutes from './routes/session.routes.js';
import uploadRoutes from './routes/upload.routes.js';
import roomRoutes from './routes/room.routes.js';
import paymentRoutes from './routes/payment.routes.js';
import walletRoutes from './routes/wallet.routes.js';
import supportRoutes from './routes/support.routes.js';
import reviewRoutes from './routes/review.routes.js';
import notificationRoutes from './routes/notification.routes.js';
import adminRoutes from './routes/admin.routes.js';

// Import middleware
import { errorHandler } from './middleware/errorHandler.js';
import { notFound } from './middleware/notFound.js';

// Import database connection
import { connectDB } from './config/database.js';

// Load environment variables
dotenv.config();

const app = express();
const httpServer = createServer(app);

// CORS_ORIGIN can be a comma-separated list: "https://qurain.almazoon.net,http://localhost:5173"
const rawOrigins = process.env.CORS_ORIGIN || 'http://localhost:5173';
const allowedOrigins = rawOrigins.split(',').map((o) => o.trim());
const corsOrigin = allowedOrigins.length === 1 ? allowedOrigins[0] : allowedOrigins;

const io = new Server(httpServer, {
  cors: {
    origin: corsOrigin,
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

const PORT = process.env.PORT || 5174;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Middleware
app.use(helmet({
  // Allow same-origin popups so Socket.io can check window.closed without COOP blocking it
  crossOriginOpenerPolicy: { policy: 'same-origin-allow-popups' },
}));
app.use(compression());
app.use(morgan('dev'));
app.use(cors({
  origin: corsOrigin,
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve uploaded files (images/videos/certificates)
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Public video access (no auth): allow browser <video> tags to load files directly
// IMPORTANT: Must be registered BEFORE the authenticated upload routes below.
app.use(
  '/api/v1/uploads/videos',
  // Allow loading these files from the frontend origin (e.g. Vite on :5173).
  // Helmet's default CORP is "same-origin" which blocks cross-origin media loads.
  (req, res, next) => {
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    next();
  },
  express.static(path.join(__dirname, '../uploads/videos'))
);

// Make io available to routes via req.app.get('io')
app.set('io', io);
app.set('socketio', io);

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    success: true, 
    message: 'Server is running',
    timestamp: new Date().toISOString(),
  });
});

// API Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/teachers', teacherRoutes);
app.use('/api/v1/students', studentRoutes);
app.use('/api/v1/sessions', sessionRoutes);
app.use('/api/v1/uploads', uploadRoutes);
app.use('/api/v1/rooms', roomRoutes);
app.use('/api/v1/payments', paymentRoutes);
app.use('/api/v1/wallet', walletRoutes);
app.use('/api/v1/support', supportRoutes);
app.use('/api/v1/reviews', reviewRoutes);
app.use('/api/v1/notifications', notificationRoutes);
app.use('/api/v1/admin', adminRoutes);

// Error handling middleware (must be last)
app.use(notFound);
app.use(errorHandler);

// Maps socket.id → test roomId — used by test-room handlers for disconnect cleanup
const testRoomParticipants = new Map();

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  socket.on('join-room', (roomId) => {
    socket.join(roomId);
    console.log(`Socket ${socket.id} joined room ${roomId}`);
  });

  socket.on('leave-room', (roomId) => {
    socket.leave(roomId);
    console.log(`Socket ${socket.id} left room ${roomId}`);
  });

  // WebRTC signaling relay
  socket.on('webrtc-offer', ({ roomId, sdp }) => {
    if (!roomId || !sdp) return;
    socket.to(roomId).emit('webrtc-offer', { from: socket.id, sdp });
  });

  socket.on('webrtc-answer', ({ roomId, sdp }) => {
    if (!roomId || !sdp) return;
    socket.to(roomId).emit('webrtc-answer', { from: socket.id, sdp });
  });

  socket.on('webrtc-ice-candidate', ({ roomId, candidate }) => {
    if (!roomId || !candidate) return;
    socket.to(roomId).emit('webrtc-ice-candidate', { from: socket.id, candidate });
  });

  // ─── Test Room (no auth, multi-peer, full debug logging) ────────────────────
  socket.on('test-room:join', ({ roomId }) => {
    if (!roomId) return;
    const nsRoom = `test::${roomId}`;

    // Collect existing participants before this socket joins
    const room = io.sockets.adapter.rooms.get(nsRoom);
    const existing = room ? [...room].filter((id) => id !== socket.id) : [];

    socket.join(nsRoom);
    testRoomParticipants.set(socket.id, roomId);

    const total = (io.sockets.adapter.rooms.get(nsRoom)?.size) ?? 1;
    console.log(`[TestRoom] User joined room "${roomId}" | socket=${socket.id} | participants=${total}`);

    // Tell the newcomer who is already in the room
    socket.emit('test-room:participants', { participants: existing });

    // Tell existing peers about the newcomer
    socket.to(nsRoom).emit('test-room:peer-joined', { peerId: socket.id });
    console.log(`[TestRoom] Room participant count for "${roomId}": ${total}`);
  });

  socket.on('test-room:offer', ({ to, sdp }) => {
    if (!to || !sdp) return;
    console.log(`[TestRoom] Offer relayed from ${socket.id} → ${to}`);
    io.to(to).emit('test-room:offer', { from: socket.id, sdp });
  });

  socket.on('test-room:answer', ({ to, sdp }) => {
    if (!to || !sdp) return;
    console.log(`[TestRoom] Answer relayed from ${socket.id} → ${to}`);
    io.to(to).emit('test-room:answer', { from: socket.id, sdp });
  });

  socket.on('test-room:ice', ({ to, candidate }) => {
    if (!to || !candidate) return;
    console.log(`[TestRoom] ICE candidate relayed from ${socket.id} → ${to}`);
    io.to(to).emit('test-room:ice', { from: socket.id, candidate });
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
    // Clean up test room membership
    const roomId = testRoomParticipants.get(socket.id);
    if (roomId) {
      testRoomParticipants.delete(socket.id);
      const nsRoom = `test::${roomId}`;
      socket.to(nsRoom).emit('test-room:peer-left', { peerId: socket.id });
      const remaining = io.sockets.adapter.rooms.get(nsRoom)?.size ?? 0;
      console.log(`[TestRoom] User left room "${roomId}" | socket=${socket.id} | remaining=${remaining}`);
    }
    console.log(`[TestRoom] Socket disconnected: ${socket.id}`);
  });
});

// Connect to database and start server
const startServer = async () => {
  try {
    // Connect to MongoDB
    await connectDB();
    
    // Start HTTP server
    httpServer.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📡 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🌐 CORS enabled for: ${process.env.CORS_ORIGIN || 'http://localhost:5173'}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

export default app;
