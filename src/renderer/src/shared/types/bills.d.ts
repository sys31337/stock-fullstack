import { ICategory } from "./category";
import { ICustomer } from "./customer";
import { IProduct } from "./product";

export interface IBill {
  _id: string;
  billDate: string;
  orderId: number;
  category: string | ICategory;
  customer: string | ICustomer;
  type: 'BUY' | 'SALE' | 'ORDER';
  products: IProduct[],
  orderTotalHT: string | number;
  orderTotalTTC: string | number;
  orderPaid: string | number;
  orderDebts: string | number;
  paymentMethod: 'Cash';
  pricingCategory: number;
  description: string;
}