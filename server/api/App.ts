import bodyParser from 'body-parser';
import express from 'express';
import cors from 'cors';
import logger from 'morgan';
import path from 'path';
import { connectDB } from './config/mongoose';
import { errorHandler, notFound } from './middlewares/error';
import api from './routes';
import dotenv from 'dotenv';

dotenv.config({ path: path.join(__dirname, '../../.env') });

export interface ProcessEnv {
  [key: string]: string | undefined;
}

const app: express.Application = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');

const devOrigins = process.env.CORS_FRONTEND_DEV_DOMAINS.split(' ');
const prodOrigins = process.env.CORS_FRONTEND_PROD_DOMAINS.split(' ');

const origin = process.env.NODE_ENV === 'development' ? devOrigins : prodOrigins;

app.use(cors({
  origin,
  optionsSuccessStatus: 200,
  credentials: true,
}));

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

export default app;
