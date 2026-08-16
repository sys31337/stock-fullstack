import mongoose, { Schema } from 'mongoose';
import { connectDB, closeDB, setSkipDefaultSeeding } from '../src/main/api/config/mongoose';
import { isHostChangeTrackingEnabled } from '../src/main/api/plugins/syncChangeTracking';
import '../src/main/api/models';

async function waitForHostTracking(timeoutMs: number): Promise<boolean> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    if (isHostChangeTrackingEnabled()) return true;
    await new Promise((r) => setTimeout(r, 50));
  }
  return false;
}

async function main(): Promise<void> {
  setSkipDefaultSeeding(false);
  await connectDB('stock');
  await waitForHostTracking(15000);

  const User = (await import('../src/main/api/models/user')).default;
  const registered = mongoose.connection.models['User'];
  console.log('User === registered ?', User === registered);
  console.log('User.schema === registered.schema ?', User.schema === registered.schema);

  const usersSchema = User.schema as any;
  const hooks = usersSchema.s?.hooks;
  console.log('kareem pres save:', hooks?._pres?.get('save')?.length, '| posts save:', hooks?._posts?.get('save')?.length);

  // (A) new User().save()
  User.schema.pre('save', function dbgA() { console.log('[A] pre save'); });
  User.schema.post('save', function dbgA() { console.log('[A] post save'); });
  const username = `diag_${Date.now()}`;
  const u = await new User({ username, fullname: 'x', password: 'x', salt: 'x', status: 'active', profilePicture: 'default.png', preferredLanguage: 'fr', permissions: [], userPermissions: [], assignedWarehouses: [], warehouseAccessMode: 'assigned' }).save();
  console.log('[A] saved', u._id);

  // (B) User.create()
  User.schema.post('save', function dbgB() { console.log('[B] post save'); });
  const u2 = await User.create({ username: `diagb_${Date.now()}`, fullname: 'x', password: 'x', salt: 'x', status: 'active', profilePicture: 'default.png', preferredLanguage: 'fr', permissions: [], userPermissions: [], assignedWarehouses: [], warehouseAccessMode: 'assigned' });
  console.log('[B] created', u2._id);

  // (C) fresh model from the SAME schema object (in-process, after connect)
  const Clone = mongoose.model('UserCloneProbe', usersSchema);
  Clone.schema.post('save', function dbgC() { console.log('[C] post save'); });
  const u3 = await Clone.create({ username: `diagc_${Date.now()}`, fullname: 'x', password: 'x', salt: 'x', status: 'active', profilePicture: 'default.png', preferredLanguage: 'fr', permissions: [], userPermissions: [], assignedWarehouses: [], warehouseAccessMode: 'assigned' });
  console.log('[C] created', u3._id);

  // (D) fresh model from a fresh schema (same shape)
  const S4 = new Schema({ username: { type: String, unique: true, required: true }, password: String, salt: String, fullname: String, status: String }, { timestamps: true });
  S4.post('save', function dbgD() { console.log('[D] post save'); });
  const D = mongoose.model('UserProbeD', S4);
  const u4 = await D.create({ username: `diagd_${Date.now()}`, password: 'x', salt: 'x', fullname: 'x', status: 'active' });
  console.log('[D] created', u4._id);

  await User.deleteOne({ _id: u._id });
  await User.deleteOne({ _id: u2._id });
  await Clone.deleteOne({ _id: u3._id });
  await D.deleteOne({ _id: u4._id });
  await closeDB();
  process.exit(0);
}

main().catch((error) => { console.error(error); process.exit(1); });
