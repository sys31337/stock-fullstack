import { model, Schema } from 'mongoose';
import { IStockMovement } from '@api/types/IStockMovement';

const stockMovementSchema = new Schema<IStockMovement>({
  product: { type: Schema.Types.ObjectId, ref: 'Product', required: true, index: true },
  warehouse: { type: Schema.Types.ObjectId, ref: 'Warehouse', required: true, index: true },
  type: {
    type: String,
    enum: ['IN', 'OUT', 'TRANSFER_IN', 'TRANSFER_OUT', 'ADJUSTMENT', 'RETURN'],
    required: true,
    index: true,
  },
  quantity: { type: Number, required: true },
  previousStock: Number,
  newStock: Number,
  reference: String,
  relatedBill: { type: Schema.Types.ObjectId, ref: 'Bill' },
  relatedTransfer: { type: Schema.Types.ObjectId, ref: 'WarehouseTransfer' },
  unitPrice: Number,
  totalPrice: Number,
  notes: String,
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });

stockMovementSchema.index({ warehouse: 1, createdAt: -1 });
stockMovementSchema.index({ product: 1, warehouse: 1 });

const StockMovement = model<IStockMovement>('StockMovement', stockMovementSchema);
export default StockMovement;
