export type ChargeType =
  | 'salary'
  | 'rent'
  | 'utility'
  | 'tax'
  | 'marketing'
  | 'maintenance'
  | 'other';

export type ChargePaymentMethod = 'cash' | 'bank' | 'check' | 'other';

export interface ICharge {
  _id: string;
  date: string;
  type: ChargeType;
  amount: number;
  description?: string;
  paymentMethod: ChargePaymentMethod;
  receiptRef?: string;
  warehouse?: string | { _id: string; name?: string };
  createdBy?: string | { _id: string; fullname?: string; username?: string };
  createdAt?: string;
  updatedAt?: string;
}

export interface ChargeSummary {
  total: number;
  byType: { _id: ChargeType; total: number; count: number }[];
}
