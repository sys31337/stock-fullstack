/* eslint-disable camelcase */
import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcrypt';
import jwt, { JsonWebTokenError } from 'jsonwebtoken';

import User from '../models/user';
import { parseJwt } from '../utils';

import { IUserIdRequest } from '../types/common';
import { USERLOGGEDOUT, USERNOTALLOWED } from '../constants/users';

const refreshUserToken = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.sendStatus(401);
    }
    const user = await User.findOne({ refreshToken });
    if (!user) return res.status(403).send(USERNOTALLOWED);
    // eslint-disable-next-line no-unused-vars, @typescript-eslint/no-unused-vars
    return jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET, async (err: JsonWebTokenError, _decoded: unknown) => {
      if (err) {
        return res.sendStatus(403);
      }
      const {
        _id: userId, fullname, profilePicture, email,
      } = user;
      const accessToken = jwt.sign({
        userId, fullname, profilePicture, email, 
      }, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: '1d',
      });
      const newRefreshToken = jwt.sign({
        userId, fullname, profilePicture, email, 
      }, process.env.REFRESH_TOKEN_SECRET, {
        expiresIn: '90d',
      });
      await User.findByIdAndUpdate(userId, { refreshToken: newRefreshToken });
      return res.status(200).send({ refreshToken: newRefreshToken, accessToken });
    });
  } catch (error) {
    return next(error);
  }
};

const createAccount = async (req: Request, res: Response, next: NextFunction) => {
  const {
    username, phone, email, fullname, password,
  } = req.body;

  const salt = await bcrypt.genSalt();
  const hashPassword = await bcrypt.hash(password, salt);

  const userPayload = {
    username,
    email,
    fullname,
    phone,
    password: hashPassword,
    salt,
  };

  try {
    const user = await new User(userPayload).save();
    return res.status(200).send(user);
  } catch (error) {
    return next(error);
  }
};

const getCurrentUser = async (req: IUserIdRequest, res: Response, next: NextFunction) => {
  try {
    const { userId } = req;
    const user = await User.findById(userId).select('-refreshToken -password -salt');
    return res.status(200).send(user);
  } catch (error) {
    return next(error);
  }
};

const updateUser = async (req: IUserIdRequest, res: Response, next: NextFunction) => {
  try {
    const {
      body: {
        profile_picture, fullname, password,
      },
      userId,
    } = req;

    const body = {
      profile_picture, fullname,
    };

    let payload: { [key: string]: string };

    if (password) {
      const salt = await bcrypt.genSalt();
      const hashPassword = await bcrypt.hash(password, salt);

      payload = {
        salt,
        password: hashPassword,
      };
    } else {
      payload = body;
    }

    const update = await User.findByIdAndUpdate(userId, payload);
    if (!update) return res.sendStatus(404);

    const {
      email, profilePicture, refreshToken: currentRefreshToken,
    } = update;

    const accessToken = jwt.sign({
      userId, fullname, profilePicture, email,
    }, process.env.ACCESS_TOKEN_SECRET, {
      expiresIn: '1d',
    });

    let refreshToken;
    if (currentRefreshToken) {
      const { exp } = parseJwt(currentRefreshToken);
      const curTime = Math.ceil(Date.now() / 1000);
      if (curTime > exp) {
        refreshToken = jwt.sign({
          userId, fullname, profilePicture, email,
        }, process.env.REFRESH_TOKEN_SECRET, {
          expiresIn: '90d',
        });
      } else {
        refreshToken = currentRefreshToken;
      }
    } else {
      refreshToken = jwt.sign({
        userId, fullname, profilePicture, email,
      }, process.env.REFRESH_TOKEN_SECRET, {
        expiresIn: '90d',
      });
    }

    await User.findByIdAndUpdate(userId, { refreshToken });
    return res.status(200).send({ refreshToken, accessToken });
  } catch (error) {
    return next(error);
  }
};

const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ username });
    if (!user) return res.sendStatus(404);
    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(400).send({ message: 'Wrong Password' });
    }
    const {
      _id: userId, fullname, profilePicture, refreshToken: currentRefreshToken,
    } = user;
    const accessToken = jwt.sign({
      userId, fullname, profilePicture, username,
    }, process.env.ACCESS_TOKEN_SECRET, {
      expiresIn: '1d',
    });
    /* Check if currentRefreshToken has Expired */
    let refreshToken;
    if (currentRefreshToken) {
      const { exp } = parseJwt(currentRefreshToken);
      const curTime = Math.ceil(Date.now() / 1000);
      if (curTime > exp) {
        refreshToken = jwt.sign({
          userId, fullname, profilePicture, username,
        }, process.env.REFRESH_TOKEN_SECRET, {
          expiresIn: '90d',
        });
      } else {
        refreshToken = currentRefreshToken;
      }
    } else {
      refreshToken = jwt.sign({
        userId, fullname, profilePicture, username,
      }, process.env.REFRESH_TOKEN_SECRET, {
        expiresIn: '90d',
      });
    }
    /* End Check if currentRefreshToken has Expired */
    await User.findByIdAndUpdate(userId, { refreshToken });
    return res.status(200).send({ refreshToken, accessToken });
  } catch (error) {
    return next(error);
  }
};

const logout = async (req: Request, res: Response) => {
  const { token: refreshToken } = req.headers;
  if (!refreshToken) {
    return res.status(204).send({ message: USERLOGGEDOUT });
  }
  const user = await User.find({ refreshToken });
  if (!user) return res.status(204).send({ message: USERLOGGEDOUT });
  const userId = user[0].id;
  await User.findByIdAndUpdate(userId, { refresh_token: null });
  res.clearCookie('refreshToken');
  return res.sendStatus(200);
};

export {
  refreshUserToken, createAccount, login, logout, getCurrentUser, updateUser,
};
