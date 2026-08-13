import express from 'express';
import { pullCollection, pushOperation, getSyncState } from '@api/controllers/sync';

const router = express.Router();

router.get('/state', getSyncState);
router.get('/pull/:collection', pullCollection);
router.post('/push', pushOperation);

export default router;
