import { Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import Bill from '@api/models/bills';
import Product from '@api/models/products';
import Customer from '@api/models/customers';
import User from '@api/models/user';
import Transaction from '@api/models/transactions';
import DeliveryReturn from '@api/models/deliveryReturn';
import { IUserIdRequest } from '@api/types/common';

const SALES_TYPES = ['SALE', 'DELIVERY'];

interface DateRange {
  start?: Date;
  end?: Date;
}

const getWarehouseFilter = (req: IUserIdRequest): any => {
  const { warehouse } = req.query;
  const warehouseFilter: any = {};
  if (warehouse) {
    warehouseFilter.warehouse = warehouse;
  } else if (!req.isMainAccount && req.assignedWarehouses?.length) {
    warehouseFilter.warehouse = { $in: req.assignedWarehouses };
  }
  return warehouseFilter;
};

const parseRange = (req: IUserIdRequest): DateRange => {
  const { startDate, endDate } = req.query;
  const range: DateRange = {};
  if (startDate) {
    const start = new Date(startDate as string);
    if (!Number.isNaN(start.getTime())) {
      start.setHours(0, 0, 0, 0);
      range.start = start;
    }
  }
  if (endDate) {
    const end = new Date(endDate as string);
    if (!Number.isNaN(end.getTime())) {
      end.setHours(23, 59, 59, 999);
      range.end = end;
    }
  }
  return range;
};

const createdAtRange = (range: DateRange): any => {
  const filter: any = {};
  if (range.start) filter.$gte = range.start;
  if (range.end) filter.$lte = range.end;
  return filter;
};

const round2 = (n: number): number => Math.round(n * 100) / 100;

// ---------------------------------------------------------------------------
// 1. Overview / global statistics
// ---------------------------------------------------------------------------
const getOverview = async (_req: IUserIdRequest, res: Response, next: NextFunction) => {
  try {
    const now = new Date();
    const today = new Date(now);
    today.setHours(0, 0, 0, 0);

    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const yearStart = new Date(now.getFullYear(), 0, 1);

    const [products, clients, suppliers] = await Promise.all([
      Product.countDocuments({}),
      Customer.countDocuments({ type: 'Client' }),
      Customer.countDocuments({ type: 'Supplier' }),
    ]);

    const salesMatch = (gte: Date) => ({
      type: { $in: SALES_TYPES },
      status: { $ne: 'cancelled' },
      createdAt: { $gte: gte },
    });

    const [todaySalesAgg, todayCashAgg, monthProfitAgg, yearProfitAgg, employeeDebtAgg, valuationAgg] = await Promise.all([
      Bill.aggregate([
        { $match: salesMatch(today) },
        { $group: { _id: null, total: { $sum: '$orderTotalTTC' } } },
      ]),
      Bill.aggregate([
        { $match: salesMatch(today) },
        { $group: { _id: null, cash: { $sum: '$orderPaid' } } },
      ]),
      Bill.aggregate([
        { $match: { type: { $in: SALES_TYPES }, status: { $ne: 'cancelled' }, createdAt: { $gte: monthStart } } },
        { $unwind: '$products' },
        {
          $group: {
            _id: null,
            revenue: { $sum: '$orderTotalTTC' },
            cost: { $sum: { $multiply: [{ $toDouble: '$products.quantity' }, { $toDouble: '$products.buyPrice' }] } },
          },
        },
      ]),
      Bill.aggregate([
        { $match: { type: { $in: SALES_TYPES }, status: { $ne: 'cancelled' }, createdAt: { $gte: yearStart } } },
        { $unwind: '$products' },
        {
          $group: {
            _id: null,
            revenue: { $sum: '$orderTotalTTC' },
            cost: { $sum: { $multiply: [{ $toDouble: '$products.quantity' }, { $toDouble: '$products.buyPrice' }] } },
          },
        },
      ]),
      DeliveryReturn.aggregate([
        {
          $group: {
            _id: null,
            outstanding: {
              $sum: { $max: [{ $subtract: ['$expectedAmount', '$returnedAmount'] }, 0] },
            },
          },
        },
      ]),
      Product.aggregate([
        {
          $group: {
            _id: null,
            atCost: { $sum: { $multiply: ['$quantity', '$buyPrice'] } },
            atSell1: { $sum: { $multiply: ['$quantity', '$sellPrice_1'] } },
            atSell2: { $sum: { $multiply: ['$quantity', '$sellPrice_2'] } },
            atSell3: { $sum: { $multiply: ['$quantity', '$sellPrice_3'] } },
          },
        },
      ]),
    ]);

    const monthProfit = monthProfitAgg[0] || { revenue: 0, cost: 0 };
    const yearProfit = yearProfitAgg[0] || { revenue: 0, cost: 0 };
    const valuation = valuationAgg[0] || { atCost: 0, atSell1: 0, atSell2: 0, atSell3: 0 };

    return res.status(200).send({
      todaySalesAmount: Math.round(todaySalesAgg[0]?.total || 0),
      todayCashCollected: Math.round(todayCashAgg[0]?.cash || 0),
      profitThisMonth: Math.round(monthProfit.revenue - monthProfit.cost),
      profitThisYear: Math.round(yearProfit.revenue - yearProfit.cost),
      totalProducts: products,
      totalClients: clients,
      totalSuppliers: suppliers,
      employeeDebt: Math.round(employeeDebtAgg[0]?.outstanding || 0),
      inventoryValuation: {
        atCost: Math.round(valuation.atCost),
        atSell1: Math.round(valuation.atSell1),
        atSell2: Math.round(valuation.atSell2),
        atSell3: Math.round(valuation.atSell3),
        margin1: Math.round(valuation.atSell1 - valuation.atCost),
        margin2: Math.round(valuation.atSell2 - valuation.atCost),
        margin3: Math.round(valuation.atSell3 - valuation.atCost),
      },
    });
  } catch (error) {
    return next(error);
  }
};

// ---------------------------------------------------------------------------
// 2. Journal ledger
// ---------------------------------------------------------------------------
const getLedger = async (req: IUserIdRequest, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query.page as string, 10) || 1;
    const limit = Math.min(parseInt(req.query.limit as string, 10) || 25, 100);
    const skip = (page - 1) * limit;
    const { party, search } = req.query;
    const range = parseRange(req);

    const filter: any = {};
    if (range.start || range.end) filter.createdAt = createdAtRange(range);
    if (party) filter.customer = party;

    if (search) {
      const term = String(search).trim();
      const [matchingCustomers, matchingBills] = await Promise.all([
        Customer.find({ fullname: { $regex: term, $options: 'i' } }).select('_id').lean(),
        Bill.find({ orderId: { $regex: term, $options: 'i' } }).select('_id').lean(),
      ]);
      filter.$or = [
        { customer: { $in: matchingCustomers.map((c: any) => c._id) } },
        { bill: { $in: matchingBills.map((b: any) => b._id) } },
        { description: { $regex: term, $options: 'i' } },
      ];
    }

    const [items, total] = await Promise.all([
      Transaction.find(filter)
        .populate('customer', 'fullname type')
        .populate('bill', 'orderId type orderTotalHT orderTotalTTC orderPaid orderDebts billDate salesPerson')
        .sort('-createdAt')
        .skip(skip)
        .limit(limit)
        .lean(),
      Transaction.countDocuments(filter),
    ]);

    const rows = items.map((tx: any) => ({
      _id: tx._id,
      type: tx.type,
      description: tx.description,
      createdAt: tx.createdAt,
      addedAmount: tx.addedAmount,
      balanceBefore: tx.oldFunds,
      balanceAfter: tx.newFunds,
      reference: tx.bill?.orderId || tx.description || tx.type,
      customer: tx.customer || null,
      bill: tx.bill || null,
    }));

    return res.status(200).send({ items: rows, total, page, limit });
  } catch (error) {
    return next(error);
  }
};

const getLedgerDetail = async (req: IUserIdRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).send({ message: 'Invalid customer id' });
    }
    const customer = await Customer.findById(id).lean();
    if (!customer) return res.status(404).send({ message: 'Customer not found' });

    const range = parseRange(req);
    const filter: any = { customer: id };
    if (range.start || range.end) filter.createdAt = createdAtRange(range);

    const transactions = await Transaction.find(filter)
      .populate('customer', 'fullname type')
      .populate({
        path: 'bill',
        select: 'orderId type orderTotalHT orderTotalTTC orderPaid orderDebts billDate products salesPerson',
      })
      .sort('createdAt')
      .lean();

    const rows = transactions.map((tx: any) => {
      const bill = tx.bill;
      return {
        _id: tx._id,
        type: tx.type,
        description: tx.description,
        createdAt: tx.createdAt,
        addedAmount: tx.addedAmount,
        balanceBefore: tx.oldFunds,
        balanceAfter: tx.newFunds,
        reference: bill?.orderId || tx.description || tx.type,
        sellAmount: bill && tx.type === 'SALE' ? bill.orderTotalTTC : null,
        purchaseAmount: bill && tx.type === 'BUY' ? bill.orderTotalTTC : null,
        payment: bill ? bill.orderPaid : tx.addedAmount,
        fees: 0,
        products: bill?.products || [],
      };
    });

    return res.status(200).send({ customer, rows, currentBalance: customer.credit || 0 });
  } catch (error) {
    return next(error);
  }
};

const getLedgerStatement = async (req: IUserIdRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).send({ message: 'Invalid customer id' });
    }
    const customer = await Customer.findById(id).lean();
    if (!customer) return res.status(404).send({ message: 'Customer not found' });

    const range = parseRange(req);
    const filter: any = { customer: id };
    if (range.start || range.end) filter.createdAt = createdAtRange(range);

    const transactions = await Transaction.find(filter)
      .populate('customer', 'fullname type')
      .populate('bill', 'orderId orderTotalTTC orderPaid')
      .sort('createdAt')
      .lean();

    const rows = transactions.map((tx: any) => {
      const bill = tx.bill;
      return {
        _id: tx._id,
        type: tx.type,
        reference: bill?.orderId || tx.description || tx.type,
        createdAt: tx.createdAt,
        amount: bill ? bill.orderTotalTTC : tx.addedAmount,
        payment: bill ? bill.orderPaid : tx.addedAmount,
        balance: tx.newFunds,
      };
    });

    return res.status(200).send({ customer, rows, currentBalance: customer.credit || 0 });
  } catch (error) {
    return next(error);
  }
};

// ---------------------------------------------------------------------------
// 3. Period cash statement
// ---------------------------------------------------------------------------
const getCashStatement = async (req: IUserIdRequest, res: Response, next: NextFunction) => {
  try {
    const range = parseRange(req);
    if (!range.start || !range.end) {
      return res.status(400).send({ message: 'Both startDate and endDate are required' });
    }
    const dateFilter = createdAtRange(range);
    const active = { status: { $ne: 'cancelled' } };
    const warehouseFilter = getWarehouseFilter(req);

    const [purchasesAgg, salesAgg, deliveryReturnsAgg, otherTxAgg] = await Promise.all([
      Bill.aggregate([
        { $match: { ...warehouseFilter, type: 'BUY', ...active, createdAt: dateFilter } },
        { $group: { _id: null, total: { $sum: '$orderTotalTTC' }, paid: { $sum: '$orderPaid' }, debts: { $sum: '$orderDebts' } } },
      ]),
      Bill.aggregate([
        { $match: { type: { $in: SALES_TYPES }, ...active, createdAt: dateFilter } },
        { $group: { _id: null, total: { $sum: '$orderTotalTTC' }, paid: { $sum: '$orderPaid' }, debts: { $sum: '$orderDebts' } } },
      ]),
      DeliveryReturn.aggregate([
        { $match: { deliveryDate: { $gte: range.start, $lte: range.end } } },
        { $group: { _id: null, returned: { $sum: '$returnedAmount' } } },
      ]),
      Transaction.aggregate([
        {
          $match: {
            bill: null,
            createdAt: dateFilter,
          },
        },
        {
          $group: {
            _id: null,
            received: { $sum: { $max: ['$addedAmount', 0] } },
            spent: { $sum: { $min: ['$addedAmount', 0] } },
          },
        },
      ]),
    ]);

    const purchases = purchasesAgg[0] || { total: 0, paid: 0, debts: 0 };
    const sales = salesAgg[0] || { total: 0, paid: 0, debts: 0 };
    const deliveryReturns = deliveryReturnsAgg[0]?.returned || 0;
    const other = otherTxAgg[0] || { received: 0, spent: 0 };

    const paidIn = Math.round(sales.paid + deliveryReturns + other.received);
    const paidOut = Math.round(purchases.paid + Math.abs(other.spent));
    const cashierBalance = paidIn - paidOut;

    return res.status(200).send({
      startDate: range.start,
      endDate: range.end,
      purchases: { total: round2(purchases.total), paid: round2(purchases.paid), debt: round2(purchases.debts) },
      sales: { total: round2(sales.total), paid: round2(sales.paid), debt: round2(sales.debts) },
      deliveryReturns: round2(deliveryReturns),
      other: { received: round2(other.received), spent: round2(Math.abs(other.spent)) },
      paidIn,
      paidOut,
      cashierBalance,
    });
  } catch (error) {
    return next(error);
  }
};

// ---------------------------------------------------------------------------
// 4. Per-product sales statistics
// ---------------------------------------------------------------------------
const getProductStats = async (req: IUserIdRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).send({ message: 'Invalid product id' });
    }
    const product = await Product.findById(id).lean();
    if (!product) return res.status(404).send({ message: 'Product not found' });

    const page = parseInt(req.query.page as string, 10) || 1;
    const limit = Math.min(parseInt(req.query.limit as string, 10) || 25, 100);
    const skip = (page - 1) * limit;
    const { party } = req.query;
    const range = parseRange(req);

    const match: any = {
      type: { $in: [...SALES_TYPES, 'BUY'] },
      status: { $ne: 'cancelled' },
      products: { $elemMatch: { $or: [{ id: String(product._id) }, { barCode: product.barCode }] } },
    };
    if (party) match.customer = party;
    if (range.start || range.end) match.createdAt = createdAtRange(range);

    const allBills = await Bill.find(match)
      .populate('customer', 'fullname type')
      .lean();

    const rows = allBills
      .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(skip, skip + limit)
      .map((bill: any) => {
        const line = bill.products.find(
          (p: any) => String(p.id) === String(product._id) || p.barCode === product.barCode,
        );
        const isBuy = bill.type === 'BUY';
        const unitPrice = isBuy ? line.buyPrice : (line.sellPrice_1 ?? line.buyPrice);
        return {
          _id: bill._id,
          orderId: bill.orderId,
          type: bill.type,
          billDate: bill.billDate,
          createdAt: bill.createdAt,
          customer: bill.customer || null,
          quantity: line?.quantity || 0,
          unitPrice,
        };
      });

    const totalQuantity = allBills.reduce((sum, bill) => {
      const line = bill.products.find(
        (p: any) => String(p.id) === String(product._id) || p.barCode === product.barCode,
      );
      return sum + (line?.quantity || 0);
    }, 0);

    return res.status(200).send({
      product: { _id: product._id, productName: product.productName, barCode: product.barCode },
      rows,
      total: allBills.length,
      billCount: allBills.length,
      totalQuantity,
      page,
      limit,
    });
  } catch (error) {
    return next(error);
  }
};

// ---------------------------------------------------------------------------
// 5. Per-salesperson revenue
// ---------------------------------------------------------------------------
const getSalespeople = async (_req: IUserIdRequest, res: Response, next: NextFunction) => {
  try {
    const users = await User.find({ status: 'active' })
      .select('fullname username type role')
      .populate('role', 'name')
      .lean();
    return res.status(200).send(
      users.map((u: any) => ({
        _id: u._id,
        fullname: u.fullname || u.username,
        username: u.username,
        isDeliveryPerson: u.type === 'VENDOR',
        role: (u.role as any)?.name || null,
      })),
    );
  } catch (error) {
    return next(error);
  }
};

const getSalespersonChart = async (req: IUserIdRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).send({ message: 'Invalid user id' });
    }
    const range = parseRange(req);
    if (!range.start || !range.end) {
      return res.status(400).send({ message: 'Both startDate and endDate are required' });
    }
    const groupBy = req.query.groupBy === 'month' ? '%Y-%m' : '%Y-%m-%d';

    const [salesperson, pointsAgg] = await Promise.all([
      User.findById(id).select('fullname username type').lean(),
      Bill.aggregate([
        {
          $match: {
            salesPerson: new mongoose.Types.ObjectId(id),
            type: { $in: SALES_TYPES },
            status: { $ne: 'cancelled' },
            createdAt: createdAtRange(range),
          },
        },
        {
          $group: {
            _id: { $dateToString: { format: groupBy, date: '$createdAt' } },
            revenue: { $sum: '$orderTotalTTC' },
            bills: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),
    ]);

    if (!salesperson) return res.status(404).send({ message: 'User not found' });

    const points = pointsAgg.map((p: any) => ({ date: p._id, revenue: p.revenue, bills: p.bills }));
    const totalRevenue = points.reduce((sum, p) => sum + p.revenue, 0);

    return res.status(200).send({
      salesperson: {
        _id: salesperson._id,
        fullname: salesperson.fullname || salesperson.username,
        isDeliveryPerson: salesperson.type === 'VENDOR',
      },
      points,
      totalRevenue,
      billCount: points.reduce((sum, p) => sum + p.bills, 0),
    });
  } catch (error) {
    return next(error);
  }
};

export {
  getOverview,
  getLedger,
  getLedgerDetail,
  getLedgerStatement,
  getCashStatement,
  getProductStats,
  getSalespeople,
  getSalespersonChart,
};
