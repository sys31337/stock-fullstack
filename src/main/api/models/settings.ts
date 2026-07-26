import { model, Schema } from 'mongoose';

const settingsSchema = new Schema({
  allowOutOfStockSales: { type: Boolean, default: false },
  allowOutOfStockOrders: { type: Boolean, default: false },
}, { timestamps: true });

const Settings = model('Settings', settingsSchema);
export default Settings;
