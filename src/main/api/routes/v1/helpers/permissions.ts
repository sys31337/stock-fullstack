import express from 'express';
import { auth } from '@api/middlewares/auth';
import { PERMISSION_GROUPS, ALL_PERMISSIONS } from '@api/constants/permissions';

const router = express.Router();

router.get('/', auth, (_req, res) => {
  res.status(200).send({
    groups: PERMISSION_GROUPS,
    permissions: ALL_PERMISSIONS,
  });
});

export default router;
