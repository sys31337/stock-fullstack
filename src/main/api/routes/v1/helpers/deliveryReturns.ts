import express from 'express';
import {
  getAll,
  getById,
  createOne,
  updateOne,
  deleteOne,
} from '@api/controllers/deliveryReturns';
import { auth } from '@api/middlewares/auth';
import { hasModuleAccess } from '@api/middlewares/permissions';
import {
  createDeliveryReturnValidator,
  updateDeliveryReturnValidator,
} from '@api/validations/deliveryReturns';

const router = express.Router();

const view = hasModuleAccess('reports', 'view');

router.route('/')
  .get(auth, view, getAll)
  .post(auth, hasModuleAccess('reports', 'create'), createDeliveryReturnValidator, createOne);

router.get('/:id', auth, view, getById);
router.put('/:id', auth, hasModuleAccess('reports', 'edit'), updateDeliveryReturnValidator, updateOne);
router.delete('/:id', auth, hasModuleAccess('reports', 'delete'), deleteOne);

export default router;
