import { ReactNode, useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
} from '@web/shared/components/ui/dialog'
import { Button } from '@web/shared/components/ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@web/shared/components/ui/tooltip'
import { AiOutlineMinus, AiOutlineClose } from 'react-icons/ai'
import { cn } from '@web/shared/utils/cn'

interface props {
  [key: string]: any
}

interface CustomModalProps {
  modalProps?: props;
  overlayProps?: props;
  contentProps?: props;
  bodyProps?: props;
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children?: ReactNode;
  footer?: ReactNode;
  headerActions?: ReactNode;
  onMinimize?: () => void;
  minimizeTooltip?: string;
  closeTooltip?: string;
  confirmOnClose?: boolean;
  confirmTitle?: string;
  confirmMessage?: string;
  confirmMinimizeLabel?: string;
  confirmDiscardLabel?: string;
  confirmCancelLabel?: string;
}

const CustomModal = ({
  modalProps, overlayProps, contentProps, bodyProps,
  isOpen, onClose, title, children, footer, headerActions,
  onMinimize, minimizeTooltip, closeTooltip,
  confirmOnClose = false,
  confirmTitle = 'Unsaved changes',
  confirmMessage = 'You have unsaved data. What would you like to do?',
  confirmMinimizeLabel = 'Save & Minimize',
  confirmDiscardLabel = 'Discard',
  confirmCancelLabel = 'Cancel',
}: CustomModalProps) => {
  const isFull = modalProps?.size === 'full';
  const { className: contentClassName, style: contentStyle, ...restContentProps } = contentProps || {};
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setShowConfirm(false);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!showConfirm || !onMinimize) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        setShowConfirm(false);
        onMinimize();
      }
    };
    document.addEventListener('keydown', handler, true);
    return () => document.removeEventListener('keydown', handler, true);
  }, [showConfirm, onMinimize]);

  const handleEscapeKeyDown = (e: Event) => {
    if (!showConfirm && confirmOnClose) {
      e.preventDefault();
      setShowConfirm(true);
    }
  };

  const handleInteractOutside = (e: Event) => {
    if (!showConfirm && confirmOnClose) {
      e.preventDefault();
      setShowConfirm(true);
    }
  };

  const handleXClick = () => {
    if (confirmOnClose && !showConfirm) {
      setShowConfirm(true);
    } else {
      onClose();
    }
  };

  const handleConfirmMinimize = () => {
    setShowConfirm(false);
    if (onMinimize) onMinimize();
  };

  const handleConfirmDiscard = () => {
    setShowConfirm(false);
    setTimeout(() => onClose(), 50);
  };

  const handleConfirmCancel = () => {
    setShowConfirm(false);
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DialogContent
          className={cn(
            isFull ? "w-[98vw] h-[96vh] max-w-[98vw] p-0 rounded-lg border-none flex flex-col gap-0 [&>button]:hidden" : "",
            contentClassName
          )}
          style={contentStyle}
          onEscapeKeyDown={handleEscapeKeyDown}
          onInteractOutside={handleInteractOutside}
          {...restContentProps}
        >
          <DialogHeader className="px-6 pt-6 flex-shrink-0 flex flex-row items-center justify-between space-y-0">
            {title && <DialogTitle>{title}</DialogTitle>}
            <div className="flex items-center gap-2">
              {headerActions}
              {isFull && onMinimize && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="h-8 w-8 text-orange-600 border-orange-300 hover:bg-orange-50 hover:text-orange-700"
                        onClick={onMinimize}
                      >
                        <AiOutlineMinus className="w-4 h-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>{minimizeTooltip || 'Minimize'}</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
              {isFull && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="h-8 w-8 text-red-600 border-red-300 hover:bg-red-50 hover:text-red-700"
                        onClick={handleXClick}
                      >
                        <AiOutlineClose className="w-4 h-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>{closeTooltip || 'Close'}</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </div>
          </DialogHeader>
          <div className={cn("relative overflow-y-auto flex-1", isFull ? "p-0" : "px-6 py-4")} style={bodyProps}>
            {children}
          </div>
          {footer && <DialogFooter className="px-6 pb-6 flex-shrink-0">{footer}</DialogFooter>}
        </DialogContent>
      </Dialog>

      {showConfirm && createPortal(
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40"
          onClick={(e) => { if (e.target === e.currentTarget) handleConfirmCancel(); }}
        >
          <div className="bg-popover rounded-xl shadow-2xl border p-6 max-w-sm w-full mx-4">
            <h3 className="text-lg font-semibold mb-2">{confirmTitle}</h3>
            <p className="text-sm text-muted-foreground mb-6">{confirmMessage}</p>
            <div className="flex flex-col gap-2">
              {onMinimize && (
                <Button
                  onClick={handleConfirmMinimize}
                  className="bg-orange-500 hover:bg-orange-600 text-white"
                >
                  <AiOutlineMinus className="mr-2 h-4 w-4" />
                  {confirmMinimizeLabel}
                </Button>
              )}
              <div className="flex gap-2">
                <Button variant="outline" onClick={handleConfirmDiscard} className="flex-1">
                  {confirmDiscardLabel}
                </Button>
                <Button variant="ghost" onClick={handleConfirmCancel} className="flex-1">
                  {confirmCancelLabel}
                </Button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  )
}

export default CustomModal;
