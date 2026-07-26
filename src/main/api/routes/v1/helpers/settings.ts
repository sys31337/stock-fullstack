import express from 'express';
import { getSettings, updateSettings } from '@api/controllers/settings';
import { auth } from '@api/middlewares/auth';
import { requirePermission } from '@api/middlewares/permissions';
import { updateSettingsValidator } from '@api/validations/settings';

const router = express.Router();

router.route('/')
  .get(auth, requirePermission('settings.view'), getSettings)
  .put(auth, requirePermission('settings.edit'), updateSettingsValidator, updateSettings);

export default router;
