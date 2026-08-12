import { ICustomer } from './customer';

export interface ITransaction {
  _id: string;
  customer: ICustomer | string;
  type: 'FUND' | 'SALE' | 'BUY';
  addedAmount: number;
  oldFunds: number;
  newFunds: number;
  bill?: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}
