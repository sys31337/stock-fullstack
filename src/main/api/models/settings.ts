import { model, Schema } from 'mongoose';

const settingsSchema = new Schema({
  allowOutOfStockSales: { type: Boolean, default: false },
  allowOutOfStockOrders: { type: Boolean, default: false },
  dashboardStatsEnabled: { type: Boolean, default: true },
  dashboardStatsBlurred: { type: Boolean, default: false },
  companyName: String,
  rc: String,
  nif: String,
  ai: String,
  nis: String,
  companyAddress: String,
  companyPhone: String,
  mobile: String,
  website: String,
  email: String,
  wilaya: String,
  accountNumber: String,
  rib: String,
  articleNumber: String,
  stamp: { type: Number, default: 0 },
  tva: { type: Number, default: 19 },
  tvaEnabled: { type: Boolean, default: true },
  allowPosCredit: { type: Boolean, default: false },
}, { timestamps: true });

const Settings = model('Settings', settingsSchema);
export default Settings;
