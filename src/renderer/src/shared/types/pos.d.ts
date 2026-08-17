import { IProduct } from './product';

export interface IPosSession {
  _id: string;
  user: string | { _id: string; fullname?: string; username?: string };
  warehouse?: string | { _id: string; name?: string };
  openingDate: string;
  closingDate?: string;
  openingCash: number;
  expectedCash: number;
  actualCash?: number;
  cashDifference?: number;
  status: 'open' | 'closed';
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CartItem extends IProduct {
  cartId: string;
  quantity: number;
  unitPrice: number;
  totalHT: number;
  totalTTC: number;
}
