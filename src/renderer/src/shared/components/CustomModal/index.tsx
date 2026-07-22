import { ReactNode } from 'react'
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
}

const CustomModal = ({ modalProps, overlayProps, contentProps, bodyProps, isOpen, onClose, title, children, footer, headerActions, onMinimize, minimizeTooltip, closeTooltip }: CustomModalProps) => {
  const isFull = modalProps?.size === 'full';
  const { className: contentClassName, style: contentStyle, ...restContentProps } = contentProps || {};

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        className={cn(
          isFull ? "w-[98vw] h-[96vh] max-w-[98vw] p-0 rounded-lg border-none flex flex-col gap-0 [&>button]:hidden" : "",
          contentClassName
        )}
        style={contentStyle}
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
                      onClick={onClose}
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
        <div className={cn("overflow-y-auto flex-1", isFull ? "p-0" : "px-6 py-4")} style={bodyProps}>
          {children}
        </div>
        {footer && <DialogFooter className="px-6 pb-6 flex-shrink-0">{footer}</DialogFooter>}
      </DialogContent>
    </Dialog>
  )
}

export default CustomModal;
