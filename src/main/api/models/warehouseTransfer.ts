import { model, Schema } from 'mongoose';
import { IWarehouseTransfer, IWarehouseTransferProduct } from '@api/types/IWarehouseTransfer';

const transferProductSchema = new Schema<IWarehouseTransferProduct>({
  product: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
  quantity: { type: Number, required: true },
  unitPrice: Number,
}, { _id: false });

const warehouseTransferSchema = new Schema<IWarehouseTransfer>({
  transferNumber: { type: String, required: true, unique: true },
  fromWarehouse: { type: Schema.Types.ObjectId, ref: 'Warehouse', required: true, index: true },
  toWarehouse: { type: Schema.Types.ObjectId, ref: 'Warehouse', required: true, index: true },
  products: [transferProductSchema],
  status: {
    type: String,
    enum: ['pending', 'completed', 'cancelled'],
    default: 'pending',
    index: true,
  },
  notes: String,
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  approvedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  completedAt: Date,
  cancelledAt: Date,
  cancelReason: String,
}, { timestamps: true });

warehouseTransferSchema.index({ fromWarehouse: 1, status: 1 });
warehouseTransferSchema.index({ toWarehouse: 1, status: 1 });

const WarehouseTransfer = model<IWarehouseTransfer>('WarehouseTransfer', warehouseTransferSchema);
export default WarehouseTransfer;
