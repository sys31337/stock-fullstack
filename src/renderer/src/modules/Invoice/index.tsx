import React, { useState } from 'react'
import { t } from 'i18next'
import { AiFillRightCircle } from 'react-icons/ai';
import InvoiceModal from '@web/modules/Invoice/InvoiceModal';
import { assetsBase } from '@web/config';
import { cn } from '@web/shared/utils/cn';

interface InvoiceProps {
  isTopBar?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

const Invoice: React.FC<InvoiceProps> = ({ isTopBar, open: controlledOpen, onOpenChange }) => {
  const [internalOpen, setInternalOpen] = useState(false);
  const isOpen = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const onOpen = () => onOpenChange ? onOpenChange(true) : setInternalOpen(true);
  const onClose = () => onOpenChange ? onOpenChange(false) : setInternalOpen(false);

  const isControlled = controlledOpen !== undefined;

  return (
    <div>
      {!isControlled && (
        <>
          {isTopBar ? (
            <div
              className="cursor-pointer group block p-2 px-3 rounded-md hover:bg-accent transition-colors"
              onClick={onOpen}
              role="group"
            >
              <div className="flex items-center">
                <div>
                  <p className="text-sm font-medium transition-colors group-hover:text-primary">
                    {t('newInvoice')}
                  </p>
                  <p className="text-xs text-muted-foreground">{t('newInvoiceLabel')}</p>
                </div>
                <div className="flex-1 flex justify-end items-center transition-all duration-200 transform -translate-x-2 opacity-0 group-hover:opacity-100 group-hover:translate-x-0">
                  <AiFillRightCircle className="text-primary w-4 h-4" />
                </div>
              </div>
            </div>
          ) : (
            <div
              onClick={onOpen}
              className={cn(
                "group relative block w-full rounded-xl border border-border bg-card p-6",
                "shadow-sm transition-all duration-200 cursor-pointer",
                "hover:shadow-md hover:border-primary/30 hover:-translate-y-0.5"
              )}
            >
              <div className="absolute top-3 right-3">
                <span className="inline-flex items-center justify-center rounded-md bg-muted px-2 py-0.5 text-xs font-mono font-medium text-muted-foreground border border-border">
                  F4
                </span>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg">
                  <img src={`${assetsBase}assets/icons/files.gif`} width={40} alt="Invoice" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-semibold text-card-foreground group-hover:text-primary transition-colors">
                    {t('newInvoice')}
                  </h3>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      <InvoiceModal isOpen={isOpen} onClose={onClose} />
    </div>
  )
}

export default Invoice
