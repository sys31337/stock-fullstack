import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { log, logError } from '../utils';

dotenv.config({ path: path.join(__dirname, '../../.env') });
const connectDB = async (): Promise<boolean> => {
  const { DATABASEURI } = process.env;
  mongoose.set('strictQuery', true);
  mongoose.connect(DATABASEURI, { useNewUrlParser: true, useUnifiedTopology: true } as mongoose.ConnectOptions);

  const db: mongoose.Connection = mongoose.connection;

  db.once('open', () => {
    log('Database Connected');
  });

  db.on('error', (error: Error) => {
    logError('Database Connection error:', error);
  });
  return true;
};

const closeDB = async (): Promise<void> => {
  const db: mongoose.Connection = mongoose.connection;
  await db.close();
  db.once('disconnected', () => {
    log('Database Disconnected');
  });

  db.once('disconnected', () => {
    log('Database Connection Closed');
  });

  db.on('error', (error: Error) => {
    logError('Database Connection error:', error);
  });
};

export { connectDB, closeDB };
