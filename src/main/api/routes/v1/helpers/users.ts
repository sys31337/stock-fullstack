import express from 'express';
import {
  refreshUserToken, createAccount, login, logout, getCurrentUser, updateUser,
} from '../../../controllers/users';
import { auth } from '../../../middlewares/auth';
import {
  loginValidator, createAccountValidator, updateUserValidator,
} from '../../../validations/users';

const router = express.Router();

router.route('/')
  .post(createAccountValidator, createAccount)
  .put(auth, updateUserValidator, updateUser);

router.get('/current', auth, getCurrentUser);

router.post('/login', loginValidator, login);

router.post('/token', refreshUserToken);

router.post('/logout', logout);

export default router;
