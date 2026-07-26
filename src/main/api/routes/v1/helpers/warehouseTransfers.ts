import express from 'express';
import {
  getAll, getById, create, approve, cancel,
} from '@api/controllers/warehouseTransfers';
import { auth } from '@api/middlewares/auth';
import { hasModuleAccess } from '@api/middlewares/permissions';

const router = express.Router();

router.route('/')
  .get(auth, hasModuleAccess('transfers', 'view'), getAll)
  .post(auth, hasModuleAccess('transfers', 'create'), create);

router.get('/:id', auth, getById);
router.put('/:id/approve', auth, hasModuleAccess('transfers', 'approve'), approve);
router.put('/:id/cancel', auth, hasModuleAccess('transfers', 'cancel'), cancel);

export default router;
