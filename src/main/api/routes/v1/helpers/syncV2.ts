import express from 'express';
import { pushV2, pullV2, diagnosticsV2, snapshotV2 } from '@api/controllers/syncV2';

const router = express.Router();

router.post('/push', pushV2);
router.get('/pull/:collection', pullV2);
router.get('/snapshot/:collection', snapshotV2);
router.get('/diagnostics', diagnosticsV2);

export default router;
