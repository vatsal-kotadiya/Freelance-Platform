import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Temporary debug — remove after confirming keys load
console.log('[env] RAZORPAY_KEY_ID :', process.env.RAZORPAY_KEY_ID ? '✓ loaded' : '✗ MISSING');
console.log('[env] RAZORPAY_KEY_SECRET:', process.env.RAZORPAY_KEY_SECRET ? '✓ loaded' : '✗ MISSING');

import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server as SocketServer } from 'socket.io';
import jwt from 'jsonwebtoken';

import authRoutes from './routes/auth.routes';
import projectRoutes from './routes/project.routes';
import bidRoutes from './routes/bid.routes';
import paymentRoutes from './routes/payment.routes';
import dashboardRoutes from './routes/dashboard.routes';
import notificationRoutes from './routes/notification.routes';
import profileRoutes from './routes/profile.routes';
import reviewRoutes from './routes/review.routes';
import fileRoutes from './routes/file.routes';
import { errorHandler } from './middleware/errorHandler';
import { saveMessage } from './services/message.service';
import { AuthPayload } from './middleware/auth';
import { setIo } from './lib/io';

const app = express();
const httpServer = createServer(app);

app.use(cors({ origin: process.env.CLIENT_URL, credentials: true }));
app.use(express.json());
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api', bidRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api', fileRoutes);

app.use(errorHandler);

// Socket.io setup
const io = new SocketServer(httpServer, {
  cors: { origin: process.env.CLIENT_URL, credentials: true },
});

setIo(io);

io.use((socket, next) => {
  const token = socket.handshake.auth.token as string | undefined;
  if (!token) return next(new Error('Authentication required'));
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET!) as AuthPayload;
    socket.data.user = payload;
    next();
  } catch {
    next(new Error('Invalid token'));
  }
});

io.on('connection', (socket) => {
  // Join private room for this user so notifications can be targeted
  socket.join(`user-${socket.data.user.userId}`);

  socket.on('joinRoom', (projectId: string) => {
    socket.join(`project-${projectId}`);
  });

  socket.on('sendMessage', async ({ projectId, content }: { projectId: string; content: string }) => {
    try {
      const message = await saveMessage(projectId, socket.data.user.userId, content);
      io.to(`project-${projectId}`).emit('newMessage', message);
    } catch (err) {
      socket.emit('error', (err as Error).message);
    }
  });
});

const BASE_PORT = Number(process.env.PORT) || 5000;
const MAX_PORT  = BASE_PORT + 10;
let currentPort = BASE_PORT;
let isListening = false;

httpServer.setMaxListeners(20);

function startServer(port: number): void {
  if (isListening) return;
  httpServer.listen(port, () => {
    isListening = true;
    currentPort = port;
    if (port !== BASE_PORT) {
      console.warn(`⚠  Port ${BASE_PORT} was busy — using port ${port} instead.`);
      console.warn(`   Update VITE_API_URL / VITE_SOCKET_URL in frontend/.env to match.`);
    }
    console.log(`Server running on http://localhost:${port}`);
  });
}

httpServer.on('error', (err: NodeJS.ErrnoException) => {
  if (err.code === 'EADDRINUSE') {
    const next = currentPort + 1;
    if (next > MAX_PORT) {
      console.error(`All ports ${BASE_PORT}–${MAX_PORT} are in use. Exiting.`);
      process.exit(1);
    }
    console.warn(`Port ${currentPort} in use, trying ${next}…`);
    currentPort = next;
    httpServer.close(() => startServer(next));
  } else {
    console.error('Fatal server error:', err);
    process.exit(1);
  }
});

process.on('SIGINT', () => {
  console.log('\nServer shutting down…');
  httpServer.close(() => process.exit(0));
});

process.on('SIGTERM', () => {
  console.log('Server terminated.');
  httpServer.close(() => process.exit(0));
});

startServer(BASE_PORT);
