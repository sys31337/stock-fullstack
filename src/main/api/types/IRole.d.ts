import { ObjectId } from "mongoose";

export interface IRole {
  name: string;
  description?: string;
  permissions: string[];
  isDefault: boolean;
}
