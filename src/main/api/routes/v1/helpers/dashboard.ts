import express from 'express';
import { getDashboardStats, getDashboardAnalytics } from '@api/controllers/dashboard';
import { auth } from '@api/middlewares/auth';

const router = express.Router();

router.get('/', auth, getDashboardStats);
router.get('/analytics', auth, getDashboardAnalytics);

export default router;
