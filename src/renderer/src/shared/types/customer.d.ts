import { IProduct } from './product';

export interface ICustomer {
  _id: string;
  fullname: string,
  address?: string,
  phoneNumber?: string,
  email?: string,
  rc?: string,
  nif?: string,
  nar?: string,
  debts?: Number,
  type: string,
  products: IProduct[],
}