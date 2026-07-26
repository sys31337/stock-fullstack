import { ObjectId } from "mongoose";

export interface IWarehouse {
  name: string;
  code: string;
  address?: string;
  phone?: string;
  email?: string;
  isActive: boolean;
  manager?: ObjectId;
  rc?: string;
  nif?: string;
  ai?: string;
  nis?: string;
  metadata?: Map<string, string>;
}
