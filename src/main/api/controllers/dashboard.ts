import { Response, NextFunction } from 'express';
import Bill from '@api/models/bills';
import Product from '@api/models/products';
import Customer from '@api/models/customers';
import Warehouse from '@api/models/warehouse';
import User from '@api/models/user';
import StockMovement from '@api/models/stockMovement';
import { IUserIdRequest } from '@api/types/common';

const getDashboardStats = async (req: IUserIdRequest, res: Response, next: NextFunction) => {
  try {
    const { warehouse } = req.query;
    const warehouseFilter: any = {};
    if (warehouse) {
      warehouseFilter.warehouse = warehouse;
    } else if (!req.isMainAccount && req.assignedWarehouses?.length) {
      warehouseFilter.warehouse = { $in: req.assignedWarehouses };
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [
      totalProducts,
      totalCustomers,
      totalSuppliers,
      todaySales,
      todayPurchases,
      pendingOrders,
      lowStockProducts,
      totalWarehouses,
      totalUsers,
      recentMovements,
    ] = await Promise.all([
      Product.countDocuments({}),
      Customer.countDocuments({ type: 'Client' }),
      Customer.countDocuments({ type: 'Supplier' }),
      Bill.countDocuments({ ...warehouseFilter, type: 'SALE', createdAt: { $gte: today } }),
      Bill.countDocuments({ ...warehouseFilter, type: 'BUY', createdAt: { $gte: today } }),
      Bill.countDocuments({ ...warehouseFilter, type: 'ORDER', status: 'pending' }),
      Product.countDocuments({ quantity: { $lte: 5 }, notify: true }),
      Warehouse.countDocuments({ isActive: true }),
      User.countDocuments({ status: 'active' }),
      StockMovement.find(warehouse ? { warehouse } : {})
        .sort('-createdAt')
        .limit(10)
        .populate('product', 'productName barCode')
        .populate('warehouse', 'name code')
        .lean(),
    ]);

    return res.status(200).send({
      totalProducts,
      totalCustomers,
      totalSuppliers,
      todaySales,
      todayPurchases,
      pendingOrders,
      lowStockProducts,
      totalWarehouses,
      totalUsers,
      recentMovements,
    });
  } catch (error) {
    return next(error);
  }
};

export { getDashboardStats };
