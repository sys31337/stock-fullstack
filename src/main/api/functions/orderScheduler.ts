import Bill from '@api/models/bills';
import { orderReleaseProducts } from '@api/functions/products';

let intervalId: NodeJS.Timeout | null = null;

export const startOrderScheduler = () => {
  const checkExpiredOrders = async () => {
    try {
      const now = new Date();
      const expiredOrders = await Bill.find({
        type: 'ORDER',
        status: 'pending',
        reservedUntil: { $lte: now },
      });

      for (const order of expiredOrders) {
        try {
          await orderReleaseProducts(order.products);
          order.status = 'cancelled';
          await order.save();
          console.log(`Order #${order.orderId} auto-cancelled (reservation expired)`);
        } catch (err) {
          console.error(`Failed to auto-cancel order #${order.orderId}:`, err);
        }
      }
    } catch (err) {
      console.error('Order scheduler error:', err);
    }
  };

  checkExpiredOrders();
  intervalId = setInterval(checkExpiredOrders, 5 * 60 * 1000);
};

export const stopOrderScheduler = () => {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
  }
};