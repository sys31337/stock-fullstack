import { IProduct } from './IProducts';

export interface ICustomer {
  fullname: String,
  address?: String,
  phoneNumber?: String,
  email?: String,
  rc?: String,
  nif?: String,
  nar?: String,
  debts?: Number,
  type: String,
  products: IProduct[],
}