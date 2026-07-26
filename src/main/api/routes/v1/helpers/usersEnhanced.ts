import express from 'express';
import {
  getAllEnhanced, getByIdEnhanced, createEnhanced, updateEnhanced,
  removeEnhanced, forceLogout, switchWarehouse, getMyPermissions,
} from '@api/controllers/usersEnhanced';
import { auth } from '@api/middlewares/auth';
import { hasModuleAccess } from '@api/middlewares/permissions';

const router = express.Router();

router.get('/permissions', auth, getMyPermissions);
router.post('/switch-warehouse', auth, switchWarehouse);

router.route('/')
  .get(auth, hasModuleAccess('users', 'view'), getAllEnhanced)
  .post(auth, hasModuleAccess('users', 'create'), createEnhanced);

router.route('/:id')
  .get(auth, getByIdEnhanced)
  .put(auth, hasModuleAccess('users', 'edit'), updateEnhanced)
  .delete(auth, hasModuleAccess('users', 'delete'), removeEnhanced);

router.post('/:id/force-logout', auth, hasModuleAccess('users', 'edit'), forceLogout);

export default router;
