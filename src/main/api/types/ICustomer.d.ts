import { IProduct } from './IProducts';

export interface ICustomer {
  fullname: String,
  address?: String,
  phoneNumber?: String,
  email?: String,
  wilaya?: String,
  hasWhatsapp?: Boolean,
  rc?: String,
  nif?: String,
  nis?: String,
  ai?: String,
  nar?: String,
  debts?: Number,
  credit?: Number,
  type: String,
  products: IProduct[],
}