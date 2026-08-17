import express from 'express';
import {
  getOpenSession,
  getAllSessions,
  openSession,
  closeSession,
} from '@api/controllers/posSessions';
import { auth } from '@api/middlewares/auth';
import { requirePOSAccess } from '@api/middlewares/permissions';
import { openSessionValidator, closeSessionValidator } from '@api/validations/posSessions';

const router = express.Router();
const posAccess = requirePOSAccess();

router.get('/open', auth, posAccess, getOpenSession);
router.get('/', auth, posAccess, getAllSessions);
router.post('/open', auth, posAccess, openSessionValidator, openSession);
router.post('/close', auth, posAccess, closeSessionValidator, closeSession);

export default router;
