import express from 'express';
import { Server, Socket } from 'socket.io';
import { createServer } from 'node:http';
import helmet from 'helmet';
import logger from 'morgan';
import path from 'path';
import cors from 'cors';
import { connectDB, setSkipDefaultSeeding } from '@api/config/mongoose';
import '@api/models'; // register all synced Mongoose models
import { errorHandler, notFound } from '@api/middlewares/error';
import { syncRecorderMiddleware, setSyncRecorderClientMode } from '@api/middlewares/syncRecorder';
import api from '@api/routes';
import socketHelper from '@api/socket';
import { startOrderScheduler } from '@api/functions/orderScheduler';
import { log } from '@api/utils';

const whitelist = ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:4172', 'http://localhost:4030', 'http://localhost:5030', 'file://', 'null'];

function buildApp(clientMode: boolean, dbName?: string): express.Application {
  const app = express();
  app.use(helmet({ contentSecurityPolicy: false }));
  app.use(cors({ origin: [...whitelist], optionsSuccessStatus: 200, credentials: true }));

  app.set('views', path.join(__dirname, 'views'));
  app.set('view engine', 'hbs');

  app.use(logger('dev'));
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: false, limit: '10mb' }));

  if (clientMode) {
    setSyncRecorderClientMode(true);
    setSkipDefaultSeeding(true);
    app.use(syncRecorderMiddleware);
  }

  app.get('/', (_req, res) => res.sendStatus(200));

  /** Initialise mongoose connection */
  connectDB(dbName);

  /** Start order auto-cancel scheduler (host mode only) */
  if (!clientMode) {
    startOrderScheduler();
  }

  app.use('/api', api);

  /** Handle Errors */
  app.use(notFound);
  app.use(errorHandler);

  return app;
}

function attachSocketIO(server: ReturnType<typeof createServer>): Server {
  const existing = (server as any).io as Server | undefined;
  if (existing) return existing;
  const io = new Server(server, { cors: { origin: '*' } });
  io.on('connection', (socket: Socket) => {
    log(`Connection to socketIO Ready ${socket.id}`);
    socketHelper(socket);
  });
  (server as any).io = io;
  return io;
}

export interface ApiServerOptions {
  clientMode?: boolean;
  dbName?: string;
}

export function createApiServer(options: ApiServerOptions = {}): ReturnType<typeof createServer> {
  const { clientMode = false, dbName } = options;
  const app = buildApp(clientMode, dbName);
  const server = createServer(app);
  attachSocketIO(server);
  return server;
}

export default createApiServer;
