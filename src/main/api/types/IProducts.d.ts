import { ObjectId } from 'mongoose';
import { ICustomer } from './ICustomer';
import { ICategory } from './ICategory';

export interface IWarehouseStock {
  warehouse: ObjectId;
  quantity: number;
  stack: number;
  reserved: number;
}

export interface IProduct {
  _id?: string | ObjectId;
  id: string;
  barCode: string;
  productName: string;
  quantity: number;
  quantityDifference?: number;
  stack: number;
  buyPrice: number;
  sellPrice_1: number;
  sellPrice_2: number;
  sellPrice_3: number;
  tva: number;
  reserved?: number;
  category?: ICategory | ObjectId;
  customer?: ICustomer | ObjectId;
  notify?: boolean;
  warehouseStock?: IWarehouseStock[];
}
