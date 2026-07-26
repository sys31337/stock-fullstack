import { ObjectId } from "mongoose";

export interface IStockMovement {
  product: ObjectId;
  warehouse: ObjectId;
  type: 'IN' | 'OUT' | 'TRANSFER_IN' | 'TRANSFER_OUT' | 'ADJUSTMENT' | 'RETURN';
  quantity: number;
  previousStock?: number;
  newStock?: number;
  reference?: string;
  relatedBill?: ObjectId;
  relatedTransfer?: ObjectId;
  unitPrice?: number;
  totalPrice?: number;
  notes?: string;
  createdBy: ObjectId;
}
