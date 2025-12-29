/**
 * Nexus-Atelier Main Application
 * AI-Powered Creative Production Platform
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { config } from './utils/config';
import { logger } from './utils/logger';
import { db } from './utils/database';
import routes from './api/routes';
import JobQueueManager from './queue/JobQueueManager';
import { usageTrackingMiddleware, flushPendingReports } from './middleware/usage-tracking';

const app = express();
const httpServer = createServer(app);

// WebSocket server for real-time progress updates
const io = new SocketIOServer(httpServer, {
  cors: {
    origin: process.env.CORS_ORIGIN || '*',
    methods: ['GET', 'POST'],
  },
});

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Usage tracking middleware (after body parsing)
app.use(usageTrackingMiddleware);

// Request logging
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info('HTTP request', {
      method: req.method,
      path: req.path,
      status: res.statusCode,
      duration,
    });
  });
  next();
});

// API routes
app.use('/api/v1', routes);

// Root endpoint
app.get('/', (_req, res) => {
  res.json({
    service: 'Nexus-Atelier',
    tagline: 'Where Vision Meets Creation',
    version: '1.0.0',
    status: 'operational',
    endpoints: {
      video: '/api/v1/video/*',
      image: '/api/v1/image/*',
      audio: '/api/v1/audio/*',
      jobs: '/api/v1/jobs/:jobId',
      assets: '/api/v1/assets',
      health: '/api/v1/health',
      docs: 'https://docs.nexus-atelier.com',
    },
  });
});

// WebSocket connection handling
io.on('connection', (socket) => {
  logger.info('WebSocket client connected', { socketId: socket.id });

  socket.on('subscribe', (data: { jobId: string }) => {
    const { jobId } = data;
    socket.join(`job:${jobId}`);
    logger.debug('Client subscribed to job updates', { socketId: socket.id, jobId });
  });

  socket.on('unsubscribe', (data: { jobId: string }) => {
    const { jobId } = data;
    socket.leave(`job:${jobId}`);
    logger.debug('Client unsubscribed from job updates', { socketId: socket.id, jobId });
  });

  socket.on('disconnect', () => {
    logger.info('WebSocket client disconnected', { socketId: socket.id });
  });
});

// Export io for use in job queue progress updates
export { io };

// Error handling
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  logger.error('Unhandled error', err);
  res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: 'An unexpected error occurred',
    },
  });
});

// Graceful shutdown
async function gracefulShutdown() {
  logger.info('Shutting down gracefully...');

  httpServer.close(async () => {
    logger.info('HTTP server closed');

    try {
      // Flush pending usage reports
      await flushPendingReports();
      logger.info('Usage reports flushed');

      await JobQueueManager.close();
      logger.info('Job queue closed');

      await db.close();
      logger.info('Database connection closed');

      process.exit(0);
    } catch (error) {
      logger.error('Error during shutdown', error);
      process.exit(1);
    }
  });

  // Force shutdown after 30 seconds
  setTimeout(() => {
    logger.error('Forced shutdown after timeout');
    process.exit(1);
  }, 30000);
}

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

// Start server
async function start() {
  try {
    // Check database connection
    const dbHealthy = await db.healthCheck();
    if (!dbHealthy) {
      throw new Error('Database connection failed');
    }
    logger.info('Database connection established');

    // Start HTTP server
    httpServer.listen(config.port, () => {
      logger.info('Nexus-Atelier server started', {
        port: config.port,
        ws_port: config.ws_port,
        env: process.env.NODE_ENV || 'development',
      });

      logger.info('Service endpoints:', {
        http: `http://localhost:${config.port}`,
        ws: `ws://localhost:${config.port}`,
        health: `http://localhost:${config.port}/api/v1/health`,
      });
    });
  } catch (error) {
    logger.error('Failed to start server', error);
    process.exit(1);
  }
}

// Start if not in test mode
if (process.env.NODE_ENV !== 'test') {
  start();
}

export default app;
