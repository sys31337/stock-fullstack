import { ObjectId } from 'mongoose';

export type PosSessionStatus = 'open' | 'closed';

export interface IPosSession {
  _id?: ObjectId;
  user: ObjectId;
  warehouse?: ObjectId;
  openingDate: Date;
  closingDate?: Date;
  openingCash: number;
  expectedCash: number;
  actualCash?: number;
  cashDifference?: number;
  status: PosSessionStatus;
  notes?: string;
  createdAt?: Date;
  updatedAt?: Date;
}
