import Bill from "../models/bills";

export const getLatestBill = async (type: string) => {
    const latestBillOfType = await Bill.findOne({ type }, {}, { sort: { 'createdAt': -1 } });
    if (!latestBillOfType) return '0';
    return `${latestBillOfType.orderId}`;
};
