import { ObjectId } from 'mongoose';

export type ChargeType =
  | 'salary'
  | 'rent'
  | 'utility'
  | 'tax'
  | 'marketing'
  | 'maintenance'
  | 'other';

export type ChargePaymentMethod = 'cash' | 'bank' | 'check' | 'other';

export interface ICharge {
  _id?: ObjectId;
  date: Date;
  type: ChargeType;
  amount: number;
  description?: string;
  paymentMethod: ChargePaymentMethod;
  receiptRef?: string;
  warehouse?: ObjectId;
  createdBy?: ObjectId;
  createdAt?: Date;
  updatedAt?: Date;
}
