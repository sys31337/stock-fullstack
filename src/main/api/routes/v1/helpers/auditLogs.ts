import express from 'express';
import { getAll, getResources, getActions } from '@api/controllers/auditLogs';
import { auth } from '@api/middlewares/auth';
import { hasModuleAccess } from '@api/middlewares/permissions';

const router = express.Router();

router.get('/', auth, hasModuleAccess('users', 'view'), getAll);
router.get('/resources', auth, getResources);
router.get('/actions', auth, getActions);

export default router;
