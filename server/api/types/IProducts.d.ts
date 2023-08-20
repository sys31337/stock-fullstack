import { ObjectId } from "mongoose";
import { ICustomer } from "./ICustomer";
import { ICategory } from "./ICategory";

export interface IProduct {
  _id?: String | ObjectId;
  id: String;
  barCode: String;
  productName: String;
  quantity: Number;
  quantityDifference?: Number;
  stack: Number;
  buyPrice: Number;
  sellPrice_1: Number;
  sellPrice_2: Number;
  sellPrice_3: Number;
  tva: Number;
  reserved?: String;
  category?: ICategory | ObjectId;
  customer?: ICustomer | ObjectId;
  notify?: boolean;
}