import React, { createContext, useContext, useState, ReactNode } from 'react';
import { randomId } from '@web/shared/functions/words';

export interface HeldReceipt {
  id: string;
  timestamp: number;
  label: string; // e.g., "Customer Name - Date" or just "Receipt #1"
  data: {
    values: any;
    productsValues: any[];
    state: any;
  };
}

interface ReceiptHoldContextType {
  heldReceipts: HeldReceipt[];
  holdReceipt: (data: HeldReceipt['data'], label?: string, id?: string) => void;
  removeHeldReceipt: (id: string) => void;
  restoreReceipt: (id: string) => HeldReceipt | undefined;
}

const ReceiptHoldContext = createContext<ReceiptHoldContextType | undefined>(undefined);

export const ReceiptHoldProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [heldReceipts, setHeldReceipts] = useState<HeldReceipt[]>([]);

  const holdReceipt = (data: HeldReceipt['data'], label?: string, id?: string) => {
    setHeldReceipts((prev) => {
      const existingIndex = id ? prev.findIndex((r) => r.id === id) : -1;

      const newHeldReceipt: HeldReceipt = {
        id: id || randomId(),
        timestamp: Date.now(),
        label: label || `Receipt ${prev.length + 1}`,
        data,
      };

      if (existingIndex >= 0) {
        // Update existing
        const updated = [...prev];
        updated[existingIndex] = newHeldReceipt;
        return updated;
      } else {
        // Add new
        return [...prev, newHeldReceipt];
      }
    });
  };

  const removeHeldReceipt = (id: string) => {
    setHeldReceipts((prev) => prev.filter((r) => r.id !== id));
  };

  const restoreReceipt = (id: string) => {
    const receipt = heldReceipts.find((r) => r.id === id);
    if (receipt) {
      removeHeldReceipt(id);
    }
    return receipt;
  };

  return (
    <ReceiptHoldContext.Provider value={{ heldReceipts, holdReceipt, removeHeldReceipt, restoreReceipt }}>
      {children}
    </ReceiptHoldContext.Provider>
  );
};

export const useReceiptHold = () => {
  const context = useContext(ReceiptHoldContext);
  if (!context) {
    throw new Error('useReceiptHold must be used within a ReceiptHoldProvider');
  }
  return context;
};
