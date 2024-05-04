import express from 'express';
import { Server, Socket } from 'socket.io';
import { createServer } from 'node:http';
import helmet from 'helmet';
import logger from 'morgan';
import path from 'path';
import cors from 'cors';
import { connectDB } from './config/mongoose';
import { errorHandler, notFound } from './middlewares/error';
import api from './routes';
import socketHelper from './web-socket';
import { log } from './utils';

const whitelist = ['http://localhost:5173', 'http://localhost:4172', 'http://localhost:4030', 'http://localhost:5030'];
const app = express();
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({ origin: [...whitelist], optionsSuccessStatus: 200, credentials: true }));


app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');


const server = createServer(app);

export const io = new Server(server, { cors: { origin: '*' } });

io.on('connection', (socket: Socket) => {
  log(`Connection to socketIO Ready ${socket.id}`);
  socketHelper(socket);
});

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.get('/', (_req, res) => res.sendStatus(200));

/** Initialise mongoose connection */
connectDB();

app.use('/api', api);

/** Handle Errors */
app.use(notFound);
app.use(errorHandler);


export default server;
