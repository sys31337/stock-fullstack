export interface InventoryValuation {
  atCost: number;
  atSell1: number;
  atSell2: number;
  atSell3: number;
  margin1: number;
  margin2: number;
  margin3: number;
}

export interface ReportsOverview {
  todaySalesAmount: number;
  todayCashCollected: number;
  profitThisMonth: number;
  profitThisYear: number;
  totalProducts: number;
  totalClients: number;
  totalSuppliers: number;
  employeeDebt: number;
  inventoryValuation: InventoryValuation;
}

export interface LedgerRow {
  _id: string;
  type: 'FUND' | 'SALE' | 'BUY';
  description?: string;
  createdAt: string;
  addedAmount: number;
  balanceBefore: number;
  balanceAfter: number;
  reference: string;
  customer?: { _id: string; fullname: string; type: string } | null;
  bill?: {
    _id: string;
    orderId: string;
    type: string;
    orderTotalHT: number;
    orderTotalTTC: number;
    orderPaid: number;
    orderDebts: number;
    billDate: string;
    salesPerson?: string | { _id: string; fullname?: string } | null;
    products?: any[];
  } | null;
}

export interface LedgerResponse {
  items: LedgerRow[];
  total: number;
  page: number;
  limit: number;
}

export interface LedgerDetailRow {
  _id: string;
  type: 'FUND' | 'SALE' | 'BUY';
  description?: string;
  createdAt: string;
  addedAmount: number;
  balanceBefore: number;
  balanceAfter: number;
  reference: string;
  sellAmount: number | null;
  purchaseAmount: number | null;
  payment: number;
  fees: number;
  products: any[];
}

export interface LedgerDetailResponse {
  customer: { _id: string; fullname: string; type: string; credit: number; debts: number };
  rows: LedgerDetailRow[];
  currentBalance: number;
}

export interface LedgerStatementRow {
  _id: string;
  type: 'FUND' | 'SALE' | 'BUY';
  reference: string;
  createdAt: string;
  amount: number;
  payment: number;
  balance: number;
}

export interface LedgerStatementResponse {
  customer: { _id: string; fullname: string; type: string; credit: number; debts: number };
  rows: LedgerStatementRow[];
  currentBalance: number;
}

export interface CashStatementResponse {
  startDate: string;
  endDate: string;
  purchases: { total: number; paid: number; debt: number };
  sales: { total: number; paid: number; debt: number };
  deliveryReturns: number;
  other: { received: number; spent: number };
  paidIn: number;
  paidOut: number;
  cashierBalance: number;
}

export interface ProductStatRow {
  _id: string;
  orderId: string;
  type: string;
  billDate: string;
  createdAt: string;
  customer?: { _id: string; fullname: string; type: string } | null;
  quantity: number;
  unitPrice: number;
}

export interface ProductStatsResponse {
  product: { _id: string; productName: string; barCode: string };
  rows: ProductStatRow[];
  total: number;
  billCount: number;
  totalQuantity: number;
  page: number;
  limit: number;
}

export interface SalespersonOption {
  _id: string;
  fullname: string;
  username?: string;
  isDeliveryPerson: boolean;
  role?: string | null;
}

export interface SalespersonChartPoint {
  date: string;
  revenue: number;
  bills: number;
}

export interface SalespersonChartResponse {
  salesperson: { _id: string; fullname: string; isDeliveryPerson: boolean };
  points: SalespersonChartPoint[];
  totalRevenue: number;
  billCount: number;
}

export interface DeliveryReturnRecord {
  _id: string;
  deliveryPerson: { _id: string; fullname?: string; username?: string; type?: string } | string;
  warehouse?: { _id: string; name?: string; code?: string } | string;
  deliveryDate: string;
  expectedAmount: number;
  enteredAmount: number;
  returnedAmount: number;
  status: 'pending' | 'confirmed';
  notes?: string;
  createdBy?: string;
  updatedBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DeliveryReturnListResponse {
  items: DeliveryReturnRecord[];
  total: number;
  page: number;
  limit: number;
}
