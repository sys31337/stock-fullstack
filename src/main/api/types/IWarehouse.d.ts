import { ObjectId } from "mongoose";

export interface IWarehouse {
  name: string;
  code: string;
  address?: string;
  phone?: string;
  email?: string;
  isActive: boolean;
  manager?: ObjectId;
  metadata?: Map<string, string>;
}
