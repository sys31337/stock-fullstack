import { IProduct } from './product';

export interface ICustomer {
  _id: string;
  fullname: string,
  address?: string,
  phoneNumber?: string,
  email?: string,
  wilaya?: string,
  hasWhatsapp?: boolean,
  rc?: string,
  nif?: string,
  nis?: string,
  ai?: string,
  nar?: string,
  town?: string,
  city?: string,
  debts?: Number,
  credit?: Number,
  type: string,
  products: IProduct[],
}