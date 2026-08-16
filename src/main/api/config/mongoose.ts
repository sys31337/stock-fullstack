import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import { log, logError } from '@api/utils';
import { startMongoDB } from '@api/config/mongodb';
import Customer from '@api/models/customers';
import Category from '@api/models/categories';
import Warehouse from '@api/models/warehouse';
import User from '@api/models/user';
import Role from '@api/models/role';
import { ALL_PERMISSIONS } from '@api/constants/permissions';
import {
  setHostChangeTracking,
  registerHostChangeTracking,
} from '@api/plugins/syncChangeTracking';
import { seedChangeLogFromExistingData, repairChangeLog } from '@api/services/syncChangeLogService';
import Bill from '@api/models/bills';

let skipDefaultSeeding = true;

export function setSkipDefaultSeeding(skip: boolean): void {
  skipDefaultSeeding = skip;
}

/**
 * Drops the legacy unique compound index on bills { type, orderId } so duplicate
 * order IDs are allowed. A non-unique compound index is recreated by Mongoose
 * from the schema definition.
 */
async function migrateBillOrderIdIndex(): Promise<void> {
  try {
    const collection = Bill.collection;
    const indexes = await collection.indexes();
    const legacyUnique = indexes.find(
      (idx: any) =>
        idx.key &&
        idx.key.type === 1 &&
        idx.key.orderId === 1 &&
        idx.unique === true,
    );
    if (legacyUnique && legacyUnique.name) {
      await collection.dropIndex(legacyUnique.name);
      log('Dropped legacy unique bill orderId index');
    }
  } catch (error) {
    logError('Failed to migrate bill orderId index:', error);
  }
}

const connectDB = async (dbName?: string): Promise<boolean> => {
  const uri = await startMongoDB(dbName);
  mongoose.set('strictQuery', true);
  mongoose.connect(uri);

  const db: mongoose.Connection = mongoose.connection;

  db.once('open', async () => {
    // In client mode reference data and users are replicated from the host,
    // so we skip creating default seed records to avoid conflicts.
    if (!skipDefaultSeeding) {
      const defaultInfo = { _id: '0a0aaa0a0aa00000aaaaaa0a', createdAt: new Date('1970'), updatedAt: new Date('1970') };
      const defaultCustomer = await Customer.findById(defaultInfo._id);
      if (!defaultCustomer) {
        await new Customer({ fullname: 'Unspecified', ...defaultInfo }).save();
      }
      const defaultCategory = await Category.findById('0a0aaa0a0aa00000aaaaaa0a');
      if (!defaultCategory) {
        await new Category({ name: 'Uncategorized', description: 'Default Category', ...defaultInfo }).save();
      }

      const defaultWarehouse = await Warehouse.findById('0a0aaa0a0aa00000aaaaaa0b');
      if (!defaultWarehouse) {
        await new Warehouse({
          name: 'Main Warehouse',
          code: 'main',
          address: 'Default Address',
          isActive: true,
          _id: '0a0aaa0a0aa00000aaaaaa0b',
          createdAt: new Date('1970'),
          updatedAt: new Date('1970'),
        }).save();
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
    }

    // Remove the legacy unique index on bills { type, orderId } so duplicate
    // order IDs are allowed. This runs in both host and client modes.
    await migrateBillOrderIdIndex();

    // Enable host-side change tracking so local mutations are broadcast to
    // linked clients. Client mode pulls from the host instead.
    if (!skipDefaultSeeding) {
      setHostChangeTracking(true);
      registerHostChangeTracking();
      const runChangeLogRepair = (): void => {
        repairChangeLog().then((result) => {
          if (result.created > 0 || result.deleted > 0) {
            log(`Repaired sync change log: +${result.created} creates, +${result.deleted} deletes`);
          }
        }).catch(() => {});
      };
      seedChangeLogFromExistingData().then((count) => {
        if (count > 0) log(`Seeded sync change log with ${count} existing documents`);
      }).catch(() => {});
      runChangeLogRepair();
      // Data written directly to the DB (seeds, imports, migrations) bypasses
      // the change-tracking hooks, so without periodic repair the host keeps
      // answering snapshot requests with maxSequence=0 and linked clients are
      // forced to re-pull every collection on every poll. Repair on an interval
      // keeps the change log consistent and the sequence counter advancing.
      const repairTimer = setInterval(runChangeLogRepair, 5 * 60 * 1000);
      repairTimer.unref?.();
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
