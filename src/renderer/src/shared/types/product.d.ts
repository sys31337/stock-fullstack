import { ICategory } from './category';
import { ICustomer } from './customer';

export interface IProduct {
  _id?: string | string;
  id: string;
  barCode: string;
  productName: string;
  quantity: number;
  quantityDifference?: number;
  stack: number;
  buyPrice: number;
  totalHT: number;
  totalTTC: number;
  createdAt?: Date;
  updatedAt?: Date;
  sellPrice_1: number;
  sellPrice_2: number;
  sellPrice_3: number;
  tva: number;
  reserved?: string;
  category?: ICategory | string;
  customer?: ICustomer | string;
  notify?: boolean;
}