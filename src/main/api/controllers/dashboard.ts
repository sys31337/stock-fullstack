import { Response, NextFunction } from 'express';
import Bill from '@api/models/bills';
import Product from '@api/models/products';
import Customer from '@api/models/customers';
import Warehouse from '@api/models/warehouse';
import User from '@api/models/user';
import StockMovement from '@api/models/stockMovement';
import Settings from '@api/models/settings';
import { IUserIdRequest } from '@api/types/common';

const SALES_TYPES = ['SALE', 'DELIVERY'];

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

const getSettingsFlags = async () => {
  const settings = await Settings.findOne();
  return {
    statisticsEnabled: settings?.dashboardStatsEnabled ?? true,
    statisticsBlurred: settings?.dashboardStatsBlurred ?? false,
  };
};

const sumAggregate = (result: any[]): number => Math.round(result[0]?.total || 0);

const computeKpis = async (warehouseFilter: any, today: Date) => {
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const [
    totalProducts,
    totalCustomers,
    totalSuppliers,
    todaySales,
    todayPurchases,
    todaySalesAmount,
    todayPurchasesAmount,
    yesterdaySalesAmount,
    totalSalesAmount,
    totalPurchasesAmount,
    pendingOrders,
    lowStockProducts,
    totalWarehouses,
    totalUsers,
  ] = await Promise.all([
    Product.countDocuments({}),
    Customer.countDocuments({ type: 'Client' }),
    Customer.countDocuments({ type: 'Supplier' }),
    Bill.countDocuments({ ...warehouseFilter, type: { $in: SALES_TYPES }, createdAt: { $gte: today } }),
    Bill.countDocuments({ ...warehouseFilter, type: 'BUY', createdAt: { $gte: today } }),
    Bill.aggregate([
      { $match: { ...warehouseFilter, type: { $in: SALES_TYPES }, createdAt: { $gte: today } } },
      { $group: { _id: null, total: { $sum: '$orderTotalTTC' } } },
    ]),
    Bill.aggregate([
      { $match: { ...warehouseFilter, type: 'BUY', createdAt: { $gte: today } } },
      { $group: { _id: null, total: { $sum: '$orderTotalTTC' } } },
    ]),
    Bill.aggregate([
      { $match: { ...warehouseFilter, type: { $in: SALES_TYPES }, createdAt: { $gte: yesterday, $lt: today } } },
      { $group: { _id: null, total: { $sum: '$orderTotalTTC' } } },
    ]),
    Bill.aggregate([
      { $match: { ...warehouseFilter, type: { $in: SALES_TYPES }, status: { $ne: 'cancelled' } } },
      { $group: { _id: null, total: { $sum: '$orderTotalTTC' } } },
    ]),
    Bill.aggregate([
      { $match: { ...warehouseFilter, type: 'BUY', status: { $ne: 'cancelled' } } },
      { $group: { _id: null, total: { $sum: '$orderTotalTTC' } } },
    ]),
    Bill.countDocuments({ ...warehouseFilter, type: 'ORDER', status: 'pending' }),
    Product.countDocuments({ quantity: { $lte: 5 }, notify: true }),
    Warehouse.countDocuments({ isActive: true }),
    User.countDocuments({ status: 'active' }),
  ]);

  return {
    totalProducts,
    totalCustomers,
    totalSuppliers,
    todaySales,
    todayPurchases,
    todaySalesAmount: sumAggregate(todaySalesAmount),
    todayPurchasesAmount: sumAggregate(todayPurchasesAmount),
    yesterdaySalesAmount: sumAggregate(yesterdaySalesAmount),
    totalSalesAmount: sumAggregate(totalSalesAmount),
    totalPurchasesAmount: sumAggregate(totalPurchasesAmount),
    pendingOrders,
    lowStockProducts,
    totalWarehouses,
    totalUsers,
  };
};

const getRecentMovements = (warehouse: any) =>
  StockMovement.find(warehouse ? { warehouse } : {})
    .sort('-createdAt')
    .limit(10)
    .populate('product', 'productName barCode')
    .populate('warehouse', 'name code')
    .lean();

const getDashboardStats = async (req: IUserIdRequest, res: Response, next: NextFunction) => {
  try {
    const warehouseFilter = getWarehouseFilter(req);
    const { statisticsEnabled, statisticsBlurred } = await getSettingsFlags();

    if (!statisticsEnabled) {
      return res.status(200).send({ statisticsEnabled, statisticsBlurred });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [kpis, recentMovements] = await Promise.all([
      computeKpis(warehouseFilter, today),
      getRecentMovements(req.query.warehouse),
    ]);

    return res.status(200).send({ statisticsEnabled, statisticsBlurred, ...kpis, recentMovements });
  } catch (error) {
    return next(error);
  }
};

const getDashboardAnalytics = async (req: IUserIdRequest, res: Response, next: NextFunction) => {
  try {
    const warehouseFilter = getWarehouseFilter(req);
    const { statisticsEnabled, statisticsBlurred } = await getSettingsFlags();

    if (!statisticsEnabled) {
      return res.status(200).send({ statisticsEnabled, statisticsBlurred });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const days = Math.min(Math.max(parseInt(req.query.days as string, 10) || 30, 1), 365);
    const startDate = new Date();
    startDate.setUTCHours(0, 0, 0, 0);
    startDate.setUTCDate(startDate.getUTCDate() - (days - 1));

    const [kpis, revenueTrendAgg, salesByCategoryAgg, topProductsAgg, recentMovements] = await Promise.all([
      computeKpis(warehouseFilter, today),
      Bill.aggregate([
        { $match: { ...warehouseFilter, type: { $in: SALES_TYPES }, status: { $ne: 'cancelled' }, createdAt: { $gte: startDate } } },
        { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, total: { $sum: '$orderTotalTTC' } } },
        { $sort: { _id: 1 } },
      ]),
      Bill.aggregate([
        { $match: { ...warehouseFilter, type: { $in: SALES_TYPES }, status: { $ne: 'cancelled' }, createdAt: { $gte: startDate } } },
        { $lookup: { from: 'categories', localField: 'category', foreignField: '_id', as: 'cat' } },
        { $unwind: { path: '$cat', preserveNullAndEmptyArrays: true } },
        { $group: { _id: '$cat.name', total: { $sum: '$orderTotalTTC' } } },
        { $sort: { total: -1 } },
      ]),
      Bill.aggregate([
        { $match: { ...warehouseFilter, type: { $in: SALES_TYPES }, status: { $ne: 'cancelled' }, createdAt: { $gte: startDate } } },
        { $unwind: '$products' },
        {
          $group: {
            _id: '$products.productName',
            quantity: { $sum: '$products.quantity' },
            total: { $sum: { $multiply: ['$products.quantity', '$products.sellPrice_1'] } },
          },
        },
        { $sort: { quantity: -1 } },
        { $limit: 5 },
      ]),
      getRecentMovements(req.query.warehouse),
    ]);

    const trendMap = new Map(revenueTrendAgg.map((r: any) => [r._id, r.total]));
    const revenueTrend: { date: string; total: number }[] = [];
    for (let i = 0; i < days; i += 1) {
      const d = new Date(startDate);
      d.setUTCDate(startDate.getUTCDate() + i);
      const key = d.toISOString().slice(0, 10);
      revenueTrend.push({ date: key, total: Math.round(trendMap.get(key) || 0) });
    }

    const salesByCategory = salesByCategoryAgg
      .map((r: any) => ({ name: r._id || 'Uncategorized', value: Math.round(r.total) }))
      .filter((r: any) => r.value > 0);

    const topProducts = topProductsAgg.map((r: any) => ({
      name: r._id || 'Unknown',
      quantity: r.quantity,
      total: Math.round(r.total),
    }));

    return res.status(200).send({
      statisticsEnabled,
      statisticsBlurred,
      ...kpis,
      revenueTrend,
      salesByCategory,
      topProducts,
      recentMovements,
    });
  } catch (error) {
    return next(error);
  }
};

export { getDashboardStats, getDashboardAnalytics };
