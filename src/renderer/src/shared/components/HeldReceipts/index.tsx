import React, { useState } from 'react';
import { AiOutlineFileText, AiOutlineClose } from 'react-icons/ai';
import { useReceiptHold, HeldReceipt } from '@web/shared/contexts/ReceiptHoldContext';
import ReceiptModal from '@web/modules/Receipt/ReceiptModal';
import OrderModal from '@web/modules/Order/OrderModal';
import DeliveryModal from '@web/modules/Delivery/DeliveryModal';
import { t } from 'i18next';
import { Button } from '@web/shared/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@web/shared/components/ui/tooltip';

const HeldReceipts: React.FC = () => {
  const { heldReceipts, removeHeldReceipt } = useReceiptHold();
  const [selectedReceipt, setSelectedReceipt] = useState<HeldReceipt | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  const handleOpenReceipt = (receipt: HeldReceipt) => {
    setSelectedReceipt(receipt);
    setIsOpen(true);
  };

  const handleClose = () => {
    setSelectedReceipt(null);
    setIsOpen(false);
  };

  if (heldReceipts.length === 0) {
    return null;
  }

  const renderModal = () => {
    if (!selectedReceipt) return null;
    const commonProps = {
      isOpen,
      onClose: handleClose,
      initialHeldData: selectedReceipt.data,
      heldReceiptId: selectedReceipt.id,
    };
    switch (selectedReceipt.type) {
      case 'ORDER':
        return <OrderModal {...commonProps} />;
      case 'DELIVERY':
        return <DeliveryModal {...commonProps} />;
      default:
        return <ReceiptModal {...commonProps} />;
    }
  };

  return (
    <>
      <div className="fixed bottom-5 right-5 z-[50]">
        <div className="flex flex-col items-end gap-2">
          {heldReceipts.map((receipt) => (
            <div
              key={receipt.id}
              className="flex bg-white shadow-lg rounded-md p-2 items-center gap-2 cursor-pointer transition-all hover:scale-105"
            >
              <div onClick={() => handleOpenReceipt(receipt)} className="flex items-center gap-2">
                <AiOutlineFileText className="text-orange-500" size={20} />
                <div className="flex flex-col items-start">
                  <span className="text-sm font-bold">
                    {receipt.label}
                  </span>
                  <span className="text-xs text-gray-500">
                    {new Date(receipt.timestamp).toLocaleTimeString()}
                  </span>
                </div>
              </div>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                       variant="ghost"
                       size="icon"
                       className="h-6 w-6 text-red-500 hover:text-red-600 hover:bg-red-50"
                       onClick={(e) => {
                         e.stopPropagation();
                         removeHeldReceipt(receipt.id);
                       }}
                     >
                       <AiOutlineClose />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>{t('close')}</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          ))}
        </div>
      </div>
      {renderModal()}
    </>
  );
};

export default HeldReceipts;