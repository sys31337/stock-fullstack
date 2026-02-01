import React, { useState } from 'react'
import { t } from 'i18next'
import { AiFillRightCircle } from 'react-icons/ai';
import ReceiptModal from '@web/modules/Receipt/ReceiptModal';
import { cn } from '@web/shared/utils/cn';

interface ReceiptProps {
  isTopBar?: boolean;
}

const Receipt: React.FC<ReceiptProps> = ({ isTopBar }) => {
  const [isOpen, setIsOpen] = useState(false);
  const onOpen = () => setIsOpen(true);
  const onClose = () => setIsOpen(false);

  return (
    <div>
      {isTopBar ? (
        <div
          className="cursor-pointer group block p-2 px-3 rounded-lg hover:bg-blue-50 dark:hover:bg-gray-900"
          onClick={onOpen}
          role="group"
        >
          <div className="flex items-center">
            <div>
              <p className="font-medium transition-all duration-300 group-hover:text-blue-500">
                {t('newReceiptBill')}
              </p>
              <p className="text-sm">{t('newReceiptBillLabel')}</p>
            </div>
            <div className="flex-1 flex justify-end items-center transition-all duration-300 transform -translate-x-2 opacity-0 group-hover:opacity-100 group-hover:translate-x-0">
              <AiFillRightCircle className="text-blue-400 w-5 h-5" />
            </div>
          </div>
        </div>
      ) : (
        <div
          onClick={onOpen}
          className="cursor-pointer w-full border border-gray-200 rounded-3xl relative bg-blue-400 mx-5 p-5 hover:shadow-lg transition-shadow"
        >
          <div className="flex items-center justify-center text-sm absolute bg-gray-800 text-white -top-2 -right-2 p-5 rounded-2xl h-8 w-8">
            F1
          </div>
          <div className="flex items-center gap-4">
            <div className="min-w-[5rem] min-h-[5rem] flex items-center justify-center text-white rounded-2xl bg-white">
              <img src="/assets/icons/buy.gif" width={64} alt="Buy" />
            </div>
            <h2 className="text-xl font-bold text-white">{t('newReceiptBill')}</h2>
          </div>
        </div>
      )}
      
      <ReceiptModal isOpen={isOpen} onClose={onClose} />
    </div>
  )
}

export default Receipt
