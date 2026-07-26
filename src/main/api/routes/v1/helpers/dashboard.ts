import express from 'express';
import { getDashboardStats } from '@api/controllers/dashboard';
import { auth } from '@api/middlewares/auth';

const router = express.Router();

router.get('/', auth, getDashboardStats);

export default router;
