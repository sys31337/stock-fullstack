import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import { log, logError } from '@api/utils';
import { startMongoDB } from '@api/config/mongodb';
import Customer from '@api/models/customers';
import Category from '@api/models/categories';
import User from '@api/models/user';
import Role from '@api/models/role';
import { ALL_PERMISSIONS } from '@api/constants/permissions';

const connectDB = async (): Promise<boolean> => {
  const uri = await startMongoDB();
  mongoose.set('strictQuery', true);
  mongoose.connect(uri);

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

    const adminExists = await User.findOne({ username: 'admin' });
    if (!adminExists) {
      let adminRole = await Role.findOne({ name: 'Admin' });
      if (!adminRole) {
        adminRole = await new Role({
          name: 'Admin',
          description: 'Full system access',
          permissions: ALL_PERMISSIONS,
          isDefault: false,
        }).save();
      }

      const salt = await bcrypt.genSalt();
      const hashedPassword = await bcrypt.hash('admin', salt);

      await new User({
        username: 'admin',
        password: hashedPassword,
        salt,
        fullname: 'Administrator',
        email: 'admin@solustock.local',
        isMainAccount: true,
        type: 'USER',
        status: 'active',
        role: adminRole._id,
        permissions: ALL_PERMISSIONS,
        userPermissions: [],
        assignedWarehouses: [],
        warehouseAccessMode: 'all',
        preferredLanguage: 'en',
        profilePicture: 'default.png',
      }).save();

      log('Default admin user created (admin / admin)');
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
