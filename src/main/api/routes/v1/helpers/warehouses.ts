import express from 'express';
import {
  getAll, getById, create, update, remove,
} from '@api/controllers/warehouses';
import { auth } from '@api/middlewares/auth';
import { hasModuleAccess } from '@api/middlewares/permissions';

const router = express.Router();

router.route('/')
  .get(auth, getAll)
  .post(auth, hasModuleAccess('warehouses', 'create'), create);

router.route('/:id')
  .get(auth, getById)
  .put(auth, hasModuleAccess('warehouses', 'edit'), update)
  .delete(auth, hasModuleAccess('warehouses', 'delete'), remove);

export default router;
