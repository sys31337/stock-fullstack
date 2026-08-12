import Customer from '@api/models/customers';
import Transaction from '@api/models/transactions';

export const DEFAULT_CUSTOMER_ID = '0a0aaa0a0aa00000aaaaaa0a';

type TransactionType = 'FUND' | 'SALE' | 'BUY';

interface CreditAdjustment {
  customerId?: string;
  addedAmount: number;
  type: TransactionType;
  billId?: string;
  description?: string;
}

/**
 * Apply a signed credit movement to a customer and record the ledger entry.
 * Missing / default ("Unspecified") customers are skipped so bill flows that
 * reference them never corrupt the seeded record.
 */
export async function adjustCustomerCredit({
  customerId,
  addedAmount,
  type,
  billId,
  description,
}: CreditAdjustment): Promise<void> {
  if (!customerId || customerId === DEFAULT_CUSTOMER_ID) return;

  const customer = await Customer.findById(customerId);
  if (!customer) return;

  const oldFunds = Number(customer.credit || 0);
  const newFunds = oldFunds + Number(addedAmount || 0);

  customer.credit = newFunds;
  await customer.save();

  await Transaction.create({
    customer: customer._id,
    type,
    addedAmount: Number(addedAmount),
    oldFunds,
    newFunds,
    bill: billId || null,
    description: description || undefined,
  });
}
