import Any from "@shared/types/any";

export const sortByOrderId = ( a: Any, b: Any ) => {
  if ( a.orderId < b.orderId ){
    return -1;
  }
  if ( a.orderId > b.orderId ){
    return 1;
  }
  return 0;
}
