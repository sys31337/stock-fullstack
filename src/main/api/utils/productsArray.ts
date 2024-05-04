import { IProduct } from '../types/IProducts';

interface IDiffResult {
  intersection: IProduct[];
  added: IProduct[];
  deleted: IProduct[];
}

const compareProductsArrays = (oldArray: IProduct[], newArray: IProduct[]): IDiffResult => {
  const intersection: IProduct[] = [];
  const added: IProduct[] = [];
  const deleted: IProduct[] = [];

  // Create a map of id values for faster lookup
  const oldIdMap = new Map<String, IProduct>();
  oldArray.forEach((item: IProduct) => oldIdMap.set(item.id, item));

  newArray.forEach((item: IProduct) => {
    const oldItem: IProduct | undefined = oldIdMap.get(item.id);

    if (oldItem) {
      const quantityDifference = Number(item.quantity) - Number(oldItem.quantity);
      const intersectionItem = { ...item, oldQuantity: oldItem.quantity, quantityDifference };
      intersection.push(intersectionItem);
    } else {
      // Check if the item is not already in the added array
      if (!added.some(addedItem =>
        addedItem.id === item.id &&
        addedItem.productName === item.productName &&
        addedItem.barCode === item.barCode
      )) {
        added.push(item); // Item is newly added
      }
    }
  });

  // Find deleted items by comparing ids, productName, and barCode
  deleted.push(
    ...oldArray.filter(item =>
      !newArray.some(newItem =>
        newItem.id === item.id &&
        newItem.productName === item.productName &&
        newItem.barCode === item.barCode
      )
    )
  );

  return { intersection, added, deleted };
};

export default compareProductsArrays;