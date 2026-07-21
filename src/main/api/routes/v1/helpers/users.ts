import express from 'express';
import {
  refreshUserToken, createAccount, login, logout, getCurrentUser, updateUser, getAllUsers,
} from '@api/controllers/users';
import { auth } from '@api/middlewares/auth';
import {
  loginValidator, createAccountValidator, updateUserValidator,
} from '@api/validations/users';

const router = express.Router();

router.route('/')
  .get(getAllUsers)
  .post(createAccountValidator, createAccount)
  .put(auth, updateUserValidator, updateUser);

router.get('/current', auth, getCurrentUser);

router.post('/login', loginValidator, login);

router.post('/token', refreshUserToken);

router.post('/logout', logout);

export default router;
