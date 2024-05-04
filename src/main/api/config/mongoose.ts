import mongoose from 'mongoose';
import { log, logError } from '@api/utils';
import config from '@api/config';
import Customer from '@api/models/customers';
import Category from '@api/models/categories';

const connectDB = async (): Promise<boolean> => {
  const { DATABASEURI } = config;
  mongoose.set('strictQuery', true);
  mongoose.connect(DATABASEURI);

  const db: mongoose.Connection = mongoose.connection;

  db.once('open', async () => {
    const defaultInfo = { _id: '0a0aaa0a0aa00000aaaaaa0a', createdAt: new Date('1970'), updatedAt: new Date('1970') };
    const defaultCustomer = await Customer.findById(defaultInfo._id);
    if (!defaultCustomer) {
      await new Customer({ fullname: 'Unspecified', ...defaultInfo }).save();
    }
    const defaultCategory = await Category.findById('0a0aaa0a0aa00000aaaaaa0a');
    if (!defaultCategory) {
      await new Category({ name: 'Uncategorized', description: 'Default Category', ...defaultInfo }).save();
    }
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
