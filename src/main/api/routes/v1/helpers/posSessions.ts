import express from 'express';
import {
  getOpenSession,
  getAllSessions,
  openSession,
  closeSession,
} from '@api/controllers/posSessions';
import { auth } from '@api/middlewares/auth';
import { requirePermission } from '@api/middlewares/permissions';
import { openSessionValidator, closeSessionValidator } from '@api/validations/posSessions';

const router = express.Router();

router.get('/open', auth, requirePermission('pos.access'), getOpenSession);
router.get('/', auth, requirePermission('pos.access'), getAllSessions);
router.post('/open', auth, requirePermission('pos.access'), openSessionValidator, openSession);
router.post('/close', auth, requirePermission('pos.access'), closeSessionValidator, closeSession);

export default router;
