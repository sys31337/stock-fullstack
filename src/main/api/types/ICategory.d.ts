import { IProduct } from './IProducts';

export interface ICategory {
    name: String,
    description?: String,
    products: IProduct[],
}