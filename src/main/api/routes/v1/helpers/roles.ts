import express from 'express';
import {
  getAll, getById, create, update, remove, seedRoles,
} from '@api/controllers/roles';
import { auth } from '@api/middlewares/auth';
import { hasModuleAccess } from '@api/middlewares/permissions';

const router = express.Router();

router.post('/seed', auth, seedRoles);

router.route('/')
  .get(auth, hasModuleAccess('roles', 'view'), getAll)
  .post(auth, hasModuleAccess('roles', 'create'), create);

router.route('/:id')
  .get(auth, getById)
  .put(auth, hasModuleAccess('roles', 'edit'), update)
  .delete(auth, hasModuleAccess('roles', 'delete'), remove);

export default router;
