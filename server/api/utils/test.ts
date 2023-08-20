import { IProduct } from "../types/IProducts";
import compareProductsArrays from "./productsArray";

const oldProducts = [
  { id: "3677cc9", barCode: "100202020", productName: "Potatoe 1", quantity: 100, stack: 1, buyPrice: 100, sellPrice_1: 102, sellPrice_2: 104, sellPrice_3: 106, tva: 0, notify: true, _id: "64de416764400e9573e8b3e8", createdAt: "2023-08-17T15:48:55.830Z", updatedAt: "2023-08-17T15:48:55.830Z" },
  { id: "3677cc1", barCode: "100202021", productName: "Potatoe 2", quantity: 160, stack: 1, buyPrice: 100, sellPrice_1: 102, sellPrice_2: 104, sellPrice_3: 106, tva: 0, notify: true, _id: "64de416764400e9573e8b3e8", createdAt: "2023-08-17T15:48:55.830Z", updatedAt: "2023-08-17T15:48:55.830Z" },
  { id: "e9c64c4", barCode: "87d9c58", productName: "test 1", quantity: 100, stack: 1, buyPrice: 100, sellPrice_1: 101, sellPrice_2: 102, sellPrice_3: 103, tva: 2, notify: true, _id: "64de416764400e9573e8b3e9", createdAt: "2023-08-17T15:48:55.830Z", updatedAt: "2023-08-17T15:48:55.830Z" }
];

const newProducts = [
  { id: "3677cc9", barCode: "100202020", productName: "Potatoe 1", tva: 0, totalHT: 10000, totalTTC: 10000, buyPrice: 100, quantity: 50, sellPrice_1: 102, sellPrice_2: 104, sellPrice_3: 106, stack: 1 },
  { id: "3677cc1", barCode: "100202021", productName: "Potatoe 2", tva: 0, totalHT: 10000, totalTTC: 10000, buyPrice: 100, quantity: 80, sellPrice_1: 102, sellPrice_2: 104, sellPrice_3: 106, stack: 1 },
  { id: "c542c98", barCode: "C00020535", productName: "Cucumber 1", totalHT: 20000, totalTTC: 23800, tva: 19, buyPrice: 200, quantity: 100, sellPrice_1: 220, sellPrice_2: 220, sellPrice_3: 220, stack: 1 }
];

const compare = compareProductsArrays(oldProducts, newProducts as unknown as IProduct[]);
console.log(compare.intersection);