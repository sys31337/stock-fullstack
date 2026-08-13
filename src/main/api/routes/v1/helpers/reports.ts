import express from 'express';
import {
  getOverview,
  getLedger,
  getLedgerDetail,
  getLedgerStatement,
  getCashStatement,
  getProductStats,
  getSalespeople,
  getSalespersonChart,
} from '@api/controllers/reports';
import { auth } from '@api/middlewares/auth';
import { hasModuleAccess } from '@api/middlewares/permissions';

const router = express.Router();

const view = hasModuleAccess('reports', 'view');

router.get('/overview', auth, view, getOverview);
router.get('/ledger', auth, view, getLedger);
router.get('/ledger/detail/:id', auth, view, getLedgerDetail);
router.get('/ledger/statement/:id', auth, view, getLedgerStatement);
router.get('/cash-statement', auth, view, getCashStatement);
router.get('/products/:id', auth, view, getProductStats);
router.get('/salespeople', auth, view, getSalespeople);
router.get('/salespeople/:id', auth, view, getSalespersonChart);

export default router;
