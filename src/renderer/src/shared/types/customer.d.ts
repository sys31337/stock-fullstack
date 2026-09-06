import { IProduct } from './product';

export interface ICustomer {
  _id: string;
  fullname: string,
  address?: string,
  phoneNumber?: string,
  email?: string,
  wilaya?: string,
  daira?: string,
  baladiya?: string,
  addressLat?: number,
  addressLng?: number,
  hasWhatsapp?: boolean,
  whatsapp?: string,
  viber?: string,
  telegram?: string,
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