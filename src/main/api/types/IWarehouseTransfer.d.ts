import { ObjectId } from "mongoose";

export interface IWarehouseTransferProduct {
  product: ObjectId;
  quantity: number;
  unitPrice?: number;
}

export interface IWarehouseTransfer {
  transferNumber: string;
  fromWarehouse: ObjectId;
  toWarehouse: ObjectId;
  products: IWarehouseTransferProduct[];
  status: 'pending' | 'completed' | 'cancelled';
  notes?: string;
  createdBy: ObjectId;
  approvedBy?: ObjectId;
  completedAt?: Date;
  cancelledAt?: Date;
  cancelReason?: string;
}
