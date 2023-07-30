/* eslint-disable no-unused-vars, no-unused-expressions, @typescript-eslint/no-unused-vars */
import { Request, Response, NextFunction } from 'express';
import type { IError } from '../types/utils';

const notFound = (req: Request, res: Response, next: NextFunction): void => {
  const error = new Error(`NOT FOUND - ${req.originalUrl}`);
  req.originalUrl === '/' ? res.status(404) : res.status(401);
  next(error);
};

const errorHandler = (error: IError, req: Request, res: Response, next: NextFunction): void => {
  const status = res.statusCode === 200 ? 400 : res.statusCode;
  res.status(status);
  let message;
  if (error.error) {
    message = error.error.isJoi ? error.error.toString() : `${error.result.error}. Scrapping Failed`;
  } else {
    message = error.message;
  }
  res.json({ message, ...(process.env.NODE_ENV === 'development' && { stack: error.stack }) });
};

export { notFound, errorHandler };
