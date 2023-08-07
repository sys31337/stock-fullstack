import { Request, Response, NextFunction } from 'express';
import Bill from '../models/bills';
import { IUserIdRequest } from '../types/common';

const createOne = async (req: IUserIdRequest, res: Response, next: NextFunction) => {
  try {
    const { body, userId } = req;
    const payload = {
      ...body,
      createBy: userId,
    }
    const insertProduct = await Bill.create(payload);
    return res.status(200).send(insertProduct);
  } catch (error) {
    return next(error);
  }
}

const updateOne = async (req: IUserIdRequest, res: Response, next: NextFunction) => {
  try {
    const { body, userId } = req;
    const payload = {
      ...body,
      updatedBy: userId,
    }
    const insertProduct = await Bill.create(payload);
    return res.status(200).send(insertProduct);
  } catch (error) {
    return next(error);
  }
}

export {
  createOne,
  updateOne,
}
