import express from 'express';

import usersRouter from './helpers/users';
import usersEnhancedRouter from './helpers/usersEnhanced';
import customersRouter from './helpers/customers';
import categoriesRouter from './helpers/categories';
import productsRouter from './helpers/products';
import billsRouter from './helpers/bills';
import warehousesRouter from './helpers/warehouses';
import rolesRouter from './helpers/roles';
import auditLogsRouter from './helpers/auditLogs';
import stockMovementsRouter from './helpers/stockMovements';
import warehouseTransfersRouter from './helpers/warehouseTransfers';
import permissionsRouter from './helpers/permissions';
import dashboardRouter from './helpers/dashboard';
import settingsRouter from './helpers/settings';

const router = express.Router();

router.use('/users', usersRouter);
router.use('/users-enhanced', usersEnhancedRouter);
router.use('/customers', customersRouter);
router.use('/categories', categoriesRouter);
router.use('/products', productsRouter);
router.use('/bills', billsRouter);
router.use('/warehouses', warehousesRouter);
router.use('/roles', rolesRouter);
router.use('/audit-logs', auditLogsRouter);
router.use('/stock-movements', stockMovementsRouter);
router.use('/warehouse-transfers', warehouseTransfersRouter);
router.use('/permissions', permissionsRouter);
router.use('/dashboard', dashboardRouter);
router.use('/settings', settingsRouter);

export default router;
