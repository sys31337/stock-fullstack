import express from 'express';
import { getAll, getByProduct, getByWarehouse, createAdjustment } from '@api/controllers/stockMovements';
import { auth } from '@api/middlewares/auth';
import { hasModuleAccess } from '@api/middlewares/permissions';

const router = express.Router();

router.get('/', auth, hasModuleAccess('inventory', 'view'), getAll);
router.get('/product/:productId', auth, getByProduct);
router.get('/warehouse/:warehouseId', auth, getByWarehouse);
router.post('/adjustment', auth, hasModuleAccess('inventory', 'create'), createAdjustment);

export default router;
