import { ICategory } from "./category";
import { ICustomer } from "./customer";
import { IProduct } from "./product";

export interface IContentHistoryEntry {
  content: string;
  editedBy: string | { _id: string; username?: string };
  editedAt: string;
  description: string;
}

export interface IBill {
  _id: string;
  billDate: string;
  orderId: string;
  manualOrderId?: boolean;
  category: string | ICategory;
  customer: string | ICustomer;
  type: 'BUY' | 'SALE' | 'ORDER' | 'DELIVERY' | 'POS';
  source?: 'POS' | 'MANUAL';
  status?: 'pending' | 'cancelled' | 'completed';
  reservedUntil?: string;
  products: IProduct[],
  orderTotalHT: string | number;
  orderTotalTTC: string | number;
  orderPaid: string | number;
  orderDebts: string | number;
  paymentMethod: 'Cash';
  pricingCategory: number;
  description: string;
  warehouse?: string;
  salesPerson?: string | { _id: string; fullname?: string } | null;
  content?: string;
  contentHistory?: IContentHistoryEntry[];
}