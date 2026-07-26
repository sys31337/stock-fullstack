import { model, Schema } from 'mongoose';

const settingsSchema = new Schema({
  allowOutOfStockSales: { type: Boolean, default: false },
  allowOutOfStockOrders: { type: Boolean, default: false },
  companyName: String,
  rc: String,
  nif: String,
  ai: String,
  nis: String,
  companyAddress: String,
  companyPhone: String,
}, { timestamps: true });

const Settings = model('Settings', settingsSchema);
export default Settings;
