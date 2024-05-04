import express from 'express';
import { Server, Socket } from 'socket.io';
import { createServer } from 'node:http';
import helmet from 'helmet';
import cors from 'cors';
import socketHelper from './web-socket';
import { log } from './utils';

const whitelist = ['http://localhost:5173', 'http://localhost:4172', 'http://localhost:4030', 'http://localhost:5030'];
const app = express();
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({ origin: [...whitelist], optionsSuccessStatus: 200, credentials: true }));

const server = createServer(app);

export const io = new Server(server, { cors: { origin: '*' } });

io.on('connection', (socket: Socket) => {
  log(`Connection to socketIO Ready ${socket.id}`);
  socketHelper(socket);
});

export default server;
