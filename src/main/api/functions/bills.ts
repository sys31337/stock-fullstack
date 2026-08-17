import Bill from '@api/models/bills';

export const getLatestBill = async (type: string) => {
    const latestBillOfType = await Bill.findOne(
      { type, orderId: { $regex: /^\d+$/ } },
      {},
      { sort: { 'createdAt': -1 } }
    );
    if (!latestBillOfType) return '0';
    return `${latestBillOfType.orderId}`;
};

export const getLatestPosBillNumber = async (): Promise<number> => {
  const latest = await Bill.findOne(
    { type: 'POS', orderId: { $regex: /^POS-\d+$/ } },
    {},
    { sort: { createdAt: -1 } },
  );
  if (!latest) return 0;
  const match = String(latest.orderId).match(/POS-(\d+)/);
  return match ? Number(match[1]) : 0;
};
