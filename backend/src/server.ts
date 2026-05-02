import dotenv from 'dotenv';
import path from 'path';
// Load .env from backend/ directory (works in dev; in prod, env vars come from Render dashboard)
dotenv.config({ path: path.resolve(__dirname, '../.env') });

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

const corsOrigin = process.env.CLIENT_URL || false;
app.use(cors({ origin: corsOrigin, credentials: true }));
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

// Serve React frontend in production
// __dirname is backend/dist/ after tsc, so ../../frontend/dist resolves to frontend/dist
const frontendDist = path.resolve(__dirname, '../../frontend/dist');
app.use(express.static(frontendDist));
app.get('*', (_req, res) => {
  res.sendFile(path.join(frontendDist, 'index.html'));
});

// Socket.io setup
const io = new SocketServer(httpServer, {
  cors: { origin: corsOrigin, credentials: true },
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

const PORT = Number(process.env.PORT) || 5000;

httpServer.on('error', (err: NodeJS.ErrnoException) => {
  console.error('Fatal server error:', err);
  process.exit(1);
});

process.on('SIGINT', () => {
  httpServer.close(() => process.exit(0));
});

process.on('SIGTERM', () => {
  httpServer.close(() => process.exit(0));
});

httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
