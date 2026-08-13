import { Response, NextFunction } from 'express';
import Bill from '@api/models/bills';
import Product from '@api/models/products';
import Customer from '@api/models/customers';
import Warehouse from '@api/models/warehouse';
import User from '@api/models/user';
import StockMovement from '@api/models/stockMovement';
import Settings from '@api/models/settings';
import DeliveryReturn from '@api/models/deliveryReturn';
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
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
  const yearStart = new Date(today.getFullYear(), 0, 1);

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
    todayCashCollected,
    profitThisMonth,
    profitThisYear,
    employeeDebt,
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
    Bill.aggregate([
      { $match: { ...warehouseFilter, type: { $in: SALES_TYPES }, createdAt: { $gte: today } } },
      { $group: { _id: null, total: { $sum: '$orderPaid' } } },
    ]),
    Bill.aggregate([
      { $match: { ...warehouseFilter, type: { $in: SALES_TYPES }, status: { $ne: 'cancelled' }, createdAt: { $gte: monthStart } } },
      { $unwind: '$products' },
      {
        $group: {
          _id: null,
          revenue: { $sum: '$orderTotalTTC' },
          cost: { $sum: { $multiply: ['$products.quantity', '$products.buyPrice'] } },
        },
      },
    ]),
    Bill.aggregate([
      { $match: { ...warehouseFilter, type: { $in: SALES_TYPES }, status: { $ne: 'cancelled' }, createdAt: { $gte: yearStart } } },
      { $unwind: '$products' },
      {
        $group: {
          _id: null,
          revenue: { $sum: '$orderTotalTTC' },
          cost: { $sum: { $multiply: ['$products.quantity', '$products.buyPrice'] } },
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
  ]);

  const monthProfit = profitThisMonth[0] || { revenue: 0, cost: 0 };
  const yearProfit = profitThisYear[0] || { revenue: 0, cost: 0 };

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
    todayCashCollected: sumAggregate(todayCashCollected),
    profitThisMonth: Math.round(monthProfit.revenue - monthProfit.cost),
    profitThisYear: Math.round(yearProfit.revenue - yearProfit.cost),
    employeeDebt: Math.round(employeeDebt[0]?.outstanding || 0),
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

    const [kpis, revenueTrendAgg, productSalesAgg, recentMovements] = await Promise.all([
      computeKpis(warehouseFilter, today),
      Bill.aggregate([
        { $match: { ...warehouseFilter, type: { $in: SALES_TYPES }, status: { $ne: 'cancelled' }, createdAt: { $gte: startDate } } },
        { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, total: { $sum: '$orderTotalTTC' } } },
        { $sort: { _id: 1 } },
      ]),
      Bill.aggregate([
        { $match: { ...warehouseFilter, type: { $in: SALES_TYPES }, status: { $ne: 'cancelled' }, createdAt: { $gte: startDate } } },
        { $unwind: '$products' },
        {
          $group: {
            _id: { id: '$products.id', name: '$products.productName' },
            quantity: { $sum: '$products.quantity' },
            revenue: { $sum: { $multiply: ['$products.quantity', '$products.sellPrice_1'] } },
            cost: { $sum: { $multiply: ['$products.quantity', '$products.buyPrice'] } },
          },
        },
        { $sort: { revenue: -1 } },
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

    const productNames = productSalesAgg.map((r: any) => r._id?.name).filter(Boolean);
    const stockRows = await Product.find({ productName: { $in: productNames } }).select('productName quantity notify').lean();
    const stockMap = new Map(stockRows.map((p: any) => [p.productName, p]));

    const salesByProduct = productSalesAgg
      .filter((r: any) => r.revenue > 0)
      .slice(0, 8)
      .map((r: any) => ({ name: r._id?.name || 'Unknown', value: Math.round(r.revenue) }));

    const topProducts = productSalesAgg.slice(0, 5).map((r: any) => {
      const stockRow = stockMap.get(r._id?.name);
      const stock = stockRow?.quantity ?? 0;
      return {
        name: r._id?.name || 'Unknown',
        quantity: r.quantity,
        total: Math.round(r.revenue),
        stock,
        lowStock: stock <= 5 && !!stockRow?.notify,
      };
    });

    return res.status(200).send({
      statisticsEnabled,
      statisticsBlurred,
      ...kpis,
      revenueTrend,
      salesByProduct,
      topProducts,
      recentMovements,
    });
  } catch (error) {
    return next(error);
  }
};

export { getDashboardStats, getDashboardAnalytics };
