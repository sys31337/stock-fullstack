import express from 'express';
import {
  getAll,
  getSummary,
  createOne,
  updateOne,
  deleteOne,
} from '@api/controllers/charges';
import { auth } from '@api/middlewares/auth';
import { requirePermission } from '@api/middlewares/permissions';
import { createChargeValidator, updateChargeValidator } from '@api/validations/charges';

const router = express.Router();

router.route('/')
  .get(auth, requirePermission('charges.view'), getAll)
  .post(auth, requirePermission('charges.create'), createChargeValidator, createOne);

router.get('/summary', auth, requirePermission('charges.view'), getSummary);

router.route('/:id')
  .put(auth, requirePermission('charges.edit'), updateChargeValidator, updateOne)
  .delete(auth, requirePermission('charges.delete'), deleteOne);

export default router;
