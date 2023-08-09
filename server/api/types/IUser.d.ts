import { ObjectId } from "mongoose";

export interface IUser {
  username: string,
  email: string,
  fullname?: string,
  password: string,
  salt: string,
  profilePicture: string,
  isMainAccount:boolean,
  type: string,
  permissions: string[],
  refreshToken: string,
}