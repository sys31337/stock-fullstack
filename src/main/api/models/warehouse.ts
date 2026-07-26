import { model, Schema } from 'mongoose';
import { IWarehouse } from '@api/types/IWarehouse';

const warehouseSchema = new Schema<IWarehouse>({
  name: { type: String, required: true },
  code: { type: String, required: true, unique: true },
  address: String,
  phone: String,
  email: String,
  isActive: { type: Boolean, default: true },
  manager: { type: Schema.Types.ObjectId, ref: 'User' },
  rc: String,
  nif: String,
  ai: String,
  nis: String,
  metadata: { type: Map, of: String },
}, { timestamps: true });

const Warehouse = model<IWarehouse>('Warehouse', warehouseSchema);
export default Warehouse;
